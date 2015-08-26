import Ember from 'ember';
import DS from 'ember-data';
import LFQueue from './utils/queue';

export default DS.Adapter.extend({
  queue: LFQueue.create(),

  createRecord: function(store, type, snapshot) {
    const collectionNamespace = this.collectionNamespace;
    const modelNamespace = this.modelNamespace;
    const id = snapshot.id;
    const serializer = store.serializerFor(snapshot.modelName);
    const recordHash = serializer.serialize(snapshot, { includeId: true });

    return this.queue.attach(function (resolve) {
      kango.invokeAsyncCallback('localforage.getItem', collectionNamespace, function (list) {
        if (Ember.isEmpty(list)){
          list = [];
        }

        if (!list.contains(modelNamespace + '/' + id)) {
          list.push(modelNamespace + '/' + id);
        }

        kango.invokeAsyncCallback('localforage.setItem', collectionNamespace, list, function () {
          kango.invokeAsyncCallback('localforage.setItem', modelNamespace + '/' + id, recordHash, function () {
            resolve(recordHash);
          });
        });
      });
    });
  },

  findAll: function() {
    return getList(this.collectionNamespace)
      .then(function(comments) {
        if (Ember.isEmpty(comments)) {
          return [];
        }

        let promises = [];

        comments.forEach(function(id) {
          promises.push(getItem(id));
        });

        return Ember.RSVP.all(promises).then(function(comments) {
          return comments.map(function(comment) {
            comment.rating = [].concat(comment.rating);
            return comment;
          });
        });
      });
  },

  find: function(store, type, id, snapshot) {
    var adapter = this;

    return getItem(adapter.modelNamespace + '/' + id);
  },

  findQuery: function(store, type, query, recordArray) {
    return getList(this.collectionNamespace)
      .then(function(comments) {
        if (Ember.isEmpty(comments)) {
          return [];
        }

        let promises = [];

        comments.forEach(function(id) {
          promises.push(getItem(id));
        });

        return Ember.RSVP.all(promises).then(function(comments) {
          return comments.filter(function(comment) {
            let result = false;

            Object.keys(query).forEach(function(key) {
              result = comment[key] == query[key];
            });

            return result;
          });
        });
      });
  },

  deleteRecord: function(store, type, snapshot) {
    let id = snapshot.id;
    return this.removeItem(id);
  },

  updateRecord: function(store, type, snapshot) {
    const id = snapshot.id;
    const modelNamespace = this.modelNamespace;
    const recordHash = snapshot.serialize({ includeId: true });

    return this.queue.attach(function(resolve, reject) {
      kango.invokeAsyncCallback('localforage.setItem',  modelNamespace + '/' + id, recordHash, function() {
        resolve();
      });
    });
  },

  removeItem: function(id) {
    const collectionNamespace = this.collectionNamespace;
    const modelNamespace = this.modelNamespace;

    return this.queue.attach(function(resolve, reject) {
      kango.invokeAsyncCallback('localforage.getItem', collectionNamespace, function(collection) {
        if (!Ember.isEmpty(collection)) {
          let index = collection.indexOf(modelNamespace + '/' + id);

          if (index > -1) {
            collection.splice(index, 1);

            kango.invokeAsyncCallback('localforage.setItem', collectionNamespace, collection, function() {
              kango.invokeAsyncCallback('localforage.removeItem', modelNamespace + '/' + id, function() {
                resolve();
              });
            });
          }
        }
      });
    });
  }
});

function getList(namespace) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    kango.invokeAsyncCallback('localforage.getItem', namespace, function(list) {
      resolve(list);
    });
  });
}

function getItem(id) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    kango.invokeAsyncCallback('localforage.getItem', id, function(item) {
      resolve(item);
    });
  });
}
