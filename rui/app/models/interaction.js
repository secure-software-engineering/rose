import DS from 'ember-data';

export default DS.Model.extend({
  contentId: DS.attr('string'),
  createdAt: DS.attr('string'),
  origin: DS.attr(),
  sharer: DS.attr('string'),
  isPrivate: DS.attr('boolean')
});
