import Ember from 'ember';

let getItem = (key) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      resolve({
        type: {
          typeKey: key
        },
        content: data
      });
    });
  });
};

export default Ember.Route.extend({
  model: function() {
    let promises = [
      this.store.find('comment'),
      this.store.find('interaction'),
      this.store.find('diary-entry'),
      this.store.find('user-setting'),
      getItem('click-activity-records'),
      getItem('mousemove-activity-records'),
      getItem('window-activity-records'),
      getItem('scroll-activity-records'),
      getItem('fb-login-activity-records'),
      getItem('install-date'),
      getItem('rose-data-version')
    ];

    return Ember.RSVP.all(promises);
  }
});
