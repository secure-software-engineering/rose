import DS from 'ember-data';

export default DS.Model.extend({
  roseCommentsIsEnabled: DS.attr('boolean'),
  roseCommentsRatingIsEnabled: DS.attr('boolean'),
  salt: DS.attr('string'),
  hashLength: DS.attr('number'),
  repositoryUrl: DS.attr('string'),
  autoUpdateIsEnabled: DS.attr('boolean'),
  fileName: DS.attr('string', { defaultValue: 'rose-study-configuration.txt' }),

  saveWhenDirty: function() {
    if (this.get('isDirty')) {
      this.save();
    }
  }.observes('isDirty'),

  setupModel: function() {
    this.get('isDirty');
  }.on('init')
});
