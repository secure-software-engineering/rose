import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  namespace: DS.attr('string'),
  isEnabled: DS.attr('boolean')
});
