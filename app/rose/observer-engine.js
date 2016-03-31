/*
Copyright (C) 2013-2015
    Oliver Hoffmann <oliverh855@gmail.com>
    Sebastian Ruhleder <sebastian.ruhleder@gmail.com>
    Felix Epp <work@felixepp.de>

This file is part of ROSE.

ROSE is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ROSE is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ROSE.  If not, see <http://www.gnu.org/licenses/>.
 */

import $ from 'jquery'

import log from 'rose/log'
import ObserversCollection from 'rose/collections/observers'
import InteractionsCollection from 'rose/collections/interactions'
import ExtractorEngine from 'rose/extractor-engine'
var interactions
var extractorEngine

/**
 * Stores an interaction in storage.
 * @param {object} observer - the corresponding observer model
 * @param {object} data - The interaction's data.
 */
function storeInteraction (observer, extracts = {}) {
    var data = {}

    // Time
    data.createdAt = (new Date()).toJSON()

    // Save observer name and version
    data.origin = {
        observer: observer.get('name'),
        network: observer.get('network'),
        version: observer.get('version')
    }

    if (extracts !== {}) {
        data.origin.target = extracts
    }

    // Logging interaction
    log('ObserverEngine', 'New interaction: ' + JSON.stringify(data))
    interactions.create(data)
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} node - The node which trigger this
 * @param {object} pattern - a single pattern
 */
function classifiy ($node, pattern) {
    // Check if node matches the selectors
    if ($node.is(pattern.node)) {
        // Only continue if parent container can be found
        var $container = $node.closest(pattern.container)
        if ($container.length) {
            // success
            return $container
        }
    }
}

/**
 * Handles click events and uses the supplied observers to apply
 * patterns.
 * @param {object} event - An event object.
 * @param {array} observers - A set of observers.
 */
function handleEvent (event, observers) {
    // Drop events created by scripts
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
    if (!event.isTrusted) return

    // Wrap event target
    var $node = $(event.target)

    // Apply observers
    for (let observer of observers) {
        var patterns = observer.get('patterns')

        // Apply patterns
        for (let pattern of patterns) {
            var $container = classifiy($node, pattern)
            // Store interaction
            if ($container !== undefined) {
                // Try to extract fields
                if (pattern.extractor) {
                    var extract = extractorEngine.extractFieldsFromContainerByName($container, pattern.extractor)
                    storeInteraction(observer, extract)
                } else {
                    storeInteraction(observer)
                }
                return
            }
        }
    }
}

/**
 * Integrates a set of observers into the DOM of the page.
 * @param {array} observers - A set of observers.
 */
function integrate (observers) {
    // Register global 'click' event
    if (observers.length) {
        interactions = new InteractionsCollection()
        interactions.fetch({success: function () {
            // Filter anbd prioritize observers for correct event type and defer event handling
            var clickObservers = observers.filter(function (observer) {
                return observer.get('type') === 'click'
            })
            if (clickObservers.length) {
                document.addEventListener('click', function (event) {
                    handleEvent(event, clickObservers)
                }, true)
            }

            var inputObservers = observers.filter(function (observer) {
                return observer.get('type') === 'input'
            })
            if (inputObservers.length) {
                document.addEventListener('keyup', function (event) {
                    // check for enter keyup
                    if (event.keyCode === 13) {
                        handleEvent(event, inputObservers)
                    }
                }, true)
            }
        }})
    }
}

export default {
    register: function (network) {
        var observers = new ObserversCollection()
        observers.fetch({success: function () {
            var obs = observers.where({network: network})

            // Integrate observers into DOM
            integrate(obs)
            console.log('ROSE ObserverEngine: Integrated ' + obs.length + ' observers')
        }})
        extractorEngine = new ExtractorEngine()
    }
}
