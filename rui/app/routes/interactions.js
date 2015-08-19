import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    return this.store.find('interaction').then((records) => {
      return records.filterBy('origin.network', params.network_name);
    });
  }
});
