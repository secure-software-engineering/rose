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
      container.register('userSettings:main', config, { instantiate: false, singleton: true });
      container.injection('controller', 'userSettings', 'userSettings:main');
      container.injection('route', 'userSettings', 'userSettings:main');

      Ember.set(application, 'locale', config.get('currentLanguage'));

      application.advanceReadiness();
    });
  });
}

export default {
  name: 'user-settings',
  initialize: initialize
};
