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

/**
* Prints the module name, a message, and a timestamp.
*
* @method log
* @param {String} module Name of the module
* @param {String} message Message to be logged
*/
export default function (module, message) {
    var time = (function() {
        var now = new Date();

        // Adds a preceding "0" to a number if it's below 10
        var format = function format(number) {
            return number < 10 ? '0' + number : number;
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
}
