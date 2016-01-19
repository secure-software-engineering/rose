import Ember from 'ember';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend({
  listSorting: ['createdAt:desc'],
  sortedList: Ember.computed.sort('model', 'listSorting')

  queryParams: ["page"],
  page: 1,
  perPage: 20,
  pagedContent: pagedArray('sortedList', {pageBinding: "page", perPageBinding: "perPage"}),
  totalPagesBinding: "pagedContent.totalPages"
});
