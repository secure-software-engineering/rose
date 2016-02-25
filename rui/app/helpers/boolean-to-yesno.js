import Ember from 'ember';

export default Ember.Helper.extend({
    i18n: Ember.inject.service(),
    compute(params) {
        const i18n = this.get('i18n')
        return (params[0]) ? i18n.t('on') : i18n.t('off')
    }
})
