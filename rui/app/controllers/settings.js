import Ember from 'ember';
import languages from '../locales/languages';

export default Ember.Controller.extend({
  availableLanguages: languages,

  changeI18nLanguage: function() {
    const application = this.container.lookup('application:main');
    Ember.set(application, 'locale', this.get('userSettings.currentLanguage'));
  }.observes('userSettings.currentLanguage'),

  onChange: function() {
    this.send('saveSettings');
  }.observes('userSettings.currentLanguage'),

  actions: {
    saveSettings: function() {
      this.get('userSettings').save();
    },

    resetRose() {
      this.set('userSettings.firstRun', true);
      this.get('userSettings').save();
    }
  }
});
