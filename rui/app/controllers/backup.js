import Ember from 'ember';

export default Ember.Controller.extend({
  jsonData: function() {
    let result = {};

    var models = this.get('model');

    models.forEach(function (model) {
      result[model.type] = model.data;
    });

    result['export-date'] = new Date().toJSON();

    return JSON.stringify(result, null, 4);
  }.property('model'),

  actions: {
    openModal: function(name) {
      Ember.$('.ui.' + name + '.modal').modal('show');
    },

    download: function () {
      window.saveAs(new Blob([this.get('jsonData')]), 'rose-data.txt');
    },

    approveModal() {
      [
        'comment',
        'interaction',
        'extract',
        'diary-entry'
      ].forEach((type) => this.store.findAll(type).then((records) => records.invoke('destroyRecord')));

      [
        'click',
        'fb-login',
        'mousemove',
        'scroll',
        'window'
      ].forEach((type) => kango.invokeAsyncCallback('localforage.removeItem', type + '-activity-records'));

      return true;
    }
  }
});
