import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    let promises = [
      this.store.find('comment'),
      this.store.find('interaction'),
      this.store.find('diary-entry')
    ];

    return Ember.RSVP.all(promises);
  }
});
