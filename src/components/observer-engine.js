var jQuery = require('jquery');

var Storage = require('./storage');

/**
* @module Core
* @submodule Observer Engine
*/
var ObserverEngine = (function($) {
    var ObserverEngine = {};

    var observers = [];

    /**
    * Adds an observer to the engine.
    *
    * @method add
    * @param {Object} observer The observer to be added
    */
    ObserverEngine.add = function add(observer) {
        // Push to observers list
        observers.push(observer);
    };

    /**
    * Sets up event listeners and integrates observers
    * into the document.
    *
    * @method register
    */
    ObserverEngine.register = function register() {
        // Register global click event listener
        $(document).on('click', function(event) {
            // Get event target
            var target = event.target;

            // Build path to node
            var path = [target.nodeName];
            $(target).parents().each(function() {
                path.unshift($(this)[0].nodeName);
            });
            path = path.join(' > ');

            // Apply observers
            for (var i in observers) {
                var observer = observers[i];

                var found = false;

                var data = null;

                // Only apply pattern observers at this point
                if (observer.type === 'pattern') {
                    // Go through DOM tree and try to apply pattern
                    for (var node = $(this); node.prop('tagName').toLowerCase !== 'body'; node = node.parent()) {
                        // Use every pattern
                        for (var entry in observer.patterns) {
                            // Apply pattern
                            var result = node.applyPattern({
                                structure: entry.pattern
                            });

                            // If result found...
                            if (result.success) {
                                // ... store it
                                data = result.data;
                            }
                        }

                        if (found) {
                            break;
                        }
                    }

                    // Apply process function, if data has been found
                    if (data !== null) {
                        data = observer.process(data);
                    }
                }

                if (found && data !== null) {
                    // Save interaction to storage
                    Storage.add({
                        type: 'interaction',
                        name: observer.name,
                        network: observer.network,
                        record: data
                    });

                    break;
                }
            }
        });
    };

    return ObserverEngine;
})(jQuery);

module.exports = ObserverEngine;
