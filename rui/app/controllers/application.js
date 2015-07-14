import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    cancelWizard() {
      let settings = this.get('userSettings');
      settings.set('firstRun', false);
      settings.save();
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
          return this.store.createRecord('system-config', payload).save();
        })
        .then(() => this.send('cancelWizard'));
    }
  }
});
