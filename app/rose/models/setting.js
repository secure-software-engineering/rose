let model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('setting')
});

export default model;
