import Ember from 'ember';
import { request } from 'ic-ajax';

export default Ember.Component.extend({
  actions: {
    cancel() {
      this.sendAction('cancel');
    },

    saveConfig(data) {
      this.sendAction('onsuccess', data);
    },

    openFileChooser() {
      this.$('input.hidden').click();
    },

    onread(data) {
      this.sendAction('onsuccess', data);
    },

    selectDefaultConfig() {
      const src = kango.io.getResourceUrl('res/defaults/rose-configuration.json');
      request(src).then((json) => {
        this.sendAction('onsuccess', json);
      });
    }
  }
});
