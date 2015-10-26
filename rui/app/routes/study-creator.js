import Ember from 'ember';
import studyCreatorDefaults from '../defaults/study-creator'

export default Ember.Route.extend({
  model () {
    return this.store.find('study-creator-setting').then((settings) => {
      if (Ember.isEmpty(settings)) {
        return this.store.createRecord('study-creator-setting', studyCreatorDefaults);
      }

      return settings.get('firstObject');
    });
  }
});
