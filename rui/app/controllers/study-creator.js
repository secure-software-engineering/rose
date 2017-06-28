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
import kbpgp from 'npm:kbpgp'

function removeFileName (str) {
  return normalizeUrl(str.substring(0, str.lastIndexOf('/')))
}

function getPatternRessource (url) {
  return Ember.$.getJSON(url)
    .then((list) => list.map((item) => Ember.Object.create(item)))
}

function randomString (length) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  while (text.length < length) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export default Ember.Controller.extend({
  baseFileIsLoading: false,
  baseFileNotFound: false,
  networks: [],
  keyAvailable: true,

  secureUpdateImpossible: function () {
    if (!this.get('keyAvailable') || !this.get('model.autoUpdateIsEnabled')) {
      this.set('model.forceSecureUpdate', false)
      return true
    }
    return false
  }.property('model.autoUpdateIsEnabled', 'keyAvailable'),

  updateIntervals: [
    { label: 'hourly', value: 3600000 },
    { label: 'daily', value: 86400000 },
    { label: 'weekly', value: 604800000 },
    { label: 'monthly', value: 2629743830 }
  ],

  actions: {
    saveSettings: function () {
      this.set('model.repositoryURL', normalizeUrl(this.get('model.repositoryURL')))
      this.get('model').save()
    },

    download: function () {
      const networks = this.get('networks')
        .filterBy('isEnabled', true)
        .map((network) => {
          network = JSON.parse(JSON.stringify(network))
          delete network.isEnabled
          if (network.extractors) {
            network.extractors = network.extractors.filter((extractor) => extractor.isEnabled || extractor.type !== 'url').map((extractor) => {
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
              let requests = [
                (network.extractors ? getPatternRessource(`${repositoryURL}/${network.extractors}`) : []),
                (network.observers ? getPatternRessource(`${repositoryURL}/${network.observers}`) : [])
              ]
              Ember.RSVP.Promise.all(requests).then((results) => {
                [network.extractors, network.observers] = results
                this.get('networks').pushObject(Ember.Object.create(network))
              })
            })

            Ember.$.get(`${repositoryURL}/public.key`).then((key) => {
              kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, keymanager) => {
                if (err) {
                  this.set('keyAvailable', false)
                  return console.error(err)
                }
                this.set('model.fingerprint', keymanager.get_pgp_fingerprint_str().toUpperCase())
                this.set('keyAvailable', true)
              })
            })
            .fail(() => this.set('keyAvailable', false))
          }
        })
        .fail(() => this.set('baseFileNotFound', true))
    },

    enableAll (network) {
      network.observers.forEach((item) => item.set('isEnabled', true))
      network.extractors.forEach((item) => item.set('isEnabled', true))
    },

    disableAll (network) {
      network.observers.forEach((item) => item.set('isEnabled', false))
      network.extractors.forEach((item) => item.set('isEnabled', false))
    },

    generateSalt () {
      this.set('model.salt', randomString(12))
    },

    toggleForceSecureUpdate () {
      // const state = this.get('model.forceSecureUpdate')
      this.get('model').save()
    }
  }
})
