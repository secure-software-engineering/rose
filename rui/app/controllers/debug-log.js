import Ember from 'ember'
import pagedArray from 'ember-cli-pagination/computed/paged-array'

export default Ember.Controller.extend({
  model: [],
  queryParams: ['page'],
  modelSorting: ['date:desc'],
  log: Ember.computed.sort('model', 'modelSorting'),
  page: 1,
  perPage: 20,
  pagedContent: pagedArray('log', {pageBinding: 'page', perPageBinding: 'perPage'}),
  totalPagesBinding: 'pagedContent.totalPages'
})
