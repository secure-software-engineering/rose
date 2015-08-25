import Ember from 'ember';

const { Promise } = Ember.RSVP;

export default Ember.Object.extend({
  queue: [Promise.resolve()],

  attach: function(callback) {
    var self = this;
    var queueKey = self.queue.length;

    self.queue[queueKey] = new Ember.RSVP.Promise(function(resolve, reject) {
      self.queue[queueKey - 1].then(function() {
        self.queue.splice(queueKey, 1);
        callback(resolve, reject);
      });
    });

    return self.queue[queueKey];
  },
});
