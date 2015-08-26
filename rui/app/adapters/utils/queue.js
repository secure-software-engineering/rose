import Ember from 'ember';

const { Promise } = Ember.RSVP;

export default Ember.Object.extend({
  queue: [Promise.resolve()],

  attach(callback) {
    var queueKey = this.queue.length;

    this.queue[queueKey] = new Ember.RSVP.Promise((resolve, reject) => {
      this.queue[queueKey - 1].then(() => {
        this.queue.splice(queueKey, 1);
        callback(resolve, reject);
      });
    });

    return this.queue[queueKey];
  }
});
