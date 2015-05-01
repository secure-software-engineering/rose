import Ember from 'ember';
import languages from '../locales/languages';

export default Ember.Controller.extend({
  commentReminderLabel: function() {
    const t = this.container.lookup('utils:t');
    return (this.get('userSettings.commentReminderIsEnabled')) ? t('yes') : t('no');
  }.property('userSettings.commentReminderIsEnabled'),

  developerModeLabel: function() {
    const t = this.container.lookup('utils:t');
    return (this.get('userSettings.developerModeIsEnabled')) ? t('yes') : t('no');
  }.property('userSettings.developerModeIsEnabled'),

  changeI18nLanguage: function() {
    const application = this.container.lookup('application:main');
    Ember.set(application, 'locale', this.get('userSettings.currentLanguage'));
  }.observes('userSettings.currentLanguage'),

  availableLanguages: languages
});
