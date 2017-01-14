import Ember from 'ember'
import languages from '../locales/languages'

export default Ember.Controller.extend({
  navigator: Ember.inject.service(),
  updateInProgress: false,
  updateResult: '',
  updateResulti18n: function () {
    return 'settings.' + this.get('updateResult')
  }.property('updateResult'),
  availableLanguages: languages,
  updateIntervals: [
    { label: 'hourly', value: 3600000 },
    { label: 'daily', value: 86400000 },
    { label: 'weekly', value: 604800000 },
    { label: 'monthly', value: 2629743830 }
  ],

  actions: {
    saveSettings () {
      this.get('settings.user').save()
      this.get('settings.system').save()
    },

    toggleTracking () {
      this.get('settings.system').save().then(() => kango.dispatchMessage('toggle-tracking'))
    },

    changeI18nLanguage () {
      this.set('i18n.locale', this.get('settings.user.currentLanguage'))
      this.send('saveSettings')
    },

    manualUpdate () {
      this.set('updateInProgress', true)

      Ember.$('.manualUpdate .message:not(.hidden)').transition('slide down')

      var showResult = (status) => {
        this.set('updateInProgress', false)
        this.set('updateResult', status)

        this.get('settings.system').reload().then(() => {
          kango.removeMessageListener('update-successful', successfulUpdate)
          kango.removeMessageListener('update-unsuccessful', unsuccessfulUpdate)
          Ember.$('.manualUpdate .message').transition('slide down')
        })
      }
      var successfulUpdate = (evt) => {
        let status = evt.data
        if (status === 'uptodate') {
          status = this.get('i18n').t('settings.uptodate').toString()
        }
        this.set('updateMessage', status)
        showResult('success')
      }
      kango.addMessageListener('update-successful', successfulUpdate)

      var unsuccessfulUpdate = (evt) => {
        let err = evt.data
        console.log(err)
        this.set('updateMessage', err.message)
        showResult('error')
      }
      kango.addMessageListener('update-unsuccessful', unsuccessfulUpdate)

      kango.dispatchMessage('update-start')
    },

    closeMessage () {
      Ember.$('.manualUpdate .message').transition('slide down')
    },

    changeAutoUpdate () {
      this.get('settings.system').save().then(() => kango.dispatchMessage('reschedule-auto-update'))
    },

    openModal: function (name) {
      Ember.$('.ui.' + name + '.modal').modal('show')
    },

    approveModal () {
      kango.dispatchMessage('reset-configuration')
      Ember.RSVP.all([
        this.store.findAll('extractor').then((records) => records.invoke('destroyRecord')),
        this.store.findAll('network').then((records) => records.invoke('destroyRecord')),
        this.store.findAll('observer').then((records) => records.invoke('destroyRecord')),
        this.get('settings.user').destroyRecord(),
        this.get('settings.system').destroyRecord()
      ])
      .then(() => this.get('settings').setup())
      .then(() => this.transitionToRoute('index'))
      .catch((err) => console.error(err))
    }
  }
})
