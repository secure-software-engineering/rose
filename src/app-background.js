// ROSE Background Script
// ----------------------

/* Requirements */
var Heartbeat       = require('./components/background/heartbeat'),
    config          = require('./components/config'),
    update          = require('./components/background/update'),
    ExtractorEngine = require('./components/background/extractor-engine');

/* Background Script */
(function() {
  /*
   * Heartbeat
   * ---------
   *
   * Initialize Heartbeat and schedule update process.
   */
  
  Heartbeat.start();
  
  Heartbeat.schedule('update-rose', config('update-interval'), {}, function task_update() {
    // Sync with external repository.
    update.sync();
  });
  
  /*
   * Extractor Engine
   * ----------------
   *
   * Start extractor engine and integrate with Heartbeat.
   */
  
  ExtractorEngine.useHeartbeat(Heartbeat);
  
  ExtractorEngine.register();
})();