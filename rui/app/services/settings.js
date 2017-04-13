import Ember from 'ember';

const { isEmpty } = Ember;
const { service } = Ember.inject;
const { Promise } = Ember.RSVP;

export default Ember.Service.extend({
    store: service(),

    setup() {
        const store = this.get('store');

        const userSettings = store.findRecord('user-setting', 1)
            .catch(() => store.createRecord('user-setting', { id: 1 }).save())
            .then(settings => this.set('user', settings))

        const systemSettings = store.findRecord('system-config', 1)
            .catch(() => store.createRecord('system-config', { id: 1 }).save())
            .then(settings => this.set('system', settings))

        return Promise.all([userSettings, systemSettings]);
    }
});
