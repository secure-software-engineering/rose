import ExtractorEngine from 'rose/extractor-engine';
import observersCollection from 'rose/collections/observers';
import observerModel from 'rose/models/observer';

/**
 * Hard coded observers for testing
 * Should be removed when connected to settings module
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

  //Broken: This creates new observers in db every reload
  var observers = new observersCollection();
  observers.fetch({reset: true, success: function(col, response, opt) {
    console.log(col, response, opt, observers);
    if (observers.length === 0) {
      var observer;
      for (var i = 0; i < obs.length; i++) {
        observer = new observerModel(obs[i]);
        observers.create(observer);
        // observer.save();
      }
    }

  }});

  observers.once('sync', function() {
  });

  /*
   * Extractor Engine
   * ----------------
   *
   * Start extractor engine and integrate with Heartbeat.
   */

   ExtractorEngine.add({
    network: "Facebook",
    name: "privacy-settings",
    informationUrl: "https://www.facebook.com/settings/?tab=privacy",
    interval : 5000
  });

  ExtractorEngine.register();
})();


