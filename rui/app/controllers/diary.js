import Ember from 'ember';

export default Ember.Controller.extend({
  listSorting: ['createdAt:desc'],
  sortedList: Ember.computed.sort('model', 'listSorting'),

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
