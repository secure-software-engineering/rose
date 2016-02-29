import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return this.store.findAll('observer')
    },

    actions: {
        addObserver() {
            const newObserver = this.store.createRecord('observer')
            this.transitionTo('observer', newObserver)
        },

        removeObserver(observer) {
            return observer.destroyRecord()
        }
    }
});
