import Ember from 'ember';

let getItem = (key) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      resolve({
        type: key,
        data: data
      });
    });
  });
};

export default Ember.Route.extend({
  model: function() {
    let promises = [
      this.store.find('comment').then((records) => { return {type: 'comment', data: records.invoke('serialize')} }),
      this.store.find('interaction').then((records) => { return {type: 'interaction', data: records.invoke('serialize')} }),
      this.store.find('diary-entry').then((records) => { return {type: 'diary-entry', data: records.invoke('serialize')} }),
      this.store.find('user-setting').then((records) => { return {type: 'user-setting', data: records.invoke('serialize')} }),
      this.store.find('system-config').then((records) => { return {type: 'system-config', data: records.invoke('serialize')} }),
      getItem('click-activity-records'),
      getItem('mousemove-activity-records'),
      getItem('window-activity-records'),
      getItem('scroll-activity-records'),
      getItem('fb-login-activity-records'),
      getItem('engage-activity-records'),
      getItem('install-date'),
      getItem('rose-data-version')
    ];

    return Ember.RSVP.all(promises);
  }
});
