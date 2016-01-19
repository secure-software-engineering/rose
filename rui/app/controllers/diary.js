import Ember from 'ember';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Ember.Controller.extend({
  listSorting: ['createdAt:desc'],
  sortedList: Ember.computed.sort('model', 'listSorting'),

  queryParams: ["page"],
  page: 1,
  perPage: 20,
  pagedContent: pagedArray('sortedList', {pageBinding: "page", perPageBinding: "perPage"}),
  totalPagesBinding: "pagedContent.totalPages",

  diaryInputIsEmpty: Ember.computed.empty('diaryInput'),

  actions: {
    save: function() {
      let entry = {
        text: this.get('diaryInput')
      };
      this.store.createRecord('diary-entry', entry).save();
      this.set('diaryInput', null);
    },
    cancel: function() {
      this.set('diaryInput', null);
    }
  }
});
