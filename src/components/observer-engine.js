var jQuery = require('jquery');

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
                
                // Only apply pattern observers at this point
                if (observer.type === 'pattern') {
                    // TODO: Apply pattern
                }
            }
        });
    };
    
    return ObserverEngine;
})(jQuery);

module.exports = ObserverEngine;
