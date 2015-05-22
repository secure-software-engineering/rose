/** @module observer-engine */

/** Requirements */
import log from 'rose/log';
import observersCollection from 'rose/collections/observers';
import interactionsCollection from 'rose/collections/interactions';
import {sha1 as hash} from 'rose/crypto';
var interactions;

var extractors =
{
  'StatusUpdate':
  {
    fields: [{
      name: 'sharerId',
      selector: '> div > a',
      attr: 'href',
      match: '.+profile\\.php\\?id=\\d+(?=\\&)|.+(?=\\?)|.+',
      hash: true
    }, {
      name: 'contentId',
      selector: '> div.clearfix > div > div > div > div > div > span > span > a:first-child',
      match: '.+(?=\\?)|.+',
      attr: 'href',
      hash: true
    }]
  },

  'UserLink':
  {
    fields: [
    {
      name: 'userId',
      attr: 'href',
      match: '.+profile\\.php\\?id=\\d+(?=\\&)|.+(?=\\?)|.+',
      hash: true
    }]
  }};

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


function extractData($container, extractorName) {
  var extractor = extractors[extractorName];
  var data = {};

  for (var i = 0; i < extractor.fields.length; i++) {
    var field = extractor.fields[i];
    var $elem;
    if (field.selector !== undefined) {
      $elem = $container.find(field.selector);
    }
    else {
      $elem = $container;
    }
    if ($elem.length) {
      var datum;
      if (field.attr === 'content') {
        datum = $elem.html();
      }
      else {
        datum = $elem.attr(field.attr);
      }
      //something found?
      if (datum !== '') {

        //extract detailed info with match
        if (field.match !== undefined) {
          datum = datum.match(new RegExp(field.match, 'g'))[0];
        }

        if (field.hash) {
          datum = hash(datum);
        }

        data[field.name] = datum;
      }
    }
  }

  return data;

}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} node - The node which trigger this
 * @param {object} pattern - a single pattern
 */
function classifiy($node, pattern) {

  // Check if node matches any selectors
  if (typeof pattern.node === 'string' ) {
    pattern.node = [ pattern.node ];
  }
  for (var i = 0; i < pattern.node.length; i++) {
    if ($node.is(pattern.node[i])) {

      // Only continue if parent container can be found
      var $container = $node.closest(pattern.container);
      if ($container.length) {

        //success
        return $container;
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
      var $container = classifiy($node, pattern);
      // Store interaction
      if ($container !== undefined) {

        //Try to extract fields
        if (pattern.extractor) {
          var extract = extractData($container, pattern.extractor);
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
  extractData: extractData,
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
