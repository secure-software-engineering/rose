/** @module observer-engine */

/** Requirements */
import log from 'rose/log';
require('../scripts/jquery.patterns.js');

import observersCollection from 'rose/collections/observers';
import interactionsCollection from 'rose/collections/interactions';
var interactions;

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

  // Logging interaction
  log('ObserverEngine', 'New interaction: ' + JSON.stringify(data));
  interactions.create(data);
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} event - An event object.
 * @param {array} observers - A set of observers.
 */
function handleClick(event, observers) {
  // Wrap event target
  var $node = $(event.target);

  // Apply observers
  observers.forEach(function(observer) {
    // Apply patterns
    observer.get('patterns').forEach(function(pattern) {
      // Check if node matches click event pattern
      if (!$node.is(pattern.node)) {
        return;
      }

      // Only continue if parent container can be found
      if ($node.parents(pattern.container).length) {
        var container = $node.closest(pattern.container);

        // Extract information
        var result = $(container).applyPattern({
          structure: pattern.structure
        });

        // Store the extracted information if something is found
        if (result.success) {

          // Process data
          var extract = pattern.process(result.data[0], $node);

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

  // Filter anbd prioritize observers for correct event type and defer event handling
  observers = observers.filter(function(observer) {
    return observer.get('type') === 'click';
  });

  // Register global 'click' event
  if (observers.length) {
    interactions = new interactionsCollection();
    interactions.fetch({success: function() {
      $(document).on('click', function(event) {
        handleClick(event, observers);
      });
    }});
  }

}

export default {
  register: function(network) {
    var observers = new observersCollection();
    observers.fetch({success: function (){

      var obs = observers.where({network: network});

      //Integrate observers into DOM
      integrate(obs);
      log('ObserverEngine', 'Integrated' + obs.length + ' observers');
    }});
  }
};
