import Ember from 'ember'
import languages from '../locales/languages'

export default Ember.Controller.extend({
  updateInProgress: false,
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
      this.set('updateInProgress', true)
      kango.dispatchMessage('update-start')

      kango.addMessageListener('update-successful', () => {
        this.set('updateInProgress', false)
        this.get('settings.system').reload().then(() => {
          kango.removeMessageListener('update-successful')
        })
      })
    },

    changeAutoUpdate () {
      this.get('settings.system').save().then(() => kango.dispatchMessage('reschedule-auto-update'))
    },

    openModal: function (name) {
      Ember.$('.ui.' + name + '.modal').modal('show')
    },

    approveModal () {
      return Ember.RSVP.all([
        this.store.findAll('extractor').then((records) => records.invoke('destroyRecord')),
        this.store.findAll('network').then((records) => records.invoke('destroyRecord')),
        this.store.findAll('observer').then((records) => records.invoke('destroyRecord')),
        this.get('settings.user').destroyRecord(),
        this.get('settings.system').destroyRecord()
      ])
      .then(() => this.get('settings').setup())
      .then(() => this.transitionToRoute('index'))
      .catch(err => console.log(err))
    }
  }
})
