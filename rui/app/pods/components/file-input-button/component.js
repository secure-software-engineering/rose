import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    openFileChooser() {
      this.$('input').click();
    },

    onread(data) {
      this.sendAction('onread', data);
    }
  }
});
