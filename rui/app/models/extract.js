import DS from 'ember-data';

export default DS.Model.extend({
  createdAt: DS.attr('number'),
  origin: DS.attr('object'),
  fields: DS.attr()
});
