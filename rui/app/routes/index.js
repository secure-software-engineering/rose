import Ember from 'ember';

export default Ember.Route.extend({
  model () {
      return Ember.RSVP.hash({
        comments: this.store.findAll('comment'),
        interactions: this.store.findAll('interaction'),
        extracts: this.store.findAll('extract')
      })
  },

  setupController(controller, model) {
    this._super(controller, model)

    return this.store.findAll('network').then((networks) => {
      controller.set('networks', networks);
    })
  }
});
