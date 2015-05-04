import Ember from 'ember';

export default Ember.Controller.extend({
  baseFileIsLoading: false,

  actions: {
    saveSettings: function() {
      this.get('model').save();
    },

    download: function() {
      const jsondata = JSON.stringify(this.get('model'), null, 4);
      const fileName = this.get('model.fileName');

      window.saveAs(new Blob([jsondata]), fileName);
    },

    fetchBaseFile: function() {
      this.get('model.networks').clear();

      const self = this;
      self.set('baseFileIsLoading', true);

      Ember.$.getJSON(this.get('model.repositoryUrl'))
        .then(function(data) {
          data.networks.forEach(function (nw) {
            let network = self.store.createRecord('network', nw);
            self.get('model.networks').addObject(network);
            self.get('model').save();
          });

          self.set('baseFileIsLoading', false);
        })
        .fail(function(error) {
          self.set('baseFileIsLoading', false);
          console.log(error);
        });
    }
  }
});
