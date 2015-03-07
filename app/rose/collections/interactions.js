import Interaction from '../models/interaction';

var collection = Backbone.Collection.extend({
  model: Interaction,
  sync: Backbone.kangoforage.sync('Interaction'),
});

export default collection;
