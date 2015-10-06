import DS from 'ember-data';

let model = DS.Model.extend({
  text: DS.attr('string'),
  createdAt: DS.attr('string', { defaultValue: () => (new Date()).toJSON() }),
  updatedAt: DS.attr(),
  isPrivate: DS.attr('boolean'),
  rating: DS.attr('array'),
  contentId: DS.attr('string'),
  engage: DS.attr('string'),
  network: DS.attr()
});

export default model;
