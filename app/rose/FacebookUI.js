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
  FacebookUI.prototype._activeItem = {};
  FacebookUI.prototype._comments = new CommentsCollection();
  FacebookUI.prototype._likeObserver = {};

  function FacebookUI() {
    var options;
    options = {
      debug: true,
      getAsync: false,
      fallbackLng: 'en',
      resGetPath: kango.io.getResourceUrl('res/locales/') + '__lng__/__ns__.json'
    };
    i18n.init(options);
    Handlebars.registerHelper('I18n', function(i18nKey) {
      var result;
      result = i18n.t(i18nKey);
      return new Handlebars.SafeString(result);
    });
    loadCss('res/semantic/semantic.min.css');
    loadCss('res/main.css');

    //fetch existing comments from storage
    this._comments.fetch({success: function(col, res, options) {
      options._this._registerEventHandlers();
      options._this._injectCommentRibbon();
      options._this._injectReminder();
      options._this._injectSidebar();

      //create MutationObserver to inject elements when new content is loaded into DOM
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

      var observer = new MutationObserver(function(mutations, observer) {
          observer._this._injectCommentRibbon();
      });
      observer._this = options._this;

      // define what element should be observed by the observer
      // and what types of mutations trigger the callback
      observer.observe(document.getElementById('stream_pagelet'), {
        childList: true,
        subtree: true
        // attributes: true
      });
    }, _this: this});

    //Get LikeObserver for contentid generation
    var observers = new ObserverCollection();
    observers.fetch({success: function(col, res, options){
      options._this._likeObserver = col.findWhere({network: 'facebook', name: 'LikeContent'});
    },_this: this});

  }

  FacebookUI.prototype.injectUI = function() {};

  FacebookUI.prototype.redrawUI = function() {
    return this._injectCommentRibbon();
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
      return $('.ui.rating').rating();
    });
  };

  FacebookUI.prototype._injectCommentRibbon = function() {
    return this._getTemplate('commentLabel').then(function(source) {
      return Handlebars.compile(source);
    }).then(function(template) {
      if ($('.fbxWelcomeBoxName').length > 0) {
        $("*[data-timestamp]").not($('*[data-timestamp] .rose.comment').parent()).prepend(template());
        if ($("*[data-timestamp]").length <= 0) {
          return $('.userContentWrapper').not($('.userContentWrapper .rose.comment').parent()).prepend(template());
        }
      } else {
        $(".timelineUnitContainer").has(".fbTimelineFeedbackActions").not($(".timelineUnitContainer .rose.comment").parent()).prepend(template()).addClass('timeline');
        return $('.rose.comment').addClass('timeline');
      }
    });
  };

  FacebookUI.prototype._injectReminder = function() {
    if ($('.ui.nag').length > 0) {
      return;
    }
    return this._getSettings().then((function(_this) {
      return function(settings) {
        if (settings.reminder.isActive) {
          return _this._getTemplate('reminder');
        }
      };
    })(this)).then(function(source) {
      return Handlebars.compile(source);
    }).then(function(template) {
      $('body').append(template());
      return $('.ui.nag').nag({
        easing: 'swing'
      });
    });
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

  FacebookUI.prototype._getSettings = function() {
    var promise;
    promise = new RSVP.Promise(function(resolve) {
      // return Storage.getSettings(resolve);
    });
    return promise;
  };

  FacebookUI.prototype._registerEventHandlers = function() {

    //Cancel
    $('body').on('click', '.sidebar .cancel.button', function() {
      return $('.ui.sidebar').sidebar('hide');
    });

    //Save a comment
    $('body').on('click', '.sidebar .save.button', (function(_this) {
      return function() {
        _this._activeItem.text = $('.sidebar textarea').val() || '';
        _this._activeItem.rating = $('.ui.rating').rating('get rating') || 0;
        _this._activeItem.network = 'facebook';
        _this._activeItem.createdAt = Date.now();
        //check is update or create
        _this._comments.create(_this._activeItem);
        $('.ui.sidebar').sidebar('hide');
      };
    })(this));

    // Start commenting
    $('body').on('click', '.rose.comment', (function(_this) {
      return function(evt) {
        // Receive id for content element
        _this._activeItem = {};
        var patterns = _this._likeObserver.get('patterns');
        var $node = $(evt.target).siblings().find(patterns[0].node);

        var observerResult;
        //Fix this with LikePage Observer or at least through warning
        _this._activeItem.contentId = Math.random();
        for (var i = 0; i < patterns.length; i++) {
          observerResult = ObserverEngine.handlePattern($node, patterns[i]);
          if (observerResult !== undefined) {
            _this._activeItem.contentId = observerResult.contentId;
            break;
          }
        }

        // if ($('.fbxWelcomeBoxName').length > 0) {
        //   item = _this._likeObserver.handleNode($(evt.target).siblings(), 'status');
        // } else {
        //   item = _this._likeObserver.handleNode($(evt.target), 'timeline');
        // }

        //Show sidebar
        $('.ui.sidebar').sidebar('push page');
        $('.ui.sidebar').sidebar('show');

        //Check if comment for this content exists and set form
        var comment = _this._comments.findWhere({contentId: _this._activeItem.contentId});
        if (comment !== undefined) {
          var activeComment = comment.toJSON();
          var rating;
          $('.ui.form textarea').val(activeComment.text);
          for (var i = 0, len = activeComment.rating.length; i < len;  i++) {
            rating = activeComment.rating[i];
            $('.ui.rating:eq(' + i + ')').rating('set rating', rating);
          }
        } else {
          $('.ui.form textarea').val('');
          $('.ui.rating').rating('set rating', 0);
        }

      };
    })(this));

  };

  return FacebookUI;

})();
