import Ember from 'ember'

export default Ember.Component.extend({
  ajax: Ember.inject.service(),

  actions: {
    selectDefaultConfig() {
      const ajax = this.get('ajax')
      const src = kango.io.getResourceUrl('res/defaults/rose-configuration.json')

      ajax.request(src, { dataType: 'json' })
        .then((json) => this.sendAction('onsuccess', json))
    },

    fileLoaded(file) {
      const json = JSON.parse(file.data)
      this.sendAction('onsuccess', json)
    }
  }
})
