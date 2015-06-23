import Ember from 'ember';

export default Ember.TextField.extend({
  type: 'file',

  change() {
    const input = event.target;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        this.sendAction('onread', data);
      };
      reader.readAsText(input.files[0]);
    }
  }
});
