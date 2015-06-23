import DS from 'ember-data';

export default DS.Model.extend({
  autoUpdateIsEnabled: DS.attr('boolean'),
  roseCommentsIsEnabled: DS.attr('boolean'),
  roseCommentsRatingIsEnabled: DS.attr('boolean'),
  salt: DS.attr('string'),
  hashLength: DS.attr('number'),
  repositoryURL: DS.attr('string'),
  fingerprint: DS.attr('string')
});
