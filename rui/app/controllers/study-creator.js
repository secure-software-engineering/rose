import Ember from 'ember'

export default Ember.Controller.extend({
  baseFileIsLoading: false,
  networks: [],

  getExtractors (url) {
    return Ember.$.getJSON(url)
      .then((list) => list.map((item) => Ember.Object.create(item)))
  },

  getObservers (url) {
    return Ember.$.getJSON(url)
      .then((list) => list.map((item) => Ember.Object.create(item)))
  },

  actions: {
    saveSettings: function () {
      this.get('model').save()
    },

    saveNetworkSettings: function (network) {
      network.value.save()
    },

    download: function () {
      const networks = this.get('networks')
        .filterBy('isEnabled', true)
        .map((network) => JSON.parse(JSON.stringify(network)))
        .map((network) => {
          if (network.extractors) {
            network.extractors = network.extractors.filter((extractor) => extractor.isEnabled)
          }
          if (network.observers) {
            network.observers = network.observers.filter((observer) => observer.isEnabled)
          }
          return network
        })

      let model = this.get('model').toJSON()
      model.networks = networks
      const jsondata = JSON.stringify(model, null, 4)
      const fileName = this.get('model.fileName')

      window.saveAs(new Blob([jsondata]), fileName)
    },

    fetchBaseFile () {
      this.set('networks', [])

      const url = this.get('model.repositoryURL')
      Ember.$.getJSON(url + 'base.json')
        .then((baseJSON) => {
          if (baseJSON.networks) {
            const networks = baseJSON.networks
            networks.forEach((network) => {
              Ember.RSVP.Promise.all([
                this.getExtractors(url + network.extractors),
                this.getObservers(url + network.observers)
              ]).then((results) => {
                network.extractors = results[0]
                network.observers = results[1]
                this.get('networks').pushObject(Ember.Object.create(network))
              })
            })
          }
        })
    },

    enableAll (itemList) {
      itemList.forEach(item => item.set('isEnabled', true))
    },

    disableAll (itemList) {
      itemList.forEach(item => item.set('isEnabled', false))
    }
  }
})
