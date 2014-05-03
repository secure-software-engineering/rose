/**
* Prints the module name, a message, and a timestamp.
*
* @method log
* @param {String} module Name of the module
* @param {String} message Message to be logged
*/
module.exports = function log(module, message) {
    var time = (function() {
        var now = new Date();

        // Construct date string
        var date = [
            now.getDay(),
            now.getMonth(),
            now.getFullYear()
        ].join('.');

        // Construct time string
        var time = [
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        ].join(':');

        return date + ' ' + time;
    })();

    console.log('[ROSE, module: %s, time: %s] %s', module, time, message);
};
