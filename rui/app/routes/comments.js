import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    return this.store.query('comment', { network: params.network_name })
  }
});
