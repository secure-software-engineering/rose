/**
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

/* global KangoAPI, kango */

KangoAPI.onReady(function () {

  // Initialization of i18next
  var options = {
    getAsync: false,
    fallbackLng: 'en',
    resGetPath: '../res/locales/__lng__/__ns__.json'
  };
  i18n.init(options);

  // Initialization of moment.js
  moment.lang(i18n.lng());

  // Initialization of ROSE app
  var App = window.App = Ember.Application.create({
    LOG_TRANSITIONS: true,
    debugMode: true
  });

  App.Router.map(function () {
    this.route('about');
    this.route('backup');
    this.route('diary');
    this.route('documentation');
    this.route('settings');
    this.resource('facebook', function () {
      this.route('interactions');
      this.route('comments');
      this.route('privacy');
    });
    this.resource('google', function () {
      this.route('interactions');
      this.route('comments');
      this.route('privacy');
    });
  });

  App.IndexController = Ember.Controller.extend({
    version: function () {
      var extensionInfo = kango.getExtensionInfo();
      return extensionInfo.version;
    }.property()
  });

  App.BackupController = Ember.Controller.extend({
    isValid: false,
    isEmpty: true,

    jsonValidator: function () {
      var text = this.get('textfield');
      try {
        var jsonObj = JSON.parse(text);
        this.set('isValid', true);
      } catch (e) {
        this.set('isValid', false);
      }
    }.observes('textfield'),

    lengthChecker: function () {
      var text = this.get('textfield');
      if (text.length > 0) {
        this.set('isEmpty', false);
      } else {
        this.set('isEmpty', true);
      };
    }.observes('textfield'),

    isEmptyOrValid: function () {
      if (this.get('isValid') || this.get('isEmpty')) {
        return true;
      }
      return false;
    }.property('isValid', 'isEmpty'),

    actions: {
      backup: function () {
        var self = this;
        var getStorage = Ember.RSVP.Promise(function (resolve) {
          Storage.getStorageAsJson(resolve);
        });

        getStorage.then(function (data) {
          self.set('textfield', data);
        }).then(function () {
          $('textarea').select();
        });
      },

      restore: function () {
        if (this.get('isValid') && !this.get('isEmpty')) {
          var self = this;
          var jsonObj = JSON.parse(this.get('textfield'));
          var setStorage = Ember.RSVP.Promise(function (resolve) {
            Storage.setStorage(jsonObj, resolve);
          });

          setStorage.then(function () {
            self.set('textfield', '');
          });
        }
      },
    }
  });

  App.UploadFileView = Ember.TextField.extend({
    type: 'file',
    classNames: ['hidden'],

    change: function (evt) {
      var self = this;
      var input = evt.target;
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var fileContent = e.srcElement.result;
          self.set('fileContent', fileContent);
        };
        reader.readAsText(input.files[0]);
      }
    }
  });

  App.DiaryRoute = Ember.Route.extend({
    model: function () {
      return new Ember.RSVP.Promise(function (resolve) {
        Storage.getDiaryEntries(resolve);
      });
    },

    setupController: function (controller, response) {
      var model = [];
      response.forEach(function (item) {
        model.pushObject(item);
      });
      controller.set('model', model);
    }
  });

  App.DiaryController = Ember.ArrayController.extend({
    activeEntry: -1,

    actions: {
      saveEntry: function () {
        var text = this.get('diaryText');
        if (typeof text === 'undefined' || text === null) {
          return;
        }

        this.set('diaryText', '');

        // That's the way it should be but storage class needs to be refactored

        // var addEntry = Ember.RSVP.Promise(function(resolve, reject) {
        //     Storage.addDiaryEntry(text, resolve);
        // });

        // addEntry
        //     .then(function() {
        //         console.log("get entries");
        //         var getEntries = Ember.RSVP.Promise(function(resolve, reject) {
        //             Storage.getDiaryEntries(resolve);
        //         });
        //         getEntries.then(function(data) {
        //             console.log("set entries");
        //             var model = JSON.parse(data).reverse();
        //             self.set('model', model);
        //         });
        //     });

        // add new diary entry to ROSE storage
        if (this.get('activeEntry') < 0) {
          Storage.addDiaryEntry(text);
        } else {
          Storage.updateDiaryEntry(this.get('activeEntry'), text);
          this.set('activeEntry', -1);
        }

        // set updated dataiary in controller
        // FIXME: check if kango.storage.setItem is sync or async
        // looks like it is async because getDiaryEntries is executed before addDiaryEntry
        Ember.run.later(this, function () {
          var self = this;

          var promise = Ember.RSVP.Promise(function (resolve) {
            Storage.getDiaryEntries(resolve);
          });

          promise.then(function (data) {
            var model = [];
            data.forEach(function (item) {
              model.pushObject(item);
            });
            self.set('model', model.reverse());
          });
        }, 50);
      },

      deleteEntry: function (item) {
        // remove from UI
        this.get('model').removeObject(item);
        // remove from ROSE storage
        Storage.removeDiaryEntry(item.index);
      },

      editEntry: function (item) {
        this.set('diaryText', item.content);
        this.set('activeEntry', item.index);
      },

      cancel: function () {
        this.set('diaryText', '');
      }
    }
  });

  App.Interaction = Ember.Object.extend();

  App.FacebookInteractionsRoute = Ember.Route.extend({
    model: function () {
      return new Ember.RSVP.Promise(function (resolve) {
        Storage.getInteractions('Facebook', resolve);
      });
    },

    setupController: function (controller, response) {
      var model = [];
      response.forEach(function (item) {
        model.pushObject(App.Interaction.create(item));
      });
      controller.set('model', model.reverse());
    }
  });

  App.FacebookInteractionsController = Ember.ArrayController.extend({
    platform: 'Facebook',

    activeInteractions: function () {
      var model = this.get('model');
      return model.filterBy('deleted', false);
    }.property('model.@each.deleted'),

    actions: {
      delete: function (interaction) {
        interaction.set('deleted', true);
        Storage.removeInteraction(interaction.get('index'), this.get('platform'));
      },
      hide: function (interaction) {
        interaction.set('hidden', true);
        Storage.hideInteraction(interaction.get('index'), true, this.get('platform'));
      },
      show: function (interaction) {
        interaction.set('hidden', false);
        Storage.hideInteraction(interaction.get('index'), false, this.get('platform'));
      }
    }
  });

  App.FacebookInteractionsView = Ember.View.extend({
    initPopups: function () {
      this.$('.red.sign.icon')
        .popup();
    }.on('didInsertElement')
  });

  App.Comment = Ember.Object.extend();

  App.FacebookCommentsRoute = Ember.Route.extend({
    model: function () {
      return [{
        createdAt: '2013-11-12T14:56:11.415Z',
        hidden: false
      }, {
        createdAt: '2013-11-12T14:56:11.415Z',
        hidden: false
      }, {
        createdAt: '2013-11-12T14:56:11.415Z',
        hidden: false
      }, {
        createdAt: '2013-11-12T14:56:11.415Z',
        hidden: false
      }];

      // return new Ember.RSVP.Promise(function (resolve, reject) {
      //     Storage.getComments("Facebook", resolve);
      // });
    },

    setupController: function (controller, response) {
      var model = [];
      response.forEach(function (item) {
        model.pushObject(App.Comment.create(item));
      });
      controller.set('model', model.reverse());
    }
  });

  App.FacebookCommentsController = Ember.ArrayController.extend({
    actions: {
      delete: function (comment) {
        var model = this.get('model');
        model.removeObject(comment);
        // TODO
      },
      hide: function (comment) {
        comment.set('hidden', true);
        // TODO
      },
      show: function (comment) {
        comment.set('hidden', false);
        // TODO
      }
    }
  });

  App.FacebookCommentsView = Ember.View.extend({
    initPopups: function () {
      this.$('.red.sign.icon')
        .popup();
    }.on('didInsertElement')
  });

  App.BackupView = Ember.View.extend({
    focusTextarea: function () {
      this.$('.ui.form textarea').focus();
    }.on('didInsertElement')
  });

  App.SettingsController = Ember.Controller.extend({
    showReminder: function () {
      return this.get('model.reminder.isActive');
    }.property('model.reminder.isActive'),

    updateReminder: function () {
      var reminder = {
        isActive: this.get('showReminder')
      };

      Storage.setSettings('reminder', reminder);
      console.log(this.get('reminder'));
    }.observes('showReminder'),
  });

  App.SettingsRoute = Ember.Route.extend({
    model: function () {
      return new Ember.RSVP.Promise(function (resolve) {
        Storage.getSettings(resolve);
      });
    },

    setupController: function (controller, response) {
      controller.set('model', Ember.Object.create(response));
    }
  });

  Ember.Handlebars.helper('timeFormatted', function (time) {
    return new Handlebars.SafeString(moment(time).format('LLLL'));
  });

  Ember.Handlebars.helper('timeAgo', function (time) {
    return new Handlebars.SafeString(moment(time).fromNow());
  });

  Ember.Handlebars.helper('pretty', function (object) {
    return new Handlebars.SafeString(JSON.stringify(object, null, 2));
  });

  Ember.Handlebars.helper('I18n', function (i18nKey) {
    var result = i18n.t(i18nKey);
    return new Handlebars.SafeString(result);
  });

});
