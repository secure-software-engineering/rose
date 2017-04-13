import DS from 'ember-data';

export default DS.Model.extend({
  trackingEnabled: DS.attr('boolean', { defaultValue: true }),
  commentReminderIsEnabled: DS.attr('boolean', { defaultValue: true }),
  developerModeIsEnabled: DS.attr('boolean'),
  currentLanguage: DS.attr('string', { defaultValue: 'en' }),
  firstRun: DS.attr('boolean', { defaultValue: true })
});
