import Ember from 'ember';

export function booleanToYesno(params) {
  var t = this.container.lookup('utils:t');
  return (params[0]) ? t('on') : t('off');
}

export default Ember.HTMLBars.makeBoundHelper(booleanToYesno);
