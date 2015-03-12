/** @module observer-engine */

/** Requirements */
import log from 'rose/log';
require('../scripts/jquery.patterns.js');

import observersCollection from 'rose/collections/observers';
import interactionsCollection from 'rose/collections/interactions';
var interactions;

/**
 * Stores an interaction in storage.
 * @param {object} observer - the corresponding observer model
 * @param {object} data - The interaction's data.
 */
function storeInteraction(observer, data) {
  // Time
  data.createdAt = (new Date()).toJSON();

  // Save observer name and version
  data.origin = {
    observer: observer.get('name'),
    network: observer.get('network'),
    version:  observer.get('version')
  };

  // Logging interaction
  log('ObserverEngine', 'New interaction: ' + JSON.stringify(data));
  interactions.create(data);
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} node - The node which trigger this
 * @param {object} pattern - a single pattern
 */
function handlePattern($node, pattern) {
  // Check if node matches click event pattern
  if ($node.is(pattern.node)) {
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
        return pattern.process(result.data[0], $node);
      }
    }
  }
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
  for (var o = 0; o < observers.length; o++) {
    var observer = observers[o];
    var patterns = observer.get('patterns');

    // Apply patterns
    for (var p = 0; p < patterns.length; p++) {
      var pattern = patterns[p];
      var extract = handlePattern($node, pattern);
      // Store interaction
      if (extract !== undefined) {
        storeInteraction(observer, extract);
        break;
      }
    }
  }
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
  handlePattern: handlePattern,
  register: function(network) {
    var observers = new observersCollection();
    observers.fetch({success: function (){

      var obs = observers.where({network: network});

      //Integrate observers into DOM
      integrate(obs);
      log('ObserverEngine', 'Integrated ' + obs.length + ' observers');
    }});
  }
};
