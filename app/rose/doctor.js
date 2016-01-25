function repairMissingInteractions() {
  localforage.keys(function(storageKeys) {
    var interactionKeys = storageKeys.filter(function (key) {
      if (key.search(/^Interaction\/.+/) > -1 ) return true;
    });
    if (interactionKeys !== []) localforage.setItem('Interactions', interactionKeys);
  });
}

export default {repairMissingInteractions}
