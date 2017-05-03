/*
Copyright (C) 2015-2017
    Oliver Hoffmann <oliverh855@gmail.com>

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

let type = 'click'
let clickCount = 0
let network = ''
let interval

let store = function () {
    if (clickCount > 0) {
        kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
            records = records || []
            records.push({
                type: type,
                date: Date.now(),
                value: clickCount,
                network: network
            })
            kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
                clickCount = 0
            })
        })
    }
}

let start = function (nw) {
    network = nw

    $(document).on('click', () => {
        clickCount++
    })

    interval = setInterval(store, 60000)
}

let stop = function () {
    $(document).off('click')
    clearInterval(interval)
    store()
}

export default {
    start,
    stop
}
