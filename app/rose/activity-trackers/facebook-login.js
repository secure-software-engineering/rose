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

let type = 'fb-login';
let login = false;

let getLatestStatus = function() {
  return new Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
      records = records || [];
      let latest = records.pop();

      resolve((latest) ? latest.value : false);
    });
  });
};

let store = function() {
  return new Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', type + '-activity-records', (records) => {
      records = records || [];
      records.push({
        type: type,
        date: Date.now(),
        value: login
      });

      kango.invokeAsyncCallback('localforage.setItem', type + '-activity-records', records, () => {
        resolve();
      });
    });
  });
};

let checkStatus = async function() {
  let loginTmp = ($.cookie('c_user')) ? true : false;

  if (login !== loginTmp) {
    login = loginTmp;

    await store();
  }

  setTimeout(checkStatus, 1000);
};

let start = async function() {
  let networkDomain = 'facebook.com';

  if ((new RegExp('^https:\/\/[\w\.\-]*(' + networkDomain.replace(/\./g, '\\$&') + ')$')).test(window.location.origin)) {
    login = await getLatestStatus();

    checkStatus();
  }
};

export default {
  start
};
