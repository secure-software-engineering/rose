import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    deleteData() {
      const modelTypes = [
        'interaction',
        'comment'
      ];

      modelTypes.forEach((type) => {
        this.store.find(type).then((records) => {
          records.invoke('deleteRecord');
          return Ember.RSVP.all(records.invoke('save'));
        }).then(() => {
          const adapter = this.store.adapterFor(type);
          const namespace = adapter.get('collectionNamespace');

          kango.invokeAsyncCallback('localforage.removeItem', namespace);
        });
      });

      this.store.find('diary-entry').then((records) => records.invoke('destroyRecord'));

      [
        'click',
        'fb-login',
        'mousemove',
        'scroll',
        'window'
      ].forEach((type) => kango.invokeAsyncCallback('localforage.removeItem', type + '-activity-records'));
    }
  }
});
