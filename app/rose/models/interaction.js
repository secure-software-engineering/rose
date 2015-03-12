var model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('Interaction')
});

export default model;
