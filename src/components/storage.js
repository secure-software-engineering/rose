var RSVP = require('rsvp');
var $ = require('jquery');

/**
 * @module Core
 * @submodule Storage
 */
var Storage = (function() {
    var Storage = {};

    var init = function init(data) {
        var platforms = ['facebook'];

        data = $.extend({}, true, data);

        if (data === null || data === undefined) {
            data = {};
        }

        if (data.platforms === undefined) {
            data.platforms = {};
        }

        for (var i in platforms) {
            var platform = platforms[i];

            if (data.platforms[platform] === undefined) {
                data.platforms[platform] = {};

                data.platforms[platform].interactions = [];
                data.platforms[platform].comments = [];
                data.platforms[platform].staticInformation = {};
            }
        }

        return data;
    };

    /**
     * Adds an entry to storage.
     *
     * @method add
     */
    Storage.add = function add(object) {
        return new RSVP.Promise(function(resolve, reject) {
            kango.invokeAsync('kango.storage.getItem', 'rose-data', function(data) {
                // Make sure data object is well-formed
                data = init(data);

                // Create standard storage entry
                var entry = {
                    index: 0,
                    deleted: false,
                    hidden: false,
                    createdAt: new Date().toJSON(),
                    record: object.record
                };

                // Container
                var container = null;

                switch (object.type) {
                    case 'interaction':
                        // Set container to interactions array
                        container = data.platforms[object.platform].interactions;
                        break;
                    case 'comment':
                        // Set container to comments array
                        container = data.platforms[object.platform].comments;
                        break;
                    case 'diary':
                        // Set container to diary array
                        container = data.diary;
                        break;
                }

                // Update index
                entry.index = container.length + 1;

                // Add entry
                container.push(entry);

                // Write changes back to storage
                kango.invokeAsync('kango.storage.setItem', 'rose-data', data, resolve);
            });
        });
    };

    /**
     * Updates an entry in storage
     *
     * @method update
     * @param {Object} selector Information about entry
     * @param {Object} changes Changes to be applied to entry
     */
    Storage.update = function update(selector, changes) {
        return new RSVP.Promise(function(reject, resolve) {
            kango.invokeAsync('kango.storage.getItem', 'rose-data', function getItem(data) {
                // Make sure data object is well-formed
                data = init(data);

                // Set container
                var container = data.platforms[selector.platform][selector.container];

                // Find entry
                for (var i in container) {
                    var entry = container[i];

                    // If entry matches selector...
                    if (entry.index === selector.index) {
                        // Apply changes
                        for (var k in changes) {
                            entry.record[k] = changes[k];
                        }
                    }
                }

                kango.invokeAsync('kango.storage.setItem', 'rose-data', data, resolve);
            });
        });
    };

    /**
     * Removes an entry from storage.
     *
     * @method remove
     * @param {Object} selector Information about entry
     */
    Storage.remove = function remove(selector) {
        return new RSVP.Promise(function(resolve, reject) {
            kango.invokeAsync('kango.storage.getItem', 'rose-data', function getItem(data) {
                // Make sure data object is well-formed
                data = init(data);

                // Set container
                var container = data.platforms[selector.platform][selector.container];

                // Find entry
                for (var i in container) {
                    var entry = container[i];

                    // If entry matches selector...
                    if (entry.index === selector.index) {
                        // ... remove record...
                        entry.record = null;

                        // ... and set deleted flag
                        entry.deleted = true;
                    }
                }

                kango.invokeAsync('kango.storage.setItem', 'rose-data', data, resolve);
            });
        });
    };

    /**
     * Dumps the rose data.
     *
     * @method dump
     * @param {Function} callback Function that is called with the rose data dump as the first parameter
     */
    Storage.dump = function dump(callback) {
        return new RSVP.Promise(function(resolve, reject) {
            kango.invokeAsync('kango.storage.getItem', 'rose-data', resolve(data));
        });
    };

    return Storage;
})();

module.exports = Storage;
