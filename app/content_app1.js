import ObserverEngine from 'rose/observer-engine';
import FacebookUI from 'rose/FacebookUI';

/* Content Script */
(function() {

//Check for network
/**
 * URL identifiers of social networks.
 * FIXME: identifiers should load from settings
 */
var identifiers = {
  facebook: 'facebook.com',
  gplus: 'plus.google.com'
};

// Detect network, if possible
for (var name in identifiers) {
  var networkDomain = identifiers[name];

  if ((new RegExp('^https:\/\/[\w\.\-]*(' + networkDomain.replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {

    /* Observer Engine
     * ----------------
     *
     * Start observer engine.
     */
    ObserverEngine.register(name);

    if (name === 'facebook') {
      var facebookUI = new FacebookUI();
      facebookUI.redrawUI();
    }

    break;
  }
}

})();
