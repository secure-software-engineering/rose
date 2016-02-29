import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        save() {
            return this.get('model').save()
        },

        discard() {
            const observer = this.get('model')
            observer.rollbackAttributes()
        },

        addPattern() {
            const patterns = this.get('model.patterns')
            patterns.createFragment('pattern')
        },

        removePattern(pattern) {
            const patterns = this.get('model.patterns')
            patterns.removeObject(pattern)
        }
    }
});
