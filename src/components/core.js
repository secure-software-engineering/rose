var ObserverEngine = require('./observer-engine'),
    ExtractorEngine = require('./extractor-engine');

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
        // Register observer engine
        ObserverEngine.register();

        // Register extractor engine
        ExtractorEngine.register();
    };

    return Core;
})();

module.exports = Core;
