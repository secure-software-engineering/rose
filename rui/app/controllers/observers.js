import Ember from 'ember';

export default Ember.Controller.extend({
    listSorting: ['name'],
    sortedList: Ember.computed.sort('model', 'listSorting'),

    actions: {
        exportObservers() {
            const observerList = this.get('sortedList').invoke('toJSON')
            const observerListString = JSON.stringify(observerList, null, 4)

            window.saveAs(new Blob([observerListString]), 'observer-list.json')
        }
    }
});
