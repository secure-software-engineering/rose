import DS from 'ember-data';

export default DS.Model.extend({
  trackingEnabled: DS.attr('boolean'),
  autoUpdateIsEnabled: DS.attr('boolean'),
  secureUpdateIsEnabled: DS.attr('boolean'),
  forceSecureUpdate: DS.attr('boolean'),
  roseCommentsIsEnabled: DS.attr('boolean'),
  roseCommentsRatingIsEnabled: DS.attr('boolean'),
  salt: DS.attr('string'),
  hashLength: DS.attr('number'),
  repositoryURL: DS.attr('string'),
  updateInterval: DS.attr('number'),
  fingerprint: DS.attr('string'),
  fileName: DS.attr('string'),
  lastChecked: DS.attr('number'),
  lastUpdated: DS.attr('number')
});
