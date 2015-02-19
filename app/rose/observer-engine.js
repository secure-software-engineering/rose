/** @module observer-engine */

/** Requirements */
//import storage from 'rose/storage';
import log from 'rose/log';
require('../scripts/jquery.patterns.js');
//import crypto from 'rose/crypto';

/**
 * Hard coded observers for testing
 * Should be removed when connected to settings module
 */

var obs = [{
  name: "like",
  network: "facebook",
  type: "click",
  priority: 1,
  patterns: [
    {
      node: ".UFILikeLink span",
      container: "._x72",
      pattern: '<div class="._x72"><div class="userContentWrapper"><div class="userContent">{id}</div></div></div>',
      process: "function process(info, $node) { info.id = hash(info.id); return info; }"
    }
  ]
},
{
  name: "profileview",
  network: "facebook",
  type: "click",
  priority: 1,
  patterns: [
    {
      node: "a[data-hovercard*=\"user\"]",
      container: "span",
      pattern: '<span><a data-hovercard="{id}"></a></span>',
      process: "function process(info, $node) { var pattern = /id=(.+)&/; info.id = info.id.match(pattern)[1]; return info; }"
    }
  ]
}];

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

      // debugger;

      // Only continue if parent container can be found
      if ($node.parents(entry.container).length) {
        var container = $node.closest(entry.container);

        // Extract information
        var result = $(container).applyPattern({
          structure: entry.pattern
        });

        // Store the extracted information if something is found
        if (result.success) {
          // Process data
          var extract = entry.process(result.data[0], $node);

          // Store interaction
          // storeInteraction(observer.name, observer.network, observer.version, extract);
          log('Store Interaction:'  + extract);
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
  observers = _.sortBy(obs, function (a) { return a.priority; }).reverse();

  // Register global 'click' event
  $(document).on('click', function(event) {
    handleClick(event, observers);
  });


  //FIXME: Register global 'click' event
}

export default {
  register: function() {
    /**
     * URL identifiers of social networks.
     * FIXME: identifiers should load from settings
     */
    var identifiers = {
      facebook: 'facebook.com',
      googleplus: 'plus.google.com'
    };

    // Detect network, if possible
    var network = null;
    for (var name in identifiers) {
      var networkDomain = identifiers[name];

      if ((new RegExp('^https:\/\/[\w\.\-]*(' + networkDomain.replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {
        network = name;

        log('ObserverEngine','Match Network ' + network);

        break;
      }
    }

    // Stop if no network has been found
    if (network === null) {
      log('ObserverEngine','Not tracked Site');
      return;
    }

    //retrieve Observers for current network from storage
    // kango.invokeAsync('kango.storage.getItem', 'observers', function (observers) {
      // // Create observers, if neccessary
      // observers = observers || [];

      var observers = [];

      // Add hardcoded observers
      observers = observers.concat(obs);

      console.log(observers);

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
    // });
  }
};
