var ObserverEngine = require('./observer-engine'),
    ExtractorEngine = require('./extractor-engine'),
    log = require('./log');

/**
* @module Core
*/
var Core = (function() {
    var Core = {};

    /**
    * Starts Rose by starting the observer and extractor engines
    * and setting up the general environment to work in.
    *
    * @method start
    */
    Core.start = function start() {
        log('Core', 'Start observer and extractor engine');
        
        // Register observer engine
        ObserverEngine.register();

        // Register extractor engine
        ExtractorEngine.register();
    };

    return Core;
})();

module.exports = Core;
