var model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('Extractor')
});

export default model;
