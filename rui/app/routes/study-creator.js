import Ember from 'ember';

export default Ember.Route.extend({
  model: function () {
    const self = this;

    return this.store.find('study-creator-setting').then(function (settings) {
      if (Ember.isEmpty(settings)) {
        return  self.store.createRecord('study-creator-setting');
      }

      return settings.get('firstObject');
    });
  }
});
