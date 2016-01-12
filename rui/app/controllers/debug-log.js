import Ember from 'ember'
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend({
    model: [],
    modelSorting: ['date:desc'],
    log: Ember.computed.sort('model', 'modelSorting'),
    queryParams: ["page", "perPage"],
    page: 1,
    perPage: 10,
    pagedContent: pagedArray('log', {pageBinding: "page", perPageBinding: "perPage"}),
    totalPagesBinding: "pagedContent.totalPages"
});
