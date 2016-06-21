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
