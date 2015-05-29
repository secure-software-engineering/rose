import Extractor from '../models/extractor';

var collection = Backbone.Collection.extend({
  model: Extractor,
  sync: Backbone.kangoforage.sync('Extractors')
});

export default collection;
