import Observer from '../models/observer';

var collection = Backbone.Collection.extend({
  comparator: 'priority',
  model: Observer,
  sync: Backbone.kangoforage.sync('Observers')
});

export default collection;
