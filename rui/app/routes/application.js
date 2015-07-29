import Ember from 'ember';
import SemanticRouteMixin from 'semantic-ui-ember/mixins/application-route';

export default Ember.Route.extend(SemanticRouteMixin, {
  afterModel() {
    this.set('i18n.locale', this.get('userSettings.currentLanguage'));
  },

  actions: {
    resetRose() {
      this.set('userSettings.firstRun', true);
      this.get('userSettings').save()
        .then(() => this.transitionTo('index'));
    }
  }
});
