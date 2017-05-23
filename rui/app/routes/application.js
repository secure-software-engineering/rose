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

export default Ember.Route.extend({
  beforeModel() {
    let settings = this.get('settings');
    return settings.setup();
  },

  afterModel() {
    this.set('i18n.locale', this.get('settings.user.currentLanguage'));
  },

  setupController(controller, model) {
    this._super(controller, model)

    return this.store.findAll('network').then((networks) => {
      controller.set('networks', networks);
    })
  },

  actions: {
    resetConfig() {
      let settings = this.get('settings.user');
      settings.destroyRecord()
        .then(() => this.get('settings').setup())
        .then(() => this.transitionTo('application'));
    },

    loading() {
      if (this.controller) {
        this.controller.set('isLoading', true)
        this.router.one('didTransition', () => {
          this.controller.set('isLoading', false)
        })
      }
      return true
    }
  }
});
