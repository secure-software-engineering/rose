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

let type = 'scroll';
let lastPosition = 0;
let scrollDistance = 0;

let store = function() {
  if (scrollDistance > 0) {
    kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
      records = records || [];
      records.push({
        type: type,
        date: Date.now(),
        value: scrollDistance
      });
      kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
        scrollDistance = 0;
      });
    });
  }
};

let start = function() {
  $(document).on('scroll', () => {
    const currentPosition = $(document).scrollTop();
    const difference = Math.abs(lastPosition - currentPosition);

    scrollDistance += difference;
    lastPosition = currentPosition;
  });

  setInterval(store, 20000);
};

export default {
  start
};
