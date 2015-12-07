import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['comment'],
  showDetails: false,

  jsonData: function() {
    return JSON.stringify(this.get('model'), null, 2);
  }.property('model'),

  actions: {
    toggleDetails: function () {
      this.toggleProperty('showDetails');
    },
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
    }
  }
});
