import Ember from 'ember'
import languages from '../locales/languages'

const { Promise } = Ember.RSVP

export default Ember.Controller.extend({
  availableLanguages: languages,
  updateIntervals: [
    { label: 'hourly', value: 3600000 },
    { label: 'daily', value: 86400000 },
    { label: 'weekly', value: 604800000 },
    { label: 'monthly', value: 2629743830 },
    { label: 'yearly', value: 31556926000 }
  ],

  actions: {
    saveSettings () {
      this.get('settings.user').save()
      this.get('settings.system').save()
    },

    changeI18nLanguage () {
      this.set('i18n.locale', this.get('settings.user.currentLanguage'))
      this.send('saveSettings')
    },

    manualUpdate () {
      kango.dispatchMessage('Update')

      kango.addMessageListener('update-result', (e) => {
        this.get('settings.system').reload().then(() => {
          kango.removeMessageListener('update-result')
        })
      })
    },

    openModal: function (name) {
      Ember.$('.ui.' + name + '.modal').modal('show')
    },

    approveModal () {
      return Promise.all([
        this.store.find('extractor').then((records) => records.invoke('destroyRecord')),
        this.store.find('network').then((records) => records.invoke('destroyRecord')),
        this.store.find('observer').then((records) => records.invoke('destroyRecord')),
        this.get('settings.user').destroyRecord(),
        this.get('settings.system').destroyRecord()
      ]).then(() => {
        return this.get('settings').setup()
      }).then(() => {
        return this.transitionToRoute('index')
      })
    }
  }
})
