/*
Copyright (C) 2015-2017
    Oliver Hoffmann <oliverh855@gmail.com>
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
import Ember from 'ember'

export default Ember.Controller.extend({
  settings: Ember.inject.service('settings'),
  trackingEnabledLabel: function () {
    let trackingEnabled = this.get('settings.user.trackingEnabled')
    return this.get('i18n').t('index.tracking' + (trackingEnabled ? 'Enabled' : 'Disabled')).toString()
  }.property('settings.user.trackingEnabled'),
  actions: {
    toggleTracking () {
      this.get('settings.user').save().then(() => kango.dispatchMessage('toggle-tracking'))
    }
  }
})
