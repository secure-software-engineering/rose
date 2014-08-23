var log = require('./../log'),
    $ = require('../../../libs/jquery.patterns.shim'),
    Heartbeat = require('./heartbeat');

/**
 * @module Core
 * @submodule Extractor Engine
 */
module.exports = (function($) {
    var ExtractorEngine = {};

    var extractors = [];

    var handle = function handle(extract) {
        $.get(extract.url, function handleResponse(content) {
            // TODO: Execute process function or apply patterns of extractor
        });
    };

    var apply = function apply(extractor) {
        log('ExtractorEngine', 'Apply extractor: ' + extractor.name);

        // Schedule extractor task
        Heartbeat.schedule(extractor.name, extractor.interval, {}, function() {
            // Iterate through extracts and execute them
            for (var i in extractor.extracts) {
                var extract = extractor.extracts[i];

                // Handle extraction process
                handle(extract);
            }
        });
    };

    /**
     * Adds an extractor to the engine.
     *
     * @method add
     * @param {Object} extractor The extractor to be added
     */
    ExtractorEngine.add = function add(extractor) {
        log('ExtractorEngine', 'Add extractor: ' + extractor.name);

        // Push to extractors list
        extractors.push(extractor);
    };

    /**
     * Registers a new task for every extractor to the Heartbeat
     * and sets up extraction process.
     *
     * @method register
     */
    ExtractorEngine.register = function register() {
        log('ExtractorEngine', 'Register to Heartbeat');

        // Register all extractors to Heartbeat
        for (var i in extractors) {
            var extractor = extractors[i];

            // Apply extractor and register it to Heartbeat
            apply(extractor);
        }
    };

    return ExtractorEngine;
})($);
