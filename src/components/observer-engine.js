var $ = require('jquery-patterns');

var _ = require('underscore');

var Storage = require('./storage');

/**
* @module Core
* @submodule Observer Engine
*/
var ObserverEngine = (function($) {
    var ObserverEngine = {};

    var observers = [];
    
    /**
     * Returns only those observers which are associated to the given
     * network and have the given type
     */
    function filterObservers(network, type) {
        var result = [];
        
        for (var i in observers) {
            var observer = observers[i];
            
            if (observer.network === network && observer.type === type) {
                result.push(observer);
            }
        }
        
        return result;
    }
    
    /**
     * Handles the integration of pattern observers on click events
     */
    function handleClick(event, network) {
        var clickObservers = _.where(observers, {
            type: 'click',
            network: network
        });
        
        clickObservers.forEach(function (observer) {
            observer.patterns.forEach(function (pattern) {
                if (_.contains($(pattern.selector), event.target)) {
                    var parents = $(event.target).parents();
                    var found = false;
                    
                    parents.each(function (i, n) {
                        if (found) {
                            return;
                        }
                        
                        var search = $(n).find(pattern.lookup);
                        
                        if (search.length > 0) {
                            found = true;
                            
                            // TODO: Process output/save interaction
                        }
                    });
                }
            });
        });
    }

    /**
    * Adds an observer to the engine.
    *
    * @method add
    * @param {Object} observer The observer to be added
    */
    ObserverEngine.add = function add(observer) {
        log('ObserverEngine', 'Add observer: ' + observer.name);

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
        log('ObserverEngine', 'Register in document');

        // Network identifiers
        var identifiers = {
            facebook: 'facebook.com',
            gplus: 'plus.google.com'
        };

        // Determine if user is on network
        var network = null;
        for (var name in identifiers) {
            var url = identifiers[name];

            if ((window.location + '').indexOf(url) >= 0) {
                // Set network and break
                network = name;
                break;
            }
        }

        // If no network has been detected...
        if (network === null) {
            return;
        }

        log('ObserverEngine', 'Integrate into network: ' + network);

        // Register global click event listener
        $(document).on('click', function(event) {
            handleClick(event, network);
        });
    };

    return ObserverEngine;
})($);

module.exports = ObserverEngine;
