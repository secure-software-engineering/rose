import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  descriptiveName: DS.attr('string'),
  identifier: DS.attr('string'),
  isEnabled: DS.attr('boolean')
});
