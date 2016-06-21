import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['statistic'],

    count: Ember.computed('data', function () {
        const data = this.get('data')
        const filtered = data.filterBy('network', this.get('network'))
        return filtered.length
    })
});
