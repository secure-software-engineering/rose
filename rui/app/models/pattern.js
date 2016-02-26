import DS from 'ember-data';
import MF from 'model-fragments';

export default MF.Fragment.extend({
    node: DS.attr('string'),
    parent: DS.attr('string'),
    extractor: DS.attr('string')
});
