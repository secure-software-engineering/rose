import Ember from 'ember';

const { isEmpty } = Ember;
const { service } = Ember.inject;
const { Promise } = Ember.RSVP;

export default Ember.Service.extend({
    store: service(),

    setup() {
        const store = this.get('store');

        return store.find('user-setting', { id: 0 })
            .then((settings) => {
                if (!isEmpty(settings)) {
                    return settings.get('firstObject');
                }

                return store.createRecord('user-setting', { id: 0 }).save();
            })
            .then((setting) => {
                this.set('user', setting);
            });
    }
});
