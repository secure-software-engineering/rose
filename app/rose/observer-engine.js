/** @module observer-engine */

/** Requirements */
import log from 'rose/log';
import ObserversCollection from 'rose/collections/observers';
import InteractionsCollection from 'rose/collections/interactions';
import ExtractorEngine from 'rose/extractor-engine';
var interactions;
var extractorEngine;

/**
 * Stores an interaction in storage.
 * @param {object} observer - the corresponding observer model
 * @param {object} data - The interaction's data.
 */
function storeInteraction(observer, data = {}) {

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
function classifiy($node, pattern) {

  // Check if node matches the selectors
  if ($node.is(pattern.node)) {

    // Only continue if parent container can be found
    var $container = $node.closest(pattern.container);
    if ($container.length) {

      //success
      return $container;
    }
  }
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} event - An event object.
 * @param {array} observers - A set of observers.
 */
function handleEvent(event, observers) {
  // Wrap event target
  var $node = $(event.target);

  // Apply observers
  for (var o = 0; o < observers.length; o++) {
    var observer = observers[o];
    var patterns = observer.get('patterns');

    // Apply patterns
    for (var p = 0; p < patterns.length; p++) {
      var pattern = patterns[p];
      var $container = classifiy($node, pattern);
      // Store interaction
      if ($container !== undefined) {

        //Try to extract fields
        if (pattern.extractor) {
          var extract = extractorEngine.extractFieldsFromContainerByName($container, pattern.extractor);
          storeInteraction(observer, extract);
        }
        else {
          storeInteraction(observer);
        }
        return;
      }
    }
  }
}

/**
 * Integrates a set of observers into the DOM of the page.
 * @param {array} observers - A set of observers.
 */
function integrate(observers) {

  // Register global 'click' event
  if (observers.length) {
    interactions = new InteractionsCollection();
    interactions.fetch({success: function() {
      // Filter anbd prioritize observers for correct event type and defer event handling
      var clickObservers = observers.filter(function(observer) {
        return observer.get('type') === 'click';
      });
      if (clickObservers.length) {
        document.addEventListener('click', function(event) {
          handleEvent(event, clickObservers);
        }, true);
      }

      var inputObservers = observers.filter(function(observer) {
        return observer.get('type') === 'input';
      });
      if (inputObservers.length) {
        document.addEventListener('keyup', function(event) {
          //check for enter keyup
          if (event.keyCode === 13) {
            handleEvent(event, inputObservers);
          }
        }, true);
      }
    }});
  }

}

export default {
  register: function(network) {
    var observers = new ObserversCollection();
    observers.fetch({success: function (){

      var obs = observers.where({network: network});

      //Integrate observers into DOM
      integrate(obs);
      log('ObserverEngine', 'Integrated ' + obs.length + ' observers');
    }});
    extractorEngine = new ExtractorEngine();
  }
};
