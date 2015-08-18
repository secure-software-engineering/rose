import Ember from 'ember';
import SemanticRouteMixin from 'semantic-ui-ember/mixins/application-route';

const { Promise } = Ember.RSVP;

export default Ember.Route.extend(SemanticRouteMixin, {
  beforeModel() {
    let settings = this.get('settings');
    return Promise.all([settings.setup()]);
  },

  afterModel() {
    this.set('i18n.locale', this.get('settings.user.currentLanguage'));
  },

  actions: {
    resetConfig() {
      let settings = this.get('settings.user');
      settings.destroyRecord()
        .then(() => this.get('settings').setup())
        .then(() => this.transitionTo('application'));
    }
  }
});
