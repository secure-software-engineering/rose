import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    download: function () {
      const jsondata = JSON.stringify(this.get('model'), null, 4);
      const fileName = this.get('model.fileName');

      window.saveAs(new Blob([jsondata]), fileName);
    }
  }
});
