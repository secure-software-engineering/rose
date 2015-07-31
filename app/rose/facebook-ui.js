/*
Copyright (C) 2013-2015
    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */
import SystemConfigModel from 'rose/models/system-config';
import UserSettingsModel from 'rose/models/user-settings';
import CommentsCollection from 'rose/collections/comments';
import ExtractorEngine from 'rose/extractor-engine';
import ExtractorCollection from 'rose/collections/extractors';

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
  FacebookUI.prototype._configs = new SystemConfigModel();
  FacebookUI.prototype._settings = new UserSettingsModel();
  FacebookUI.prototype._statusUpdateExtractor = {};

  function FacebookUI() {
    this._configs.fetch();
    this._settings.fetch();
    this._comments.fetch();
    var extractorsCol = new ExtractorCollection();
    extractorsCol.fetch({success: function extractorsLoaded(col){
      this._statusUpdateExtractor = col.findWhere({name: 'status-update'});
    }.bind(this)});

    //load styles
    loadCss('res/semantic/semantic.min.css');
    loadCss('res/main.css');

    //Init internationlization
    var options;
    options = {
      debug: true, //remove on production
      fallbackLng: 'en',
      load: 'unspecific'
    };

    var isLanguageSet = this._settings.get('currentLanguage') !== null || this._settings.get('currentLanguage') !== undefined;
    var isLanguageNotAutoDetect = this._settings.get('currentLanguage') !== 'auto';
    if (isLanguageSet && isLanguageNotAutoDetect) {
      options.lng = this._settings.get('currentLanguage');
    }
    else {
      options.lng = options.fallbackLng;
    }

    var loadTranslation = new RSVP.Promise(function(resolve) {
      var details, resource;
      resource = 'res/locales/' + options.lng +'/translation.json';
      details = {
        url: resource,
        method: 'GET',
        async: false,
        contentType: 'text'
      };
      kango.xhr.send(details, function(data) {
        resolve(data.response);
      });
    });

    loadTranslation.then(function(data) {
      options.resStore = {};
      options.resStore[options.lng] = {translation: JSON.parse(data)};
      i18n.init(options);

      Handlebars.registerHelper('I18n', function(i18nKey) {
        var translation = i18n.t(i18nKey);
        return new Handlebars.SafeString(translation);
      });

      //Search for the container which is streamed with content
      // than attach ui and event + MutationObserver
      this.injectUI();
      var globalContainer = $('#globalContainer')[0];

      //create MutationObserver to inject elements when new content is loaded into DOM
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      var observer = new MutationObserver(this.redrawUI.bind(this));
      observer.observe(globalContainer, {
        childList: true,
        subtree: true
      });
    }.bind(this));
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
        $('.ui.radio.checkbox').checkbox();
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
      $('body > div').wrapAll( '<div class="pusher" />');
      try {
        var tpl = template();
      }
      catch(e) {
        console.log(e);
      }
      $('body').prepend(tpl);
      $('.ui.sidebar').sidebar();
      $('.ui.radio.checkbox').checkbox();
      if(this._configs.get('roseCommentsRatingIsEnabled')) {
        $('.ui.rating').rating();
      }
      else {
        $('.ui.rating').remove();
      }
    }.bind(this));
  };

  FacebookUI.prototype._injectCommentRibbon = function() {
    this._getTemplate('commentLabel').then(function(source) {
      return Handlebars.compile(source);
    }).then(function(template) {
      $('.userContentWrapper').not('.rose.comment + .userContentWrapper').not($('.userContentWrapper').has('div > .userContentWrapper')).before(template());
    });
  };

  FacebookUI.prototype._injectReminder = function() {
    if ($('.ui.nag').length === 0 && this._settings.get('commentReminderIsEnabled')) {
      this._getTemplate('reminder').then(function(source) {
      return Handlebars.compile(source);
      }).then(function(template) {
        $('body').append(template());
        $('.ui.nag').nag({ expires: 1 });
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
    $('body').on('click', '.rose.comment', function(evt) {
        // Receive id for content element
        var $container = $(evt.currentTarget).siblings('.userContentWrapper');
        var extractorResult = ExtractorEngine.extractFieldsFromContainer($container, this._statusUpdateExtractor);
        if (extractorResult.contentId === undefined) {
          console.error('Could not obtain contentId!');
          return;
        }

        //Show sidebar
        $('.ui.sidebar').sidebar('push page');
        $('.ui.sidebar').sidebar('show');

        //Check if comment for this content exists and set form
        this._activeComment = undefined;
        this._comments.fetch({success: function onCommentsFetched(){
          this._activeComment = this._comments.findWhere({contentId: extractorResult.contentId});
          if (this._activeComment !== undefined) {
            var activeComment = this._activeComment.toJSON();
            if (activeComment.text !== undefined) {
              for (var i = 0; i < activeComment.text.length; i++) {
                $('.sidebar textarea:eq(' + i + ')').val(activeComment.text[i]);
              }
            }

            if(this._configs.get('roseCommentsRatingIsEnabled')) {

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
            if(extractorResult.sharerId === undefined) {
              this._activeComment = this._comments.create({contentId: extractorResult.contentId, createdAt: (new Date()).toJSON()});
            }
            else {
              this._activeComment = this._comments.create({contentId: extractorResult.contentId, sharerId: extractorResult.sharerId, createdAt: (new Date()).toJSON()});
            }
            $('.sidebar textarea').val('');
            if(this._configs.get('roseCommentsRatingIsEnabled')) {
              $('.ui.rating').rating('set rating', 0);
            }
          }
        }.bind(this)});

    }.bind(this));

    //Save a comment
    $('body').on('click', '.sidebar .save.button', function() {
        var comment = {};
        comment.text = [];
        $('.sidebar textarea').each(function getVals(i) {
          comment.text[i] = $(this).val();
        });
        if(this._configs.get('roseCommentsRatingIsEnabled')) {
          comment.rating = $('.ui.rating').rating('get rating') || [];
        }
        comment.network = 'facebook';
        comment.updatedAt = (new Date()).toJSON();
        this._activeComment.set(comment);
        this._activeComment.save();
        $('.ui.sidebar').sidebar('hide');
        $('.ui.sidebar.uncover').sidebar('hide');
    }.bind(this));

  };

  return FacebookUI;

})();
