import Ember from 'ember';

const { isEmpty } = Ember;
const { service } = Ember.inject;
const { Promise } = Ember.RSVP;

export default Ember.Service.extend({
    store: service(),

    setup() {
        const store = this.get('store');

        const userSettings = store.find('user-setting', { id: 0 })
            .then((settings) => {
                if (!isEmpty(settings)) {
                    return settings.get('firstObject');
                }

                return store.createRecord('user-setting', { id: 0 }).save();
            })
            .then((setting) => {
                this.set('user', setting);
            });

        const systemSettings = store.find('system-config', { id: 0 })
            .then((settings) => {
                if (!isEmpty(settings)) {
                    return settings.get('firstObject');
                }

                return store.createRecord('system-config', { id: 0 }).save();
            })
            .then((setting) => {
                this.set('system', setting);
            });

        return Promise.all([userSettings, systemSettings])
    }
});
