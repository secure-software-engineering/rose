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
import Ember from 'ember';

const { isEmpty } = Ember;
const { service } = Ember.inject;
const { Promise } = Ember.RSVP;

export default Ember.Service.extend({
    store: service(),

    setup() {
        const store = this.get('store');

        const userSettings = store.findRecord('user-setting', 1)
            .catch(() => store.createRecord('user-setting', { id: 1 }).save())
            .then(settings => this.set('user', settings))

        const systemSettings = store.findRecord('system-config', 1)
            .catch(() => store.createRecord('system-config', { id: 1 }).save())
            .then(settings => this.set('system', settings))

        return Promise.all([userSettings, systemSettings]);
    }
});
