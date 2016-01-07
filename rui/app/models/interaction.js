import DS from 'ember-data';

export default DS.Model.extend({
  createdAt: DS.attr('string'),
  origin: DS.attr(),
  isPrivate: DS.attr('boolean')
});
