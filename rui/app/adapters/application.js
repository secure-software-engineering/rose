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
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';

export default LFAdapter.extend({
  shouldReloadAll() {
    return true
  },

  loadData: function() {
    var adapter = this;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      kango.invokeAsyncCallback('localforage.getItem', adapter.adapterNamespace(), function(storage) {
        var resolved = storage ? storage : {};
        resolve(resolved);
      });
    });
  },

  persistData: function(type, data) {
    var adapter = this;
    var modelNamespace = this.modelNamespace(type);
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (adapter.caching !== 'none') {
        adapter.cache.set(modelNamespace, data);
      }
      adapter.loadData().then(function(localStorageData) {
        localStorageData[modelNamespace] = data;
        var toBePersisted = localStorageData;

        kango.invokeAsyncCallback('localforage.setItem', adapter.adapterNamespace(), toBePersisted, function() {
          resolve();
        });
      });
    });
  },

  _namespaceForType: function(type) {
    var namespace = this.modelNamespace(type);
    var adapter = this;
    var cache;
    var promise;

    if (adapter.caching !== 'none') {
      cache = adapter.cache.get(namespace);
    } else {
      cache = null;
    }
    if (cache) {
      promise = new Ember.RSVP.resolve(cache);
    } else {
      promise = new Ember.RSVP.Promise(function(resolve, reject) {
        kango.invokeAsyncCallback('localforage.getItem', adapter.adapterNamespace(), function(storage) {
          var ns = storage ? storage[namespace] || { records: {} } : { records: {} };
          if (adapter.caching === 'model') {
            adapter.cache.set(namespace, ns);
          } else if (adapter.caching === 'all') {
            if (storage) {
              adapter.cache.replace(storage);
            }
          }
          resolve(ns);
        });
      });
    }
    return promise;
  },
});
