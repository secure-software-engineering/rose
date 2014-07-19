var $      = require('jquery'),
    config = require('./config'),
    log    = require('./log');

function getStatus(type, callback) {
    // Fetch elements from storage
    kango.invokeAsync('kango.storage.getItem', type, function (elements) {
        var status = {};
        
        elements.forEach(function (element) {
            // Extract name and version of element
            status[element.name] = element.version;
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
    var current = updates.unshift();
    
    // Load file
    $.get(current.url, function (element) {
        try {
            // Parse raw data into JSON
            observer = JSON.parse(element);
        } catch (exception) {
            // Report exception
            log('Updater', 'Malformed ' + type + ' file for element ' + current.name + '.');
            
            // Update remaining observers (remember: update list has been unshifted)
            update(type, updates);
            
            return;
        }
        
        // TODO: Check observer for validity.
        
        // Get observers from storage
        kango.invokeAsync('kango.storage.getItem', type, function (elements) {
            // Update element
            elements[element.name] = element;
            
            kango.invokeAsync('kango.storage.setItem', type, elements, function next() {
                // Update remaining elements (remember: update list has been unshifted)
                update(type, updates);
            });
        });
    });
}

function check(type, repository) {
    getStatus(type, function (status) {
        // List of elements to update
        var update = {};
        
        // Determine type of update
        var container = null;
        switch (type) {
        case 'observers':
            container = repository.observers;
            break;
        case 'extractors':
            container = repository.extractors;
            break;
        }
        
        // If no container found, return
        if (container === null) {
            return;
        }
        
        // Check every available element in repository
        container.forEach(function (element) {
            // Dismiss if observer is known and already up-to-date
            if (element.name in status && element.version <= status[element.name]) {
                return;
            }
            
            // Otherwise: add element to update list
            update[element.name] = element.url;
        });
        
        update(type, update);
    });
}

var Updater = {
    sync: function sync() {
        // Fetch repository information
        $.get(config.repositoryUrl, function (repository) {
            try {
                // Parse raw data into JSON
                repository = JSON.parse(repository);
            } catch (exception) {
                // Report exception
                log('Updater', 'Malformed repository file: ' + exception);
                
                return;
            }
            
            // Check observers and extractors for updates
            check('observers',  repository);
            check('extractors', repository);
        });
    }
};

module.exports = Updater;
