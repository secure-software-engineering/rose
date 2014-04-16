var ObserverEngine = require('./observer-engine'),
    ExtractorEngine = require('./extractor-engine');

/**
* @module Core
*/
var Core = (function() {
    var Core = {};

    /**
    * Prints the module name, a message, and a timestamp.
    *
    * @method log
    * @param {String} module Name of the module
    * @param {String} message Message to be logged
    */
    Core.log = function log(module, message) {
        var time = (function() {
            var now = new Date();

            // Construct date string
            var date = [
                now.getDay(),
                now.getMonth(),
                now.getFullYear()
            ].join('.');

            // Construct time string
            var time = [
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
            ].join(':');

            return date + ' ' + time;
        })();

        console.log('[ROSE, module: %s, time: %s] %s', module, time, message);
    };

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
