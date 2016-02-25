import Ember from 'ember';

const { isEmpty } = Ember;
const { service } = Ember.inject;
const { Promise } = Ember.RSVP;

export default Ember.Service.extend({
    store: service(),

    setup() {
        const store = this.get('store');

        const userSettings = store.findRecord('user-setting', 0)
            .catch(() => store.createRecord('user-setting', { id: 0 }).save())
            .then(settings => this.set('user', settings))

        const systemSettings = store.findRecord('system-config', 0)
            .catch(() => store.createRecord('system-config', { id: 0 }).save())
            .then(settings => this.set('system', settings))

        return Promise.all([userSettings, systemSettings]);
    }
});
