import Ember from 'ember';

export default Ember.Controller.extend({
  jsonData: function() {
    let result = {};

    var models = this.get('model');

    models.forEach(function (model) {
      result[model.type.typeKey] = model.content;
    });

    return JSON.stringify(result, null, 4);
  }.property('model'),

  actions: {
    download: function () {
      window.saveAs(new Blob([this.get('jsonData')]), 'rose-data.txt');
    }
  }
});
