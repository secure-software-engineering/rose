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
        },

        exportObservers() {
            this.store.findAll('observer')
                .then(observers => observers.invoke('toJSON'))
                .then(json => JSON.stringify(json, null, 4))
                .then(text => window.saveAs(new Blob([text]), 'observer-list.json'))
        }
    }
});
