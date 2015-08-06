import Ember from 'ember';

export default Ember.Controller.extend({
  baseFileIsLoading: false,

  actions: {
    saveSettings: function() {
      this.get('model').save();
    },

    saveNetworkSettings: function(network) {
      network.value.save();
    },

    download: function() {
      let model = this.get('model').toJSON();
      let networks = this.get('model.networks').map(function(network) { return network.toJSON({ includeId: true }); });
      model.networks = networks;
      const jsondata = JSON.stringify(model, null, 4);
      const fileName = this.get('model.fileName');

      window.saveAs(new Blob([jsondata]), fileName);
    },

    fetchBaseFile: function() {
      this.get('model.networks').clear();

      const self = this;
      self.set('baseFileIsLoading', true);

      Ember.$.getJSON(this.get('model.repositoryURL'))
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
