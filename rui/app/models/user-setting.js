import DS from 'ember-data';

export default DS.Model.extend({
  commentReminderIsEnabled: DS.attr('boolean'),
  developerModeIsEnabled: DS.attr('boolean'),
  currentLanguage: DS.attr('string'),

  saveWhenDirty: function() {
    if (this.get('isDirty')) {
      this.save();
    }
  }.observes('isDirty'),

  setupModel: function() {
    this.get('isDirty');
  }.on('init')
});
