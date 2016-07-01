import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    if (!$.isPlainObject(serialized)) {
      return {};
    } else {
      return serialized;
    }
  },

  serialize(deserialized) {
    if (!$.isPlainObject(deserialized)) {
      return {};
    } else {
      return deserialized;
    }
  }
});
