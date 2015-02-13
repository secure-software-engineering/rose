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

        // Adds a preceding "0" to a number if it's below 10
        var format = function format(number) {
            return number < 10 ? "0" + number : number;
        };

        // Construct date string
        var date = [
            format(now.getDate()),
            format(1+now.getMonth()),
            now.getFullYear()
        ].join('.');

        // Construct time string
        var time = [
            format(now.getHours()),
            format(now.getMinutes()),
            format(now.getSeconds())
        ].join(':');

        return date + ' ' + time;
    })();

    console.log('[ROSE, module: %s, time: %s] %s', module, time, message);
};
