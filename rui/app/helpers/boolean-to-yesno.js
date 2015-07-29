import Ember from 'ember';
import { translationMacro as t } from 'ember-i18n';

export function booleanToYesno(params) {
  return (params[0]) ? t('on') : t('off');
}

export default Ember.HTMLBars.makeBoundHelper(booleanToYesno);
