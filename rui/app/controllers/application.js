import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    cancelWizard() {
        let settings = this.get('userSettings');
        settings.set('firstRun', false);
        settings.save();
    },

    saveConfig(data) {
      const config = JSON.parse(data);
      config.id = 0;

      const record = this.store.createRecord('system-config', config);

      record.save()
        .then(() => {
          this.send('cancelWizard');
        });
    }
  }
});
