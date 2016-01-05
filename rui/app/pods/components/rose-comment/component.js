import Ember from 'ember';

export default Ember.Component.extend({
  isEditable: false,
  classNames: ['comment'],

  previousActivity: Ember.computed('model.checkbox', function () {
    const boxes = this.get('model.checkbox') || []

    if (boxes.length) {
      if (boxes[0]) return 'Schoolwork offline'
      if (boxes[1]) return 'Schoolwork on the computer'
      if (boxes[2]) return 'Non-work activities on the computer'
      if (boxes[3]) return 'Non-work activities offline'
      if (boxes[4]) return 'Not doing anything in particular'
    }

    return 'Unkown'
  }),

  viewport: Ember.computed('model.checkbox', function () {
    const boxes = this.get('model.checkbox') || []

    if (boxes.length) {
      if (boxes[0]) return 'Newsfeed'
      if (boxes[1]) return 'Personal profile'
      if (boxes[2]) return 'Public page'
      if (boxes[3]) return 'Group page'
    }

    return 'Unkown'
  }),

  interested: Ember.computed('model.checkbox', function () {
    const boxes = this.get('model.checkbox') || []

    if (boxes.length){
      if (boxes[4]) return 'Yes'
      if (boxes[5]) return 'No'
    }

    return 'Unkown'
  }),

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
      this.get('model').rollbackAttributes();
      this.set('isEditable', false);
    }
  }
});
