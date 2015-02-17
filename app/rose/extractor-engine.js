import log from 'rose/log';
//var $ = require('../scripts/jquery.patterns.js');
    //Heartbeat = require('./heartbeat');

/**
 * @module Core
 * @submodule Extractor Engine
 */
export default (function($) {
    var ExtractorEngine = {};

    var extractors = [];

    var handle = function handle(extract) {
        $.get(extract.informationUrl, function handleResponse(content) {
            // TODO: Execute process function or apply patterns of extractor
            log('ExtractorEngine','processing');
           // var process = JSON.parse(extract.process);
           // var entry = process(content);
           // log('EngineExtractor', entry);


           /**
            * Start Test Processing
            * Fix: Use Pattern Shim
            */
            var $data, entry;
            $data = $(content);
            entry = {};
            $data.find(".fbSettingsSectionsItem").each(function() {
              var section;
              section = $(this).find(".fbSettingsSectionsItemName").html();
              entry[section] = {};
              return $(this).find(".fbSettingsListItemContent").each(function() {
                var key, value;
                key = $(this).find("div:nth-child(1)").html();
                value = $(this).find("div:nth-child(2)").html();
                 entry[section][key] = value;
                 return;
              });
            });
            console.log( entry);
            /**
            * End Test Processing
            */


        });
    };

    var apply = function apply(extractor) {
        log('ExtractorEngine', 'Apply extractor: ' + extractor.name);

        // Schedule extractor task
        //Heartbeat.schedule(extractor.name, extractor.interval, {}, function() {
            // Iterate through extracts and execute them
            // for (var i in extractor.extracts) {
            //     var extract = extractor.extracts[i];

            //     // Handle extraction process
            //     handle(extract);
            // }
        //});
        handle(extractor);
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
