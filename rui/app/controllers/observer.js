import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        save() {
            return this.get('model').save()
        }
    }
});
