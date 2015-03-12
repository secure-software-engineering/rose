import Comment from '../models/comment';

var collection = Backbone.Collection.extend({
  model: Comment,
  sync: Backbone.kangoforage.sync('Comments'),
});

export default collection;
