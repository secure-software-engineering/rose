import log from 'rose/log';
import ExtractorEngine from 'rose/extractor-engine';
import observersCollection from 'rose/collections/observers';

/**
 * Hard coded observers for testing
 * Should be removed when connected to updater
 */
var obs = [{
  name: "UpdateStatus",
  network: "facebook",
  type: "click",
  priority: 2,
  version: "0.1",
  patterns: [
    {
      node: "form[action*=updatestatus] button[type=submit]",
      container: "form[action*=updatestatus]"
    }
  ]
},
{
  name: "LikeContent",
  network: "facebook",
  type: "click",
  priority: 2,
  version: "0.1",
  patterns: [
    {
      node: ".UFILikeLink span",
      container: ".userContentWrapper"
    }
  ],
  extractor: "StatusUpdate"
},
{
  name: "profileview",
  network: "facebook",
  type: "click",
  priority: 3,
  patterns: [
    {
      node: ["a.friendHovercard * ", "a[data-hovercard*='user'] *", "a[href*='=ufi'] *", "a.titlebarText", "a[href*='=ufi'][data-hovercard]", "a[data-hovercard*='user']"],
      container: "a"
    }
  ],
  extractor: "UserLink"
}];


/* Background Script */
(function() {

  //Write test observe into storage
  //FIX: Updater loads observers
  var observers = new observersCollection();
  observers.fetch({ success: function(col) {
    log('CoreBGScript', 'Observers loaded from storage');
    if (observers.length === 0) {
      for (var i = 0; i < obs.length; i++) {
        observers.create(obs[i]);
      }
    }
    // //Load one observer new into storage each refresh
    // var crtObserver = col.findWhere({name: "UpdateStatus"});
    // crtObserver.set(obs[0]);
    // crtObserver.save();
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
    kango.browser.tabs.create({url: kango.io.getResourceUrl('ui/index.html')});
});
