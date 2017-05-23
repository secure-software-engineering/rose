/*
Copyright (C) 2015-2017
    Oliver Hoffmann <oliverh855@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
*/
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

  getPatternRessource (url) {
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

    fetchBaseFile () {
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
              if (!network.observers && !network.extractors) {
                return
              }
              let requests = [[], []]
              if (network.extractors) {
                requests[0] = this.getPatternRessource(`${repositoryURL}/${network.extractors}`)
              }
              if (network.observers) {
                requests[1] = this.getPatternRessource(`${repositoryURL}/${network.observers}`)
              }
              Ember.RSVP.Promise.all(requests).then((results) => {
                network.extractors = results[0]
                network.observers = results[1]
                this.get('networks').pushObject(Ember.Object.create(network))
              })
            })
          }
        })
        .fail(() => this.set('baseFileNotFound', true))
    },

    enableAll (itemList) {
      itemList.forEach((item) => item.set('isEnabled', true))
    },

    disableAll (itemList) {
      itemList.forEach((item) => item.set('isEnabled', false))
    },

    toggleForceSecureUpdate () {
      // const state = this.get('model.forceSecureUpdate')
      this.get('model').save()
    }
  }
})
