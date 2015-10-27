import Ember from 'ember';

let getItem = (key) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      resolve(data);
    });
  });
};

export default Ember.Route.extend({
  model () {
    let promises = [
      getItem('click-activity-records'),
      getItem('mousemove-activity-records'),
      getItem('scroll-activity-records'),
      getItem('window-activity-records'),
      getItem('fb-login-activity-records')
    ];

    return Ember.RSVP.all(promises);
  }
});
