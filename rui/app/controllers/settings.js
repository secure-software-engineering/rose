import Ember from 'ember';
import languages from '../locales/languages';

export default Ember.Controller.extend({
  availableLanguages: languages,

  changeI18nLanguage: function() {
    this.set('i18n.locale', this.get('userSettings.currentLanguage'));
  }.observes('userSettings.currentLanguage'),

  onChange: function() {
    this.send('saveSettings');
  }.observes('userSettings.currentLanguage'),

  actions: {
    saveSettings: function() {
      this.get('userSettings').save();
    },

    confirm() {
      this.send('openModal', 'modal/confirm-reset');
    },

    manualUpdate() {
      kango.dispatchMessage('LoadNetworks');
    }
  }
});
