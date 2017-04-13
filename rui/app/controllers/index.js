import Ember from 'ember'

export default Ember.Controller.extend({
  settings: Ember.inject.service('settings'),
  actions: {

    toggleTracking () {
      this.get('settings.user').save().then(() => kango.dispatchMessage('toggle-tracking'))
    }
  }
})
