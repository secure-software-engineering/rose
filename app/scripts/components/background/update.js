/** @module update */

/** Requirements */
var $      = require('../../../libs/jquery.patterns.shim'),
    config = require('./../config'),
    log    = require('./../log'),
    verify = require('./../crypto').verify,
    hash   = require('./../crypto').sha1;

function getStatus(type, callback) {
    // Fetch elements from storage
    kango.invokeAsync('kango.storage.getItem', type, function (elements) {
        // Create container if necessary
        elements = elements || {};

        var status = {};

        Object.keys(elements).forEach(function (name) {
            // Extract name and version of element
            status[name] = elements[name].version;
        });

        callback(status);
    });
}

function update(type, updates) {
    // Return if updates list is empty
    if (updates.length === 0) {
        return;
    }

    // Get first update element (and unshift)
    var current = updates.shift();

    // Load file
    $.ajax({
        type: "GET",
        url: current.url,
        dataType: "text"
    }).done(function (element) {
        try {
            // Parse raw data into JSON
            element = JSON.parse(element);
        } catch (exception) {
            // Report exception
            log('Updater', 'Malformed ' + type + ' file for element ' + current.name + '.');

            // Update remaining observers (remember: update list has been unshifted)
            update(type, updates);

            return;
        }

        // Verify signature
        if (hash(element) !== current.signature) {
            // Signature is invalid - update remaining observers
            update(type, updates);

            return;
        }

        // Get observers from storage
        kango.invokeAsync('kango.storage.getItem', type, function (elements) {
            // Create container if necessary
            elements = elements || {};

            // Update element
            elements[element.name] = element;

            kango.invokeAsync('kango.storage.setItem', type, elements, function next() {
                // Update remaining elements (remember: update list has been unshifted)
                update(type, updates);
            });
        });
    }).fail(function (jqXHR, textStatus, errorThrown) {
        log('Updater', 'Could not load element: ' + current.url);
    });
}

function check(type, repository) {
    getStatus(type, function(status) {
        // List of elements to update
        var updates = [];

        // Determine type of update
        var container = null;
        switch (type) {
        case 'observers':
            container = repository.observers || {};
            break;
        case 'extractors':
            container = repository.extractors || {};
            break;
        }

        // If no container found, return
        if (container === null) {
            return;
        }

        // Check every available element in repository
        container.forEach(function (element) {
            // Dismiss if observer is known and already up-to-date
            if (status.hasOwnProperty(element.name) && element.version <= status[element.name]) {
                return;
            }

            // Otherwise: add element to update list
            updates.push({
                name: element.name,
                url: element.url,
                signature: element.signature
            });
        });

        update(type, updates);
    });
}

module.exports = {
    sync: function sync() {
        // Fetch repository information
        $.ajax({
            type: "GET",
            url: config('repository'),
            dataType: "text"
        }).done(function (repository) {
            // Save raw data for verification
            var data = repository;

            try {
                // Parse raw data into JSON
                repository = JSON.parse(repository);
            } catch (exception) {
                // Report exception
                log('Updater', 'Malformed repository file: ' + exception);

                return;
            }

            // Verify certificate
            if (hash(repository.certificate) !== config('fingerprint')) {
                log('Updater', 'Certificate of repository is invalid');

                return;
            }

            // Fetch signature of repository
            $.ajax({
                type: "GET",
                url: config('repository') + '.signed',
                dataType: "text"
            }).done(function (signature) {
                // Verify signature
                if (!verify(data, signature, repository.certificate)) {
                    log('Updater', 'Signature of repository is invalid');

                    return;
                }

                // Check observers and extractors for updates
                check('observers',  repository);
                check('extractors', repository);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                log('Updater', 'Could not load repository signature: ' + textStatus);
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            log('Updater', 'Could not load repository: ' + textStatus);
        });
    }
};
