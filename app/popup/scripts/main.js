App = window.App = Ember.Application.create({
	LOG_TRANSITIONS: true
});

App.Router.map(function () {
	this.route("about");
	this.route("backup");
	this.route("diary");
	this.route("documentation");
	this.route("settings");
	this.resource('facebook', function () {
		this.route('interactions');
		this.route('comments');
		this.route('security');
	});
	this.resource('google', function () {
		this.route('interactions');
		this.route('comments');
		this.route('security');
	});
});

App.BackupController = Ember.Controller.extend({
	actions: {
		backup: function () {
			var getStorage = Ember.RSVP.Promise(function (resolve, reject) {
				Storage.getStorageAsJson(resolve);
			});

			getStorage.then(function (data) {
				var blob = new Blob([data], {
					type: "text/plain;charset=utf-8"
				});
				saveAs(blob, "rose-storage.txt");
			});
		}
	}
});

App.DiaryRoute = Ember.Route.extend({
	model: function () {
		return new Ember.RSVP.Promise(function (resolve, reject) {
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
	actions: {
		saveEntry: function () {
			var self = this;
			var text = this.get('diaryText');
			if (text === "") {
				return;
			}

			this.set('diaryText', "");

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
			Storage.addDiaryEntry(text);

			// set updated dataiary in controller
			// FIXME: check if kango.storage.setItem is sync or async
			// looks like it is async because getDiaryEntries is executed before addDiaryEntry
			Ember.run.later(this, function () {
				var self = this;

				var promise = Ember.RSVP.Promise(function (resolve, reject) {
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
			debugger;
			Storage.removeDiaryEntry(item.index);
		},

		editEntry: function (item) {
			this.set('diaryText', item.content);
		},

		cancel: function () {
			this.set('diaryText', "");
		}
	}
});

App.FacebookInteractionsRoute = Ember.Route.extend({
	model: function (argument) {
		return [1, 2, 3, 4];
	}
});

App.SettingsView = Ember.View.extend({
	activateCheckbox: function () {
		this.$('.ui.checkbox').checkbox();
	}.on('didInsertElement')
});

Ember.Handlebars.helper('timeAgo', function (time) {
	return new Handlebars.SafeString(moment(time).fromNow());
});