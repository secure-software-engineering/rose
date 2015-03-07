var model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('Observer')
});

export default model;
