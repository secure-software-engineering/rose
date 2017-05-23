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

export default Ember.Controller.extend({
    actions: {
        save() {
            return this.get('model').save()
        },

        discard() {
            const observer = this.get('model')
            observer.rollbackAttributes()
        },

        addPattern() {
            const patterns = this.get('model.patterns')
            patterns.createFragment('pattern')
        },

        removePattern(pattern) {
            const patterns = this.get('model.patterns')
            patterns.removeObject(pattern)
        }
    }
});
