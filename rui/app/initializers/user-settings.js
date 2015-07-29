import Ember from 'ember';

export function initialize(container, application) {
  application.deferReadiness();

  KangoAPI.onReady(function() {
    let store = container.lookup('store:main');
    store.find('user-setting').then(function(configs) {
      let config;
      if (Ember.isEmpty(configs)) {
        config = store.createRecord('user-setting', { id: 0 }).save();
      } else {
        config = configs.get('firstObject');
      }
      application.register('userSettings:main', config, { instantiate: false, singleton: true });
      application.inject('controller', 'userSettings', 'userSettings:main');
      application.inject('route', 'userSettings', 'userSettings:main');

      application.advanceReadiness();
    });
  });
}

export default {
  name: 'user-settings',
  initialize: initialize
};
