import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import observersCollection from 'rose/collections/observers';

/**
 * Hard coded observers for testing
 * Should be removed when connected to updater
 */
var obs = [{
  name: "like",
  network: "facebook",
  type: "click",
  priority: 1,
  patterns: [
    {
      node: ".UFILikeLink span",
      container: "._x72",
      pattern: '<div class="_x72"><div class="userContentWrapper"><div class="userContent">{id}</div></div></div>',
      process: "function process(info, $node) { info.id = hash(info.id); return info; }"
    }
  ]
},
{
  name: "profileview",
  network: "facebook",
  type: "click",
  priority: 1,
  patterns: [
    {
      node: "a[data-hovercard*=\"user\"]",
      container: "span",
      pattern: '<span><a data-hovercard="{id}"></a></span>',
      process: "function process(info, $node) { var pattern = /id=(.+)&/; info.id = info.id.match(pattern)[1]; return info; }"
    }
  ]
}];

/* Background Script */
(function() {

  //Write test observe into storage
  //FIX: Updater loads observers
  var observers = new observersCollection();
  observers.fetch({ success: function() {
    log('CoreBGScript', 'Observers loaded from storage');
    if (observers.length === 0) {
      for (var i = 0; i < obs.length; i++) {
        observers.create(obs[i]);
      }
    }
  }});

  /*
   * Extractor Engine
   * ----------------
   *
   * Start extractor engine and integrate with Heartbeat.
   */

   ExtractorEngine.add({
    network: 'Facebook',
    name: 'privacy-settings',
    informationUrl: 'https://www.facebook.com/settings/?tab=privacy',
    interval : 5000
  });

  ExtractorEngine.register();
})();


