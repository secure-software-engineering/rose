import Ember from 'ember';

export default Ember.Controller.extend({
  listSorting: ['createdAt:desc'],
  sortedList: Ember.computed.sort('model', 'listSorting')
});
