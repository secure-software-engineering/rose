import Ember from 'ember';
import languages from '../locales/languages';

export default Ember.Controller.extend({
  availableLanguages: languages,

  changeI18nLanguage: function() {
    this.set('i18n.locale', this.get('settings.user.currentLanguage'));
  }.observes('settings.user.currentLanguage'),

  onChange: function() {
    this.send('saveSettings');
  }.observes('settings.user.currentLanguage'),

  actions: {
    saveSettings: function() {
      this.get('settings.user').save();
    },

    confirm() {
      this.send('openModal', 'modal/reset-config');
    },

    manualUpdate() {
      kango.dispatchMessage('Update');
    }
  }
});
