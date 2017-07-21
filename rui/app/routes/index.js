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
import Ember from 'ember'

let getItem = (key) => {
  return new Ember.RSVP.Promise((resolve) => {
    kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
      resolve((data === null ? [] : data))
    })
  })
}

export default Ember.Route.extend({
  model () {
    return Ember.RSVP.hash({
      comments: this.store.findAll('comment'),
      interactions: this.store.findAll('interaction'),
      extracts: this.store.findAll('extract'),
      clicks: getItem('click-activity-records'),
      logins: getItem('fb-login-activity-records'),
      mousemoves: getItem('mousemove-activity-records'),
      scroll: getItem('scroll-activity-records'),
      windows: getItem('window-activity-records')
    })
  },

  setupController (controller, model) {
    this._super(controller, model)

    return this.store.findAll('network').then((networks) => {
      controller.set('networks', networks)
    })
  }
})
