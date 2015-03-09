import Interaction from '../models/interaction';

var collection = Backbone.Collection.extend({
  model: Interaction,
  sync: Backbone.kangoforage.sync('Interactions'),
});

export default collection;
