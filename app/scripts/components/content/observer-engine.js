/** @module observer-engine */

/** Requirements */
var Storage = require('../storage'),
    log     = require('../log'),
    $       = require('../../../libs/jquery.patterns.shim'),
    _       = require('../../../../bower_components/underscore/underscore');

/**
 * Stores an interaction in storage.
 * @param {string} name - The interaction's name.
 * @param {string} network - The network in which the interaction took place.
 * @param {object} data - The interaction's data.
 */
function storeInteraction(name, network, version, data) {
  // Set type for storage
  data.type = 'interaction';
  
  // Save observer name and version
  data.origin = {
    observer: name,
    version:  version
  };

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

  // Sort observers by priority
  var sorted = _.sortBy(observers, function (a) { return a.priority; }).reverse();
  
  // Apply observers
  sorted.forEach(function(observer) {
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
          storeInteraction(observer.name, observer.network, observer.version, extract);
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
  log('ObserverEngine', 'Integrating observers');

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
    /**
     * URL identifiers of social networks.
     */
    var identifiers = {
      facebook: "facebook.com",
      googleplus: "plus.google.com"
    };

    // Detect network, if possible
    var network = null;
    for (var name in identifiers) {
      var pattern = identifiers[name];

      if ((window.location + '').indexOf(pattern) >= 0) {
        network = name;

        break;
      }
    }

    // Stop if no network has been found
    if (network === null) {
      return;
    }

    kango.invokeAsync('kango.storage.getItem', 'observers', function(observers) {
      // Create observers, if neccessary
      observers = observers || [];

      // Filter observers and integrate into DOM
      integrate(observers.filter(function(observer) {
        return observer.network === network;
      }));
    });
  }
};
