var model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('Comment')
});

export default model;
