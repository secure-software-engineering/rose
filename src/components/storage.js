var RSVP = require('rsvp');
var $ = require('jquery');

/**
 * @module Core
 * @submodule Storage
 */
var Storage = function() {
    /**
     * Singleton
     */
    if (Storage.prototype._singleton) {
        return Storage.prototype._singleton;
    }
    Storage.prototype._singleton = this;
    
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
     * Collects all new data items to be written to storage
     *
     * @property data
     * @type Array
     */
    var data = [];
    
    /**
     * Dirty flag: Indiciates whether the data array has been updated
     * @property dirty
     * @type Boolean
     */
    var dirty = false;
    
    /**
     * Writing flag: Indicates whether a the storage is being updated
     *
     * @property writing
     * @type Boolean
     */
    var writing = false;
    
    /**
     * Checks regularly whether data has to be written to storage
     */
    setInterval(function () {
        if (dirty && !writing) {
            this._write();
        }
    }.bind(this), 100);
    
    var store = function (item) {
        return new RSVP.Promise(function (resolve, reject) {
            setTimeout(function() {
                kango.invokeAsync('kango.storage.getItem', 'rose-data', function (rosedata) {
                    // Make sure data object is well-formed
                    rosedata = init(rosedata);
                    
                    switch (item.action) {
                    case 'add':
                        // Create standard storage entry
                        var entry = {
                            index: 0,
                            deleted: false,
                            hidden: false,
                            createdAt: new Date().toJSON(),
                            record: item.object
                        };
                        
                        // Container
                        var container = null;
                        
                        switch (item.object.type) {
                        case 'interaction':
                            // Set container to interactions array
                            container = rosedata.platforms[item.object.platform].interactions;
                            break;
                        case 'comment':
                            // Set container to comments array
                            container = rosedata.platforms[item.object.platform].comments;
                            break;
                        case 'diary':
                            // Set container to diary array
                            container = rosedata.diary;
                            break;
                        }
                        
                        // Update index
                        entry.index = container.length + 1;
                        
                        // Add entry
                        container.push(entry);
                        break;
                    case 'update':
                        // Set container
                        var container = rosedata.platforms[item.selector.platform][item.selector.container];
                        
                        // Find entry
                        for (var i in container) {
                            var entry = container[i];
                        
                            // If entry matches selector...
                            if (entry.index === item.selector.index) {
                                // Apply changes
                                for (var k in changes) {
                                    entry.record[k] = item.changes[k];
                                }
                            }
                        }
                        break;
                    case 'remove':
                        // Set container
                        var container = rosedata.platforms[item.selector.platform][item.selector.container];
                        
                        // Find entry
                        for (var i in container) {
                            var entry = container[i];
                        
                            // If entry matches selector...
                            if (entry.index === item.selector.index) {
                                // ... remove record...
                                entry.record = null;
                        
                                // ... and set deleted flag
                                entry.deleted = true;
                            }
                        }
                        break;
                    }
                    
                    // Write changes back to storage
                    kango.invokeAsync('kango.storage.setItem', 'rose-data', rosedata, resolve);
                });
            }, item.delay);
        });
    };
    
    this._write = function () {
        writing = true;
        var dataCopy = $.extend(true, [], data);
        data = [];
        dirty = false;
        
        dataCopy.reduce(function (current, next) {
            return current.then(function () {
                return store(next);
            });
        }, RSVP.resolve()).then(function () {
            writing = false;
        }.bind(this));
    };

    /**
     * Adds an entry to storage.
     *
     * @method add
     */
    this.add = function add(object) {
        data.push({
            action: 'add',
            object: object,
            delay: 100
        });
        
        dirty = true;
    };

    /**
     * Updates an entry in storage
     *
     * @method update
     * @param {Object} selector Information about entry
     * @param {Object} changes Changes to be applied to entry
     */
    this.update = function update(selector, changes) {
        data.push({
            action: 'update',
            selector: selector,
            changes: changes,
            delay: 100
        });
        
        dirty = true;
    };

    /**
     * Removes an entry from storage.
     *
     * @method remove
     * @param {Object} selector Information about entry
     */
    this.remove = function remove(selector) {
        data.push({
            action: 'remove',
            selector: selector,
            delay: 100
        });
        
        dirty = true;
    };

    /**
     * Dumps the rose data.
     *
     * @method dump
     * @param {Function} callback Function that is called with the rose data dump as the first parameter
     */
    this.dump = function dump(callback) {
        return new RSVP.Promise(function(resolve, reject) {
            kango.invokeAsync('kango.storage.getItem', 'rose-data', resolve(data));
        });
    };
};

module.exports = Storage;
