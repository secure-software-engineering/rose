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

// Initialization of i18next
var options = {
  fallbackLng: 'en',
  resGetPath: kango.io.getResourceUrl('res/locales/__lng__/__ns__.json')
};
i18n.init(options);

// I18n helper method
Handlebars.registerHelper('I18n', function (i18n_key) {
  var result = i18n.t(i18n_key);
  return new Handlebars.SafeString(result);
});

// helper function to inject local css files
var loadCSS = function (resLink) {
  var cssLink = $('<link>');
  $('head').append(cssLink);
  cssLink.attr({
    rel: 'stylesheet',
    type: 'text/css',
    href: kango.io.getResourceUrl(resLink)
  });
};

var getTemplate = function (url) {
  var promise = new RSVP.Promise(function (resolve, reject) {
    var resource = kango.io.getResourceUrl('/res/templates/' + url + '.hbs');
    $.get(resource, function (data) {
      resolve(data);
    });
  });

  return promise;
};

var getSettings = function () {
  var promise = new RSVP.Promise(function (resolve, reject) {
    Storage.getSettings(function (data) {
      resolve(data);
    });
  });

  return promise;
};

var getComment = function (id) {
  var promise = new RSVP.Promise(function (resolve, reject) {
    Storage.getComment(id, 'Facebook', function (comment) {
      resolve(comment);
    });
  });

  return promise;
};

if (window.location.hostname.indexOf('www.facebook.com') > -1) {

  // load css files into facebook DOM
  loadCSS('res/semantic/build/packaged/css/semantic.css');
  loadCSS('res/main.css');

  // add reminder to facebook DOM if not disabled in settings
  getSettings().then(function (settings) {
    if (settings.reminder.isActive) {
      getTemplate('reminder').then(function (source) {
        var template = Handlebars.compile(source);
        return template;
      }).then(function (template) {
        $('body').append(template());

        $('.ui.nag').nag({
          easing: 'swing'
        });
      });
    }
  });

  // add sidebar to facebook DOM
  getTemplate('sidebar').then(function (source) {
    var template = Handlebars.compile(source);
    return template;
  }).then(function (template) {
    $('body').append(template());

    // init sidebar module
    $('.ui.sidebar').sidebar();

    // init rating module
    $('.ui.rating').rating();
  });

  // add comment label to every story item with a fbid
  getTemplate('commentLabel').then(function (source) {
    var template = Handlebars.compile(source);
    return template;
  }).then(function (template) {
    if ($('.fbxWelcomeBoxName').length > 0) {
      $('*[data-timestamp]').prepend(template());
      $('.rose.comment').css('margin', '-5px 0 5px 0');
    } else {
      $('.timelineUnitContainer').has('.fbTimelineFeedbackActions').prepend(template());
      $('.rose.comment').css('margin', '0 0 5px 6px');
    }
  });

  // EVENT HANDLER

  var activeComment = null;

  // when user clicks rose comment sidebar should appear
  $('body').on('click', '.rose.comment', function (evt) {
    var likeObserver = new FacebookLikeObserver();
    var item = likeObserver.handleNode($(evt.target).siblings(), 'status');
    activeComment = item.record.object;

    getComment(activeComment.id).then(function (comment) {
      if (comment == null) {
        $('.ui.form textarea').val('');
      } else {
        $('.ui.form textarea').val(comment.record.text);
      }
    }).then(function () {
      $('.ui.sidebar').sidebar('pushPage');
      $('.ui.sidebar').sidebar('show');
    });
  });

  // when user clicks cancel button sidebar should disappear
  $('body').on('click', '.sidebar .cancel.button', function (evt) {
    $('.ui.sidebar').sidebar('hide');
  });

  // when user clicks save button sidebar should disappear and user input should be saved
  $('body').on('click', '.sidebar .save.button', function (evt) {
    evt.stopPropagation();
    $('.sidebar').sidebar('hide');
    var comment = $('.sidebar textarea').val() || 'no comment';
    var rating = $('.ui.rating').rating('getRating') || 0;
    activeComment.text = comment;
    Storage.addComment(activeComment, 'Facebook');
  });

}
