/*
ROSE is a browser extension researchers can use to capture in situ
data on how users actually use the online social network Facebook.
Copyright (C) 2013

    Fraunhofer Institute for Secure Information Technology
    Andreas Poller <andreas.poller@sit.fraunhofer.de>

Authors

    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import SystemConfigModel from 'rose/models/system-config';
import UserSettingsModel from 'rose/models/user-settings';
import CommentsCollection from 'rose/collections/comments';
import ObserverEngine from 'rose/observer-engine';
import ObserverCollection from 'rose/collections/observers';

var loadCss = function loadCss(link) {
  var cssLink;
  cssLink = $('<link>');
  $('head').append(cssLink);
  return cssLink.attr({
    rel: 'stylesheet',
    type: 'text/css',
    href: kango.io.getResourceUrl(link)
  });
};

export default (function () {
  FacebookUI.prototype._activeComment = {};
  FacebookUI.prototype._comments = new CommentsCollection();
  FacebookUI.prototype._likeObserver = {};
  FacebookUI.prototype._configs = new SystemConfigModel();
  FacebookUI.prototype._settings = new UserSettingsModel();

  function FacebookUI() {
    this._configs.fetch();
    this._settings.fetch();

    //Init internationlization
    var options;
    options = {
      debug: true,
      getAsync: false,
      fallbackLng: 'en',
      resGetPath: kango.io.getResourceUrl('res/locales/') + '__lng__/__ns__.json'
    };
    var isLanguageSet = this._settings.get('currentLanguage') !== null || this._settings.get('currentLanguage') !== undefined;
    var isLanguageNotAutoDetect = this._settings.get('currentLanguage') !== 'auto';
    if (isLanguageSet && isLanguageNotAutoDetect) {
      options.lng = this._settings.get('currentLanguage');
    }
    i18n.init(options);
    Handlebars.registerHelper('I18n', function(i18nKey) {
      var result;
      result = i18n.t(i18nKey);
      return new Handlebars.SafeString(result);
    });

    //load styles
    loadCss('res/semantic/semantic.min.css');
    loadCss('res/main.css');

    //fetch existing comments from storage and inject
    this._comments.fetch({success: function() {

      //Search for the container which is streamed with content
      // than attach ui and evetn + MutationObserver
      this.injectUI();
      var globalContainer = $('#globalContainer')[0];

      //create MutationObserver to inject elements when new content is loaded into DOM
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      var observer = new MutationObserver(this.redrawUI.bind(this));
      observer.observe(globalContainer, {
        childList: true,
        subtree: true
      });
    }.bind(this)});

    //Get LikeObserver for contentid generation
    var observersCol = new ObserverCollection();
    observersCol.fetch({success: function(col){
      this._likeObserver = col.findWhere({network: 'facebook', name: 'LikeContent'});
    }.bind(this)});

  }

  FacebookUI.prototype.injectUI = function() {
    this._registerEventHandlers();
    this._injectCommentRibbon();
    this._injectReminder();
    this._injectSidebar();
  };

  FacebookUI.prototype.redrawUI = function() {
    var pageletIds = ['#stream_pagelet', '#pagelet_timeline_recent', '#pagelet_timeline_main_column'];
    for (var i = 0; i < pageletIds.length; i++) {
      if ($(pageletIds[i]).length) {
        this._injectCommentRibbon();
        $('.ui.sidebar').sidebar();
        break;
      }
    }
  };

  FacebookUI.prototype._injectSidebar = function() {
    if ($('.ui.sidebar').length > 0) {
      return;
    }
    return this._getTemplate('sidebar').then(function(source) {
      return Handlebars.compile(source);
    }).then(function(template) {
      $('body').append(template());
      $('.ui.sidebar').sidebar();
      if(this._configs.get('roseCommentsRatingIsEnabled')) {
        $('.ui.rating').rating();
      }
      else {
        $('.ui.rating').remove();
      }
    });
  };

  FacebookUI.prototype._injectCommentRibbon = function() {
    this._getTemplate('commentLabel').then(function(source) {
      return Handlebars.compile(source);
    }).then(function(template) {
      $('.userContentWrapper').not($('.rose.comment + .userContentWrapper')).before(template());
    });
  };

  FacebookUI.prototype._injectReminder = function() {
    if ($('.ui.nag').length === 0 && this._settings.get('commentReminderIsEnabled')) {
      this._getTemplate('reminder').then(function(source) {
      return Handlebars.compile(source);
      }).then(function(template) {
        $('body').append(template());
        $('.ui.nag').nag('show');
      });
    }
  };

  FacebookUI.prototype._getTemplate = function(template) {
    var promise;
    promise = new RSVP.Promise(function(resolve) {
      var details, resource;
      resource = 'res/templates/' + template + '.hbs';
      details = {
        url: resource,
        method: 'GET',
        async: false,
        contentType: 'text'
      };
      return kango.xhr.send(details, function(data) {
        return resolve(data.response);
      });
    });
    return promise;
  };

  FacebookUI.prototype._registerEventHandlers = function() {

    // Start commenting
    $('body').on('click', '.rose.comment', (function(_this) {
      return function(evt) {
        // Receive id for content element
        var patterns = _this._likeObserver.get('patterns');
        var $node = $(evt.target).siblings().find(patterns[0].node);

        var observerResult;
        //Fix this with LikePage Observer or at least through warning
        for (var i = 0; i < patterns.length; i++) {
          observerResult = ObserverEngine.handlePattern($node, patterns[i]);
          if (observerResult !== undefined) {
            break;
          }
        }

        //Show sidebar
        $('.ui.sidebar').sidebar('push page');
        $('.ui.sidebar').sidebar('show');

        //Check if comment for this content exists and set form
        _this._activeComment = undefined;
        _this._comments.fetch({success: function onCommentsFetched(){
          if (observerResult !== undefined) {
              _this._activeComment = _this._comments.findWhere({contentId: observerResult.contentId});
          }
          if (_this._activeComment !== undefined) {
            var activeComment = _this._activeComment.toJSON();
            $('.ui.form textarea').val(activeComment.text);

            if(_this._configs.get('roseCommentsRatingIsEnabled')) {

              if (activeComment.rating) {
                for (var i = 0, len = activeComment.rating.length; i < len;  i++) {
                  $('.ui.rating:eq(' + i + ')').rating('set rating', activeComment.rating[i]);
                }
              }
              else {
                $('.ui.rating').rating('set rating', 0);
              }
            }
          } else {
            //check is update or create
            _this._activeComment = _this._comments.create({contentId: observerResult.contentId, createdAt: (new Date()).toJSON()});
            $('.ui.form textarea').val('');
            if(_this._configs.get('roseCommentsRatingIsEnabled')) {
              $('.ui.rating').rating('set rating', 0);
            }
          }
        }});

      };
    })(this));

    //Save a comment
    $('body').on('click', '.sidebar .save.button', (function(_this) {
      return function() {
        var comment = {};
        comment.text = $('.sidebar textarea').val() || '';
        if(_this._configs.get('roseCommentsRatingIsEnabled')) {
          comment.rating = $('.ui.rating').rating('get rating') || [0,0];
        }
        comment.network = 'facebook';
        comment.updatedAt = (new Date()).toJSON();
        _this._activeComment.set(comment);
        _this._activeComment.save();
        $('.ui.sidebar').sidebar('hide');
        $('.ui.sidebar.uncover').sidebar('hide');
      };
    })(this));

  };

  return FacebookUI;

})();
