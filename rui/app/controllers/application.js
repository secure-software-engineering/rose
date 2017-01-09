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
      const payload = data
      payload.id = 0;

      this.settings.system.destroyRecord()
        .then(() => {
          kango.dispatchMessage('LoadNetworks', payload.networks)
          delete payload.networks
        })
        .then(() => this.store.createRecord('system-config', payload).save())
        .then((settings) => this.set('settings.system', settings))
        .then(() => this.send('cancelWizard'))
    }
  }
});
