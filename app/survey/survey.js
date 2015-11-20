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

let SurveyUI = (function () {
  SurveyUI.prototype._configs = new SystemConfigModel();
  SurveyUI.prototype._settings = new UserSettingsModel();

  function SurveyUI() {
    this._configs.fetch();
    this._settings.fetch();

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
      var details;
      details = {
        url: 'res/locales/' + options.lng +'/translation.json',
        method: 'GET',
        async: true,
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

      this.injectSurvey();


    }.bind(this));
  }

  SurveyUI.prototype.injectSurvey = function() {

    if ($('.ui').length > 0) {
      return;
    }
    return this._getTemplate('survey').then(function(source) {
      return Handlebars.compile(source);
    }, function(error) {console.log(error);}).then(function(template) {

      var tpl;
      try {
        tpl = template();
      }
      catch(e) {
        console.log(e);
      }
      $('body').prepend(tpl);
      if(this._configs.get('roseCommentsRatingIsEnabled')) {
        $('.ui .rating').rating();
        $('.ui .rating').prepend('<div class="ui mini horizontal label">(disagree)</div>').append('<div class="ui mini horizontal label">(agree)</div>');
      }
      else {
        $('.ui.rating').remove();
      }
      this._registerEventHandlers();
    }.bind(this),function(error) {console.log(error);});
  };

  SurveyUI.prototype._getTemplate = function(template) {
    return new RSVP.Promise(function(resolve) {
      var details, resource;
      resource = 'res/templates/' + template + '.hbs';
      details = {
        url: resource,
        method: 'GET',
        async: true,
        contentType: 'text'
      };
      return kango.xhr.send(details, function(data) {
        return resolve(data.response);
      });
    });
  };

  SurveyUI.prototype._registerEventHandlers = function() {

    // Start commenting
    $('body').on('click', '.approve', function(evt) {

      (new CommentsCollection()).fetch({success: (commentsCollection) => {

        var disengage = {};
        disengage.type = 'disengage';
        disengage.rating = $('.ui.rating').rating('get rating') || [];
        disengage.network = 'facebook';
        disengage.createdAt = (new Date()).toJSON();
        commentsCollection.create(disengage, {success: () => {
          window.close();
        }});
      }});
    }.bind(this));

    $('body').on('click', '.cancel', function(evt) {
      window.close();
    }.bind(this));

  };

  return SurveyUI;

})();

KangoAPI.onReady(function () {
    new SurveyUI();
});
