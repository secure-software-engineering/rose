/*
ROSE is a browser extension researchers can use to capture in situ
data on how users actually use the online social network Facebook.
Copyright (C) 2015

    Fraunhofer Institute for Secure Information Technology
    Andreas Poller <andreas.poller@sit.fraunhofer.de>

Authors

    Oliver Hoffmann <oliverh855@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

let type = 'mousemove';
let mouseMoveDistance = 0;
let lastPosition = {
  x: undefined,
  y: undefined
};

let store = function() {
  if (mouseMoveDistance > 0) {
    kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
      records = records || [];
      records.push({
        type: type,
        date: Date.now(),
        value: mouseMoveDistance
      });
      kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
        mouseMoveDistance = 0;
      });
    });
  }
};

let start = function() {
  $(document).on('mousemove', (e) => {
    const currentPosition = {
      x: e.pageX,
      y: e.pageY
    };

    if (lastPosition.x && lastPosition.y) {
      const xDifference = currentPosition.x - lastPosition.x;
      const yDifference = currentPosition.y - lastPosition.y;

      const distance = Math.sqrt((xDifference * xDifference) +
        (yDifference * yDifference));

      mouseMoveDistance += distance;
    }

    lastPosition = currentPosition;
  });

  setInterval(store, 60000);
};

export default {
  start
};
