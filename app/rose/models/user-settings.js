let model = Backbone.Model.extend({
  sync: Backbone.kangoforage.sync('userSetting')
});

export default model;
