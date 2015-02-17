import ExtractorEngine from 'rose/extractor-engine';

/* Background Script */
(function() {

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


