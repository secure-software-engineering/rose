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
import DS from 'ember-data'
import _compact from 'npm:lodash/compact'
import _concat from 'npm:lodash/concat'
import _filter from 'npm:lodash/filter'
import _map from 'npm:lodash/map'
import _without from 'npm:lodash/without'
import uuid from 'npm:uuid'
import Queue from 'npm:promise-queue'

function getItem(key) {
    return new Ember.RSVP.Promise((resolve, reject) => {
        kango.invokeAsyncCallback('localforage.getItem', key, (data) => {
            resolve(data)
        })
    })
}

function setItem(key, value) {
    return new Ember.RSVP.Promise((resolve, reject) => {
        kango.invokeAsyncCallback('localforage.setItem', key, value, (data) => {
            resolve()
        })
    })
}

function removeItem(key) {
    return new Ember.RSVP.Promise((resolve, reject) => {
        kango.invokeAsyncCallback('localforage.removeItem', key, () => {
            resolve()
        })
    })
}

export default DS.Adapter.extend({
    queue: new Queue(1, Infinity),

    shouldReloadAll() {
        return true
    },

    generateIdForRecord(store, type, inputProperties) {
        return uuid.v4()
    },

    findRecord(store, type, id, snapshot) {
        const modelName = this.modelNamespace
        const key = [modelName, id].join('/')

        return getItem(key).then(record => {
            return (!record) ? Ember.RSVP.reject() : record
        })
    },

    createRecord(store, type, snapshot) {
        const modelName = this.modelNamespace
        const collectionName = this.collectionNamespace
        const id = snapshot.id
        const key = [modelName, id].join('/')
        const data = this.serialize(snapshot, { includeId: true })

        return this.queue.add(() => {
            return setItem(key, data)
                .then(() => getItem(collectionName))
                .then(collection => _compact(_concat(collection, key)))
                .then(collection => setItem(collectionName, collection))
        })
    },

    updateRecord(store, type, snapshot) {
        const modelName = this.modelNamespace
        const id = snapshot.id
        const key = [modelName, id].join('/')
        const data = this.serialize(snapshot, { includeId: true })

        return this.queue.add(() => {
            return setItem(key, data)
        })
    },

    deleteRecord(store, type, snapshot) {
        const modelName = this.modelNamespace
        const collectionName = this.collectionNamespace
        const id = snapshot.id
        const key = [modelName, id].join('/')

        return this.queue.add(() => {
            return removeItem(key)
                .then(() => getItem(collectionName))
                .then(collection => _without(collection, key))
                .then(collection => setItem(collectionName, collection))
        })
    },

    findAll(store, type, sinceToken, snapshotRecordArray) {
        const collectionName = this.collectionNamespace

        return getItem(collectionName)
            .then(collection => _map(collection, item => getItem(item)))
            .then(queries => Ember.RSVP.all(queries))
    },

    query(store, type, query, recordArray) {
        const collectionName = this.collectionNamespace

        return getItem(collectionName)
            .then(collection => _map(collection, item => getItem(item)))
            .then(queries => Ember.RSVP.all(queries))
            .then(records => _filter(records, query))
    }
});
