import DS from 'ember-data';

export default DS.Model.extend({
  roseCommentsIsEnabled: DS.attr('boolean'),
  roseCommentsRatingIsEnabled: DS.attr('boolean'),
  salt: DS.attr('string'),
  hashLength: DS.attr('number', { defaultValue: 5 }),
  repositoryURL: DS.attr('string'),
  autoUpdateIsEnabled: DS.attr('boolean'),
  forceSecureUpdate: DS.attr('boolean'),
  fileName: DS.attr('string', { defaultValue: 'rose-study-configuration.json' }),
  networks: DS.hasMany('network', { async: true }),
  fingerprint: DS.attr('string'),
  updateInterval: DS.attr('number')
});
