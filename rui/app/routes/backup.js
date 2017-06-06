/*
Copyright (C) 2015-2017
    Felix A. Epp <work@felixepp.de>
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
import Ember from 'ember'

let addDateString = (dateKeys) => {
  return (record) => {
    for (let dateKey of dateKeys) {
      if (record[dateKey] !== undefined) {
        record[dateKey + 'String'] = new Date(record[dateKey]).toISOString()
      }
    }
    return record
  }
}

let getItem = (key, dateKeys) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      if (dateKeys) {
        data = data.map(addDateString(dateKeys))
      }
      resolve({
        type: key,
        data: data
      })
    })
  })
}

export default Ember.Route.extend({
  model: function () {
    let getModels = (key, dateKeys) => {
      return this.store.findAll(key).then((records) => {
        let data = records.invoke('serialize')
        if (dateKeys) {
          data.map(addDateString(dateKeys))
        }
        return {
          type: key,
          data: data
        }
      })
    }

    let promises = [
      getModels('comment', ['createdAt', 'updatedAt']),
      getModels('interaction', ['createdAt']),
      getModels('extract', ['createdAt']),
      getModels('diary-entry', ['createdAt', 'updatedAt']),
      getModels('user-setting'),
      getModels('system-config'),
      getItem('click-activity-records', ['date']),
      getItem('mousemove-activity-records', ['date']),
      getItem('window-activity-records', ['date']),
      getItem('scroll-activity-records', ['date']),
      getItem('fb-login-activity-records', ['date']),
      getItem('install-date'),
      getItem('rose-data-version')
    ]

    return Ember.RSVP.all(promises)
  }
})
