import Ember from 'ember';

export default Ember.Controller.extend({
  isLoading: false,
  
  actions: {
    cancelWizard() {
      let settings = this.get('settings.user');
      settings.set('firstRun', false);
      settings.save().then(() => location.reload());
    },

    saveConfig(data) {
      const payload = JSON.parse(data);
      payload.id = 0;

      this.store.find('system-config', { id: 0 })
        .then((configs) => {
          if (!Ember.isEmpty(configs)) {
            return configs.get('firstObject').destroyRecord();
          }
        })
        .then(() => {
          kango.dispatchMessage('LoadNetworks', payload.networks);
          delete payload.networks;
          return this.store.createRecord('system-config', payload).save();
        })
        .then(() => this.send('cancelWizard'));
    }
  }
});
