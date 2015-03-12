import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import observersCollection from 'rose/collections/observers';

/**
 * Hard coded observers for testing
 * Should be removed when connected to updater
 */
var obs = [{
  name: "LikeContent",
  network: "facebook",
  type: "click",
  priority: 1,
  version: "0.1",
  patterns: [
    {
      node: ".UFILikeLink span",
      container: ".userContentWrapper",
      pattern: '<div class="userContentWrapper"><div class="clearfix"><div><div><div><div><h5><div><span><span class="fwb"><a href="{sharer}"></a></span></span></div></h5><div><span><span><a href="{contentId}"><abbr></abbr></a></span></span></div></div></div></div></div></div></div>',
      process: "function process(info, $node) { info.contentId = hash(info.contentId); info.sharer = hash(info.sharer); return info; }"
    },
    {
      node: ".UFILikeLink span",
      container: ".userContentWrapper",
      pattern: '<div class="userContentWrapper"><div class="clearfix"><div><div><div><div><h5><div><span class="fwb"><a href="{sharer}"></a></span></span></div></h5><div><span><span><a href="{contentId}"><abbr></abbr></a></span></span></div></div></div></div></div></div></div>',
      process: "function process(info, $node) { info.contentId = hash(info.contentId); info.sharer = hash(info.sharer); return info; }"
    },
    {
      node: ".UFILikeLink span",
      container: ".userContentWrapper",
      pattern: '<div class="userContentWrapper"><div class="clearfix"><div><div><div><div><h6><div><span class="fwb"><a href="{sharer}"></a></span></span></div></h5><div><span><span><a href="{contentId}"><abbr></abbr></a></span></span></div></div></div></div></div></div></div>',
      process: "function process(info, $node) { info.contentId = hash(info.contentId); info.sharer = hash(info.sharer); return info; }"
    }

  ]
},
{
  name: "profileview",
  network: "facebook",
  type: "click",
  priority: 2,
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

kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function(event) {
    kango.browser.tabs.create({url:'ui/index.html'});
});
