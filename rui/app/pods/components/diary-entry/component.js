import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['comment', 'diary-entry'],

  actions: {
    hide: function() {
      this.set('model.isPrivate', true);
      this.get('model').save();
    },
    unhide: function() {
      this.set('model.isPrivate', false);
      this.get('model').save();
    },
    delete: function() {
      this.get('model').destroyRecord();
    },
    edit: function() {
      this.set('isEditable', true);
    },
    save: function() {
      this.set('model.updatedAt', Date.now());
      this.get('model').save();
      this.set('isEditable', false);
    },
    cancel: function () {
      this.get('model').rollbackAttributes();
      this.set('isEditable', false);
    }
  }
});
