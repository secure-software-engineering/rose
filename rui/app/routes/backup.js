/*
Copyright (C) 2015-2016
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
import Ember from 'ember';

let getItem = (key) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      resolve({
        type: key,
        data: data
      });
    });
  });
};

export default Ember.Route.extend({
  model: function() {
    let promises = [
      this.store.findAll('comment').then((records) => { return {type: 'comment', data: records.invoke('serialize')} }),
      this.store.findAll('interaction').then((records) => { return {type: 'interaction', data: records.invoke('serialize')} }),
      this.store.findAll('extract').then((records) => { return {type: 'extract', data: records.invoke('serialize')} }),
      this.store.findAll('diary-entry').then((records) => { return {type: 'diary-entry', data: records.invoke('serialize')} }),
      this.store.findAll('user-setting').then((records) => { return {type: 'user-setting', data: records.invoke('serialize')} }),
      this.store.findAll('system-config').then((records) => { return {type: 'system-config', data: records.invoke('serialize')} }),
      getItem('click-activity-records'),
      getItem('mousemove-activity-records'),
      getItem('window-activity-records'),
      getItem('scroll-activity-records'),
      getItem('fb-login-activity-records'),
      getItem('install-date'),
      getItem('rose-data-version')
    ];

    return Ember.RSVP.all(promises);
  }
});
