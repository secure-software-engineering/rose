import Ember from 'ember'

export default Ember.Component.extend({
  classNames: ['field'],

  actions: {
    toggle: function () {
      this.$('p').transition('slide down', '150ms')
    }
  }
})
