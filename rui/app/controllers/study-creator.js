import Ember from 'ember'
import normalizeUrl from 'npm:normalize-url'

function removeFileName (str) {
  return normalizeUrl(str.substring(0, str.lastIndexOf('/')))
}

export default Ember.Controller.extend({
  baseFileIsLoading: false,
  baseFileNotFound: false,
  networks: [],

  updateIntervals: [
    { label: 'hourly', value: 3600000 },
    { label: 'daily', value: 86400000 },
    { label: 'weekly', value: 604800000 },
    { label: 'monthly', value: 2629743830 }
  ],

  getExtractors(url) {
    return Ember.$.getJSON(url)
      .then((list) => list.map((item) => Ember.Object.create(item)))
  },

  getObservers(url) {
    return Ember.$.getJSON(url)
      .then((list) => list.map((item) => Ember.Object.create(item)))
  },

  actions: {
    saveSettings: function () {
      this.set('model.repositoryURL', normalizeUrl(this.get('model.repositoryURL')))
      this.get('model').save()
    },

    saveNetworkSettings: function (network) {
      network.value.save()
    },

    download: function () {
      const networks = this.get('networks')
        .filterBy('isEnabled', true)
        .map((network) => {
          network = JSON.parse(JSON.stringify(network))
          delete network.isEnabled
          if (network.extractors) {
            network.extractors = network.extractors.filter((extractor) => extractor.isEnabled).map((extractor) => {
              delete extractor.isEnabled
              return extractor
            })
          }
          if (network.observers) {
            network.observers = network.observers.filter((observer) => observer.isEnabled).map((observer) => {
              delete observer.isEnabled
              return observer
            })
          }
          return network
        })

      let model = this.get('model').toJSON()
      model.networks = networks
      const jsondata = JSON.stringify(model, null, 4)
      const fileName = this.get('model.fileName')

      window.saveAs(new Blob([jsondata]), fileName)
    },

    fetchBaseFile() {
      // this.set('networks', [])
      this.setProperties({
        networks: [],
        baseFileNotFound: false
      })

      const baseFileUrl = this.get('model.repositoryURL')
      const repositoryURL = removeFileName(baseFileUrl)

      Ember.$.getJSON(baseFileUrl)
        .then((baseJSON) => {
          if (baseJSON.networks) {
            const networks = baseJSON.networks
            networks.forEach((network) => {
              Ember.RSVP.Promise.all([
                this.getExtractors(`${repositoryURL}/${network.extractors}`),
                this.getObservers(`${repositoryURL}/${network.observers}`)
              ]).then((results) => {
                network.extractors = results[0]
                network.observers = results[1]
                this.get('networks').pushObject(Ember.Object.create(network))
              })
            })
          }
        })
        .fail(() => this.set('baseFileNotFound', true))
    },

    enableAll(itemList) {
      itemList.forEach(item => item.set('isEnabled', true))
    },

    disableAll(itemList) {
      itemList.forEach(item => item.set('isEnabled', false))
    },

    toggleForceSecureUpdate() {
      const state = this.get('model.forceSecureUpdate')
      this.get('model').save()
    }
  }
})
