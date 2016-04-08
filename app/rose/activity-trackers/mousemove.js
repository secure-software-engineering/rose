/*
Copyright (C) 2015
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

let type = 'mousemove'
let network = ''
let mouseMoveDistance = 0
let lastPosition = {
    x: undefined,
    y: undefined
}

let store = function () {
    if (mouseMoveDistance > 0) {
        kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
            records = records || []
            records.push({
                type: type,
                date: Date.now(),
                value: Math.round(mouseMoveDistance),
                network: network
            })
            kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
                mouseMoveDistance = 0
            })
        })
    }
}

let start = function (nw) {
    network = nw

    $(document).on('mousemove', (e) => {
        const currentPosition = {
            x: e.pageX,
            y: e.pageY
        }

        if (lastPosition.x && lastPosition.y) {
            const xDifference = currentPosition.x - lastPosition.x
            const yDifference = currentPosition.y - lastPosition.y

            const distance = Math.sqrt((xDifference * xDifference) +
        (yDifference * yDifference))

            mouseMoveDistance += distance
        }

        lastPosition = currentPosition
    })

    setInterval(store, 60000)
}

export default {
    start
}
