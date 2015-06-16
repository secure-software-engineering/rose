import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    cancelWizard() {
      let settings  = this.get('userSettings');
      settings.set('firstRun', false);
      settings.save();
    }
  }
});
