import Ember from 'ember';
import languages from '../locales/languages';

export default Ember.Controller.extend({
  availableLanguages: languages,
  updateIntervals: [
    { label: 'hourly', value: 3600000 },
    { label: 'daily', value: 86400000 },
    { label: 'weekly', value: 604800000 },
    { label: 'monthly', value: 2629743830 },
    { label: 'yearly', value: 31556926000 },
  ],

  changeI18nLanguage: function() {
    this.set('i18n.locale', this.get('settings.user.currentLanguage'));
  }.observes('settings.user.currentLanguage'),

  onChange: function() {
    this.send('saveSettings');
  }.observes('settings.user.currentLanguage', 'settings.system.updateInterval'),

  actions: {
    saveSettings: function() {
      this.get('settings.user').save();
      this.get('settings.system').save();
    },

    confirm() {
      this.send('openModal', 'modal/reset-config');
    },

    manualUpdate() {
      kango.dispatchMessage('Update');
    }
  }
});
