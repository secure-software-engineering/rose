/** @module observer-engine */

/** Requirements */
import log from 'rose/log';
require('../scripts/jquery.patterns.js');
var sortBy = require('lodash/collection/sortBy');
import {sha1 as hash} from 'rose/crypto';

import observersCollection from 'rose/collections/observers';

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

  // FIXME: Add data
  //Storage.add(data);
  console.log(data);
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
    observer.patterns.forEach(function(entry) {
      // Check if node matches click event pattern
      if (!$node.is(entry.node)) {
        return;
      }

      // Only continue if parent container can be found
      if ($node.parents(entry.container).length) {
        var container = $node.closest(entry.container);

        // Extract information
        var result = $(container).applyPattern({
          structure: entry.pattern
        });

        // Store the extracted information if something is found
        if (result.success) {

          console.log('Store Interaction:', result);

          //FIXME: use process function with hashing
          // Process data
          var extract = entry.process(result.data[0], $node);
          // var extract = result.data[0];

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
    return observer.type === 'click';
  });
  observers = sortBy(observers, function (a) { return a.priority; }).reverse();

  // Register global 'click' event
  $(document).on('click', function(event) {
    handleClick(event, observers);
  });


  //FIXME: Register global 'click' event
}

export default {
  register: function(network) {

    var observers = new observersCollection();
    observers.fetch({reset: true, success: function (){

      observers = observers.where({network: network});

      console.log('Stored Observers: ', observers);

      // Eval "process" functions
      for (var i = 0; i < observers.length; i++) {
        var observer = observers[i];

        for (var j = 0; j < observer.patterns.length; j++) {
          var pattern = observer.patterns[j];

          pattern.process = eval('(' + pattern.process + ')');
        }
      }

      //Integrate observers into DOM
      integrate(observers);
    }});
  }
};
