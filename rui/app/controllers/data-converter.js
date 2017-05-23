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
import _isArray from 'npm:lodash/isArray'
import PapaParse from 'npm:papaparse'
import flat from 'npm:flat'

export default Ember.Controller.extend({
    tables: [],
    selectedTable: null,

    roseDataObject: null,

    actions: {
        updateSelected (component, id) {
            this.set('selectedTable', id)

            this.send('converToCSV')
        },

        fileLoaded (file) {
            const tables = []
            const text = file.data
            const json = JSON.parse(text)

            this.set('roseDataObject', json)

            for (let key in json) {
                const value = json[key]
                if (_isArray(value)) {
                    tables.pushObject(key)
                }
            }

            this.set('tables', tables)
        },

        converToCSV () {
            const roseData = this.get('roseDataObject')
            const selectedTable = this.get('selectedTable')
            const data = roseData[selectedTable]

            const csv = PapaParse.unparse(data.map(record => flat(record)))

            this.set('csvtext', csv)
        },

        download () {
            window.saveAs(new Blob([this.get('csvtext')]), `${this.get('selectedTable')}.csv`);
        }
    }
});
