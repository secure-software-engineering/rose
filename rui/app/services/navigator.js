import Ember from 'ember';

export default Ember.Service.extend({
    onLine: Ember.computed(function () {
        return navigator.onLine
    })
});
