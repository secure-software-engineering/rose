import DS from 'ember-data';
import MF from 'model-fragments';

export default DS.Model.extend({
    name: DS.attr('string'),
    network: DS.attr('string'),
    type: DS.attr('string'),
    priority: DS.attr('number'),
    version: DS.attr('string'),
    patterns: MF.fragmentArray('pattern'),
    isEnabled: DS.attr('boolean')
});
