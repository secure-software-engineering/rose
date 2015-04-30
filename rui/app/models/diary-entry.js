import DS from 'ember-data';

let model = DS.Model.extend({
  text: DS.attr('string'),
  createdAt: DS.attr('string', { defaultValue: () => (new Date()).toJSON() }),
  updatedAt: DS.attr(),
  isPrivate: DS.attr('boolean', { defaultValue: false })
});

export default model;
