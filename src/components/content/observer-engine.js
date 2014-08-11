/** @module observer-engine */

/** Requirements */
var Storage = require('../storage'),
    log     = require('../log'),
    $       = require('jquery-patterns'),
    Storage = require('../storage');

/**
 * URL identifiers of social networks.
 */
var identifiers = {
  facebook: 'facebook.com',
  googleplus: 'plus.google.com'
};

/**
 * Stores an interaction in storage.
 * @param {string} name - The interaction's name.
 * @param {string} network - The network in which the interaction took place.
 * @param {object} data - The interaction's data.
 */
function storeInteraction(name, network, data) {
  // Set type for storage
  data.type = 'interaction';
  
  // Add data
  Storage.add(data);
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} event - An event object.
 * @param {array} observers - A set of observers.
 */
function handleClick(event, observers) {
  // Wrap event target
  var $node = $(event.target);
  
  // Apply observers
  observers.forEach(function(observer) {
    // Apply patterns
    observer.patterns.forEach(function(entry) {
      // Only continue if parent container can be found
      if ($node.parents(entry.container).length > 0) {
        var container = $node.closest(entry.container);
        
        // Extract information
        var result = $(container).applyPattern({
          structure: entry.pattern
        });
        
        // Store the extracted information if something is found
        if (result.success) {
          // Process data
          var extract = entry.process(result.data[0]);
          
          // Store interaction
          storeInteraction(observer.name, observer.network, extract);
        }
      }
    });
  });
}

/**
 * Integrates a set of observers into the DOM of the page.
 * @param {array} observers - A set of observers.
 */
function integrate(observers) {
  // Register global 'click' event
  $(document).on('click', function(event) {
    // Filter observers for correct event type and defer event handling
    handleClick(event, observers.filter(function(observer) {
      return observer.type === 'click';
    }));
  });
}

module.exports = {
  register: function() {
    // Detect network, if possible
    var network = null;
    for (var name in identifiers) {
      var pattern = identifiers[name];
      
      if (window.location.indexOf(pattern) > -1) {
        network = name;
        
        break;
      }
    }
    
    // Stop if no network has been found
    if (network === null) {
      return;
    }
    
    kango.invokeAsync('kango.storaget.getItem', 'observers', function(observers) {
      // Filter observers and integrate into DOM
      integrate(observers.filter(function(observer) {
        return observer.network === network;
      }));
    });
  }
};