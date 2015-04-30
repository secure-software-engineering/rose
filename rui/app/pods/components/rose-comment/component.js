import Ember from 'ember';

export default Ember.Component.extend({
  isEditable: false,
  classNames: ['comment'],

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
      this.set('model.updatedAt', (new Date()).toJSON());
      this.get('model').save();
      this.set('isEditable', false);
    },
    cancel: function () {
      this.get('model').rollback();
      this.set('isEditable', false);
    }
  }
});
