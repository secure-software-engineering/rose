"use strict";
/* jshint ignore:start */

/* jshint ignore:end */

define('rose/adapters/application', ['exports', 'ember', 'ember-localforage-adapter/adapters/localforage'], function (exports, _ember, _emberLocalforageAdapterAdaptersLocalforage) {
  exports['default'] = _emberLocalforageAdapterAdaptersLocalforage['default'].extend({
    shouldReloadAll: function shouldReloadAll() {
      return true;
    },

    loadData: function loadData() {
      var adapter = this;
      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        kango.invokeAsyncCallback('localforage.getItem', adapter.adapterNamespace(), function (storage) {
          var resolved = storage ? storage : {};
          resolve(resolved);
        });
      });
    },

    persistData: function persistData(type, data) {
      var adapter = this;
      var modelNamespace = this.modelNamespace(type);
      return new _ember['default'].RSVP.Promise(function (resolve, reject) {
        if (adapter.caching !== 'none') {
          adapter.cache.set(modelNamespace, data);
        }
        adapter.loadData().then(function (localStorageData) {
          localStorageData[modelNamespace] = data;
          var toBePersisted = localStorageData;

          kango.invokeAsyncCallback('localforage.setItem', adapter.adapterNamespace(), toBePersisted, function () {
            resolve();
          });
        });
      });
    },

    _namespaceForType: function _namespaceForType(type) {
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
        promise = new _ember['default'].RSVP.resolve(cache);
      } else {
        promise = new _ember['default'].RSVP.Promise(function (resolve, reject) {
          kango.invokeAsyncCallback('localforage.getItem', adapter.adapterNamespace(), function (storage) {
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
    }
  });
});
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
define('rose/adapters/comment', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Comments',
    modelNamespace: 'Comment'
  });
});
define('rose/adapters/extract', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Extracts',
    modelNamespace: 'Extract'
  });
});
define('rose/adapters/extractor', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Extractors',
    modelNamespace: 'Extractor'
  });
});
define('rose/adapters/interaction', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Interactions',
    modelNamespace: 'Interaction'
  });
});
define('rose/adapters/kango-adapter', ['exports', 'ember', 'ember-data', 'npm:lodash/compact', 'npm:lodash/concat', 'npm:lodash/filter', 'npm:lodash/map', 'npm:lodash/without', 'npm:uuid', 'npm:promise-queue'], function (exports, _ember, _emberData, _npmLodashCompact, _npmLodashConcat, _npmLodashFilter, _npmLodashMap, _npmLodashWithout, _npmUuid, _npmPromiseQueue) {

    function getItem(key) {
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
            kango.invokeAsyncCallback('localforage.getItem', key, function (data) {
                resolve(data);
            });
        });
    }

    function setItem(key, value) {
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
            kango.invokeAsyncCallback('localforage.setItem', key, value, function (data) {
                resolve();
            });
        });
    }

    function removeItem(key) {
        return new _ember['default'].RSVP.Promise(function (resolve, reject) {
            kango.invokeAsyncCallback('localforage.removeItem', key, function () {
                resolve();
            });
        });
    }

    exports['default'] = _emberData['default'].Adapter.extend({
        queue: new _npmPromiseQueue['default'](1, Infinity),

        shouldReloadAll: function shouldReloadAll() {
            return true;
        },

        generateIdForRecord: function generateIdForRecord(store, type, inputProperties) {
            return _npmUuid['default'].v4();
        },

        findRecord: function findRecord(store, type, id, snapshot) {
            var modelName = this.modelNamespace;
            var key = [modelName, id].join('/');

            return getItem(key).then(function (record) {
                return !record ? _ember['default'].RSVP.reject() : record;
            });
        },

        createRecord: function createRecord(store, type, snapshot) {
            var modelName = this.modelNamespace;
            var collectionName = this.collectionNamespace;
            var id = snapshot.id;
            var key = [modelName, id].join('/');
            var data = this.serialize(snapshot, { includeId: true });

            return this.queue.add(function () {
                return setItem(key, data).then(function () {
                    return getItem(collectionName);
                }).then(function (collection) {
                    return (0, _npmLodashCompact['default'])((0, _npmLodashConcat['default'])(collection, key));
                }).then(function (collection) {
                    return setItem(collectionName, collection);
                });
            });
        },

        updateRecord: function updateRecord(store, type, snapshot) {
            var modelName = this.modelNamespace;
            var id = snapshot.id;
            var key = [modelName, id].join('/');
            var data = this.serialize(snapshot, { includeId: true });

            return this.queue.add(function () {
                return setItem(key, data);
            });
        },

        deleteRecord: function deleteRecord(store, type, snapshot) {
            var modelName = this.modelNamespace;
            var collectionName = this.collectionNamespace;
            var id = snapshot.id;
            var key = [modelName, id].join('/');

            return this.queue.add(function () {
                return removeItem(key).then(function () {
                    return getItem(collectionName);
                }).then(function (collection) {
                    return (0, _npmLodashWithout['default'])(collection, key);
                }).then(function (collection) {
                    return setItem(collectionName, collection);
                });
            });
        },

        findAll: function findAll(store, type, sinceToken, snapshotRecordArray) {
            var collectionName = this.collectionNamespace;

            return getItem(collectionName).then(function (collection) {
                return (0, _npmLodashMap['default'])(collection, function (item) {
                    return getItem(item);
                });
            }).then(function (queries) {
                return _ember['default'].RSVP.all(queries);
            });
        },

        query: function query(store, type, _query, recordArray) {
            var collectionName = this.collectionNamespace;

            return getItem(collectionName).then(function (collection) {
                return (0, _npmLodashMap['default'])(collection, function (item) {
                    return getItem(item);
                });
            }).then(function (queries) {
                return _ember['default'].RSVP.all(queries);
            }).then(function (records) {
                return (0, _npmLodashFilter['default'])(records, _query);
            });
        }
    });
});
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
define('rose/adapters/network', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Networks',
    modelNamespace: 'Network'
  });
});
define('rose/adapters/observer', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'Observers',
    modelNamespace: 'Observer'
  });
});
define('rose/adapters/system-config', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'systemConfigs',
    modelNamespace: 'systemConfig'
  });
});
define('rose/adapters/user-setting', ['exports', 'rose/adapters/kango-adapter'], function (exports, _roseAdaptersKangoAdapter) {
  exports['default'] = _roseAdaptersKangoAdapter['default'].extend({
    collectionNamespace: 'userSettings',
    modelNamespace: 'userSetting'
  });
});
define('rose/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'rose/config/environment'], function (exports, _ember, _emberResolver, _emberLoadInitializers, _roseConfigEnvironment) {

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _roseConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _roseConfigEnvironment['default'].podModulePrefix,
    Resolver: _emberResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _roseConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('rose/components/file-picker', ['exports', 'ember-cli-file-picker/components/file-picker'], function (exports, _emberCliFilePickerComponentsFilePicker) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberCliFilePickerComponentsFilePicker['default'];
    }
  });
});
define("rose/components/lf-outlet", ["exports", "liquid-fire/ember-internals"], function (exports, _liquidFireEmberInternals) {
  exports["default"] = _liquidFireEmberInternals.StaticOutlet;
});
define('rose/components/lf-overlay', ['exports', 'ember'], function (exports, _ember) {
  var COUNTER = '__lf-modal-open-counter';

  exports['default'] = _ember['default'].Component.extend({
    tagName: 'span',
    classNames: ['lf-overlay'],

    didInsertElement: function didInsertElement() {
      var body = _ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.addClass('lf-modal-open');
      body.data(COUNTER, counter + 1);
    },

    willDestroy: function willDestroy() {
      var body = _ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.data(COUNTER, counter - 1);
      if (counter < 2) {
        body.removeClass('lf-modal-open lf-modal-closing');
      }
    }
  });
});
define('rose/components/liquid-bind', ['exports', 'ember'], function (exports, _ember) {

  var LiquidBind = _ember['default'].Component.extend({
    tagName: '',
    positionalParams: ['value'] // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
  });

  LiquidBind.reopenClass({
    positionalParams: ['value']
  });

  exports['default'] = LiquidBind;
});
define('rose/components/liquid-child', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    classNames: ['liquid-child'],

    didInsertElement: function didInsertElement() {
      var $container = this.$();
      if ($container) {
        $container.css('visibility', 'hidden');
      }
      this.sendAction('liquidChildDidRender', this);
    }

  });
});
define("rose/components/liquid-container", ["exports", "ember", "liquid-fire/growable", "rose/components/liquid-measured"], function (exports, _ember, _liquidFireGrowable, _roseComponentsLiquidMeasured) {
  exports["default"] = _ember["default"].Component.extend(_liquidFireGrowable["default"], {
    classNames: ['liquid-container'],

    lockSize: function lockSize(elt, want) {
      elt.outerWidth(want.width);
      elt.outerHeight(want.height);
    },

    unlockSize: function unlockSize() {
      var _this = this;

      var doUnlock = function doUnlock() {
        _this.updateAnimatingClass(false);
        var elt = _this.$();
        if (elt) {
          elt.css({ width: '', height: '' });
        }
      };
      if (this._scaling) {
        this._scaling.then(doUnlock);
      } else {
        doUnlock();
      }
    },

    // We're doing this manually instead of via classNameBindings
    // because it depends on upward-data-flow, which generates warnings
    // under Glimmer.
    updateAnimatingClass: function updateAnimatingClass(on) {
      if (this.isDestroyed || !this._wasInserted) {
        return;
      }
      if (arguments.length === 0) {
        on = this.get('liquidAnimating');
      } else {
        this.set('liquidAnimating', on);
      }
      if (on) {
        this.$().addClass('liquid-animating');
      } else {
        this.$().removeClass('liquid-animating');
      }
    },

    startMonitoringSize: _ember["default"].on('didInsertElement', function () {
      this._wasInserted = true;
      this.updateAnimatingClass();
    }),

    actions: {

      willTransition: function willTransition(versions) {
        if (!this._wasInserted) {
          return;
        }

        // Remember our own size before anything changes
        var elt = this.$();
        this._cachedSize = (0, _roseComponentsLiquidMeasured.measure)(elt);

        // And make any children absolutely positioned with fixed sizes.
        for (var i = 0; i < versions.length; i++) {
          goAbsolute(versions[i]);
        }

        // Apply '.liquid-animating' to liquid-container allowing
        // any customizable CSS control while an animating is occuring
        this.updateAnimatingClass(true);
      },

      afterChildInsertion: function afterChildInsertion(versions) {
        var elt = this.$();
        var enableGrowth = this.get('enableGrowth') !== false;

        // Measure  children
        var sizes = [];
        for (var i = 0; i < versions.length; i++) {
          if (versions[i].view) {
            sizes[i] = (0, _roseComponentsLiquidMeasured.measure)(versions[i].view.$());
          }
        }

        // Measure ourself again to see how big the new children make
        // us.
        var want = (0, _roseComponentsLiquidMeasured.measure)(elt);
        var have = this._cachedSize || want;

        // Make ourself absolute
        if (enableGrowth) {
          this.lockSize(elt, have);
        } else {
          this.lockSize(elt, {
            height: Math.max(want.height, have.height),
            width: Math.max(want.width, have.width)
          });
        }

        // Make the children absolute and fixed size.
        for (i = 0; i < versions.length; i++) {
          goAbsolute(versions[i], sizes[i]);
        }

        // Kick off our growth animation
        if (enableGrowth) {
          this._scaling = this.animateGrowth(elt, have, want);
        }
      },

      afterTransition: function afterTransition(versions) {
        for (var i = 0; i < versions.length; i++) {
          goStatic(versions[i]);
        }
        this.unlockSize();
      }
    }
  });

  function goAbsolute(version, size) {
    if (!version.view) {
      return;
    }
    var elt = version.view.$();
    var pos = elt.position();
    if (!size) {
      size = (0, _roseComponentsLiquidMeasured.measure)(elt);
    }
    elt.outerWidth(size.width);
    elt.outerHeight(size.height);
    elt.css({
      position: 'absolute',
      top: pos.top,
      left: pos.left
    });
  }

  function goStatic(version) {
    if (version.view && !version.view.isDestroyed) {
      version.view.$().css({ width: '', height: '', position: '' });
    }
  }
});
define('rose/components/liquid-if', ['exports', 'ember', 'liquid-fire/ember-internals'], function (exports, _ember, _liquidFireEmberInternals) {

  var LiquidIf = _ember['default'].Component.extend({
    positionalParams: ['predicate'], // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
    tagName: '',
    helperName: 'liquid-if',
    didReceiveAttrs: function didReceiveAttrs() {
      this._super();
      var predicate = (0, _liquidFireEmberInternals.shouldDisplay)(this.getAttr('predicate'));
      this.set('showFirstBlock', this.inverted ? !predicate : predicate);
    }
  });

  LiquidIf.reopenClass({
    positionalParams: ['predicate']
  });

  exports['default'] = LiquidIf;
});
define("rose/components/liquid-measured", ["exports", "liquid-fire/components/liquid-measured"], function (exports, _liquidFireComponentsLiquidMeasured) {
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function get() {
      return _liquidFireComponentsLiquidMeasured["default"];
    }
  });
  Object.defineProperty(exports, "measure", {
    enumerable: true,
    get: function get() {
      return _liquidFireComponentsLiquidMeasured.measure;
    }
  });
});
define('rose/components/liquid-modal', ['exports', 'ember', 'ember-getowner-polyfill'], function (exports, _ember, _emberGetownerPolyfill) {
  exports['default'] = _ember['default'].Component.extend({
    classNames: ['liquid-modal'],
    currentContext: _ember['default'].computed('owner.modalContexts.lastObject', function () {
      var context = this.get('owner.modalContexts.lastObject');
      if (context) {
        context.view = this.innerView(context);
      }
      return context;
    }),

    owner: _ember['default'].inject.service('liquid-fire-modals'),

    innerView: function innerView(current) {
      var self = this,
          name = current.get('name'),
          owner = (0, _emberGetownerPolyfill['default'])(this),
          component = owner.lookup('component-lookup:main').lookupFactory(name);
      _ember['default'].assert("Tried to render a modal using component '" + name + "', but couldn't find it.", !!component);

      var args = _ember['default'].copy(current.get('params'));

      args.registerMyself = _ember['default'].on('init', function () {
        self.set('innerViewInstance', this);
      });

      // set source so we can bind other params to it
      args._source = _ember['default'].computed(function () {
        return current.get("source");
      });

      var otherParams = current.get("options.otherParams");
      var from, to;
      for (from in otherParams) {
        to = otherParams[from];
        args[to] = _ember['default'].computed.alias("_source." + from);
      }

      var actions = current.get("options.actions") || {};

      // Override sendAction in the modal component so we can intercept and
      // dynamically dispatch to the controller as expected
      args.sendAction = function (name) {
        var actionName = actions[name];
        if (!actionName) {
          this._super.apply(this, Array.prototype.slice.call(arguments));
          return;
        }

        var controller = current.get("source");
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(actionName);
        controller.send.apply(controller, args);
      };

      return component.extend(args);
    },

    actions: {
      outsideClick: function outsideClick() {
        if (this.get('currentContext.options.dismissWithOutsideClick')) {
          this.send('dismiss');
        } else {
          proxyToInnerInstance(this, 'outsideClick');
        }
      },
      escape: function escape() {
        if (this.get('currentContext.options.dismissWithEscape')) {
          this.send('dismiss');
        } else {
          proxyToInnerInstance(this, 'escape');
        }
      },
      dismiss: function dismiss() {
        _ember['default'].$('body').addClass('lf-modal-closing');
        var source = this.get('currentContext.source'),
            proto = source.constructor.proto(),
            params = this.get('currentContext.options.withParams'),
            clearThem = {};

        for (var key in params) {
          if (proto[key] instanceof _ember['default'].ComputedProperty) {
            clearThem[key] = undefined;
          } else {
            clearThem[key] = proto[key];
          }
        }
        source.setProperties(clearThem);
      }
    }
  });

  function proxyToInnerInstance(self, message) {
    var vi = self.get('innerViewInstance');
    if (vi) {
      vi.send(message);
    }
  }
});
define('rose/components/liquid-outlet', ['exports', 'ember'], function (exports, _ember) {

  var LiquidOutlet = _ember['default'].Component.extend({
    positionalParams: ['inputOutletName'], // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
    tagName: '',
    didReceiveAttrs: function didReceiveAttrs() {
      this._super();
      this.set('outletName', this.attrs.inputOutletName || 'main');
    }
  });

  LiquidOutlet.reopenClass({
    positionalParams: ['inputOutletName']
  });

  exports['default'] = LiquidOutlet;
});
define("rose/components/liquid-spacer", ["exports", "liquid-fire/components/liquid-spacer"], function (exports, _liquidFireComponentsLiquidSpacer) {
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function get() {
      return _liquidFireComponentsLiquidSpacer["default"];
    }
  });
});
define('rose/components/liquid-unless', ['exports', 'rose/components/liquid-if'], function (exports, _roseComponentsLiquidIf) {
  exports['default'] = _roseComponentsLiquidIf['default'].extend({
    helperName: 'liquid-unless',
    layoutName: 'components/liquid-if',
    inverted: true
  });
});
define("rose/components/liquid-versions", ["exports", "ember", "liquid-fire/ember-internals"], function (exports, _ember, _liquidFireEmberInternals) {

  var get = _ember["default"].get;
  var set = _ember["default"].set;

  exports["default"] = _ember["default"].Component.extend({
    tagName: "",
    name: 'liquid-versions',

    transitionMap: _ember["default"].inject.service('liquid-fire-transitions'),

    didReceiveAttrs: function didReceiveAttrs() {
      this._super();
      if (!this.versions || this._lastVersion !== this.getAttr('value')) {
        this.appendVersion();
        this._lastVersion = this.getAttr('value');
      }
    },

    appendVersion: function appendVersion() {
      var versions = this.versions;
      var firstTime = false;
      var newValue = this.getAttr('value');
      var oldValue;

      if (!versions) {
        firstTime = true;
        versions = _ember["default"].A();
      } else {
        oldValue = versions[0];
      }

      // TODO: may need to extend the comparison to do the same kind of
      // key-based diffing that htmlbars is doing.
      if (!firstTime && (!oldValue && !newValue || oldValue === newValue)) {
        return;
      }

      this.notifyContainer('willTransition', versions);
      var newVersion = {
        value: newValue,
        shouldRender: newValue || get(this, 'renderWhenFalse')
      };
      versions.unshiftObject(newVersion);

      this.firstTime = firstTime;
      if (firstTime) {
        set(this, 'versions', versions);
      }

      if (!newVersion.shouldRender && !firstTime) {
        this._transition();
      }
    },

    _transition: function _transition() {
      var _this = this;

      var versions = get(this, 'versions');
      var transition;
      var firstTime = this.firstTime;
      this.firstTime = false;

      this.notifyContainer('afterChildInsertion', versions);

      transition = get(this, 'transitionMap').transitionFor({
        versions: versions,
        parentElement: _ember["default"].$((0, _liquidFireEmberInternals.containingElement)(this)),
        use: get(this, 'use'),
        // Using strings instead of booleans here is an
        // optimization. The constraint system can match them more
        // efficiently, since it treats boolean constraints as generic
        // "match anything truthy/falsy" predicates, whereas string
        // checks are a direct object property lookup.
        firstTime: firstTime ? 'yes' : 'no',
        helperName: get(this, 'name'),
        outletName: get(this, 'outletName')
      });

      if (this._runningTransition) {
        this._runningTransition.interrupt();
      }
      this._runningTransition = transition;

      transition.run().then(function (wasInterrupted) {
        // if we were interrupted, we don't handle the cleanup because
        // another transition has already taken over.
        if (!wasInterrupted) {
          _this.finalizeVersions(versions);
          _this.notifyContainer("afterTransition", versions);
        }
      }, function (err) {
        _this.finalizeVersions(versions);
        _this.notifyContainer("afterTransition", versions);
        throw err;
      });
    },

    finalizeVersions: function finalizeVersions(versions) {
      versions.replace(1, versions.length - 1);
    },

    notifyContainer: function notifyContainer(method, versions) {
      var target = get(this, 'notify');
      if (target) {
        target.send(method, versions);
      }
    },

    actions: {
      childDidRender: function childDidRender(child) {
        var version = get(child, 'version');
        set(version, 'view', child);
        this._transition();
      }
    }

  });
});
define('rose/components/liquid-with', ['exports', 'ember'], function (exports, _ember) {

  var LiquidWith = _ember['default'].Component.extend({
    name: 'liquid-with',
    positionalParams: ['value'], // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
    tagName: '',
    iAmDeprecated: _ember['default'].on('init', function () {
      _ember['default'].deprecate("liquid-with is deprecated, use liquid-bind instead -- it accepts a block now.");
    })
  });

  LiquidWith.reopenClass({
    positionalParams: ['value']
  });

  exports['default'] = LiquidWith;
});
define("rose/components/lm-container", ["exports", "ember", "liquid-fire/tabbable", "liquid-fire/is-browser"], function (exports, _ember, _liquidFireTabbable, _liquidFireIsBrowser) {

  /**
   * If you do something to move focus outside of the browser (like
   * command+l to go to the address bar) and then tab back into the
   * window, capture it and focus the first tabbable element in an active
   * modal.
   */
  var lastOpenedModal = null;

  if ((0, _liquidFireIsBrowser["default"])()) {
    _ember["default"].$(document).on('focusin', handleTabIntoBrowser);
  }

  function handleTabIntoBrowser() {
    if (lastOpenedModal) {
      lastOpenedModal.focus();
    }
  }

  exports["default"] = _ember["default"].Component.extend({
    classNames: ['lm-container'],
    attributeBindings: ['tabindex'],
    tabindex: 0,

    keyUp: function keyUp(event) {
      // Escape key
      if (event.keyCode === 27) {
        this.sendAction();
      }
    },

    keyDown: function keyDown(event) {
      // Tab key
      if (event.keyCode === 9) {
        this.constrainTabNavigation(event);
      }
    },

    didInsertElement: function didInsertElement() {
      this.focus();
      lastOpenedModal = this;
    },

    willDestroy: function willDestroy() {
      lastOpenedModal = null;
    },

    focus: function focus() {
      if (this.get('element').contains(document.activeElement)) {
        // just let it be if we already contain the activeElement
        return;
      }
      var target = this.$('[autofocus]');
      if (!target.length) {
        target = this.$(':tabbable');
      }

      if (!target.length) {
        target = this.$();
      }

      target[0].focus();
    },

    constrainTabNavigation: function constrainTabNavigation(event) {
      var tabbable = this.$(':tabbable');
      var finalTabbable = tabbable[event.shiftKey ? 'first' : 'last']()[0];
      var leavingFinalTabbable = finalTabbable === document.activeElement ||
      // handle immediate shift+tab after opening with mouse
      this.get('element') === document.activeElement;
      if (!leavingFinalTabbable) {
        return;
      }
      event.preventDefault();
      tabbable[event.shiftKey ? 'last' : 'first']()[0].focus();
    },

    click: function click(event) {
      if (event.target === this.get('element')) {
        this.sendAction('clickAway');
      }
    }
  });
});
/*
   Parts of this file were adapted from ic-modal

   https://github.com/instructure/ic-modal
   Released under The MIT License (MIT)
   Copyright (c) 2014 Instructure, Inc.
*/
define('rose/components/page-numbers', ['exports', 'ember', 'ember-cli-pagination/util', 'ember-cli-pagination/lib/page-items', 'ember-cli-pagination/validate'], function (exports, _ember, _emberCliPaginationUtil, _emberCliPaginationLibPageItems, _emberCliPaginationValidate) {
  exports['default'] = _ember['default'].Component.extend({
    currentPageBinding: "content.page",
    totalPagesBinding: "content.totalPages",

    hasPages: _ember['default'].computed.gt('totalPages', 1),

    watchInvalidPage: (function () {
      var me = this;
      var c = this.get('content');
      if (c && c.on) {
        c.on('invalidPage', function (e) {
          me.sendAction('invalidPageAction', e);
        });
      }
    }).observes("content"),

    truncatePages: true,
    numPagesToShow: 10,

    validate: function validate() {
      if (_emberCliPaginationUtil['default'].isBlank(this.get('currentPage'))) {
        _emberCliPaginationValidate['default'].internalError("no currentPage for page-numbers");
      }
      if (_emberCliPaginationUtil['default'].isBlank(this.get('totalPages'))) {
        _emberCliPaginationValidate['default'].internalError('no totalPages for page-numbers');
      }
    },

    pageItemsObj: (function () {
      return _emberCliPaginationLibPageItems['default'].create({
        parent: this,
        currentPageBinding: "parent.currentPage",
        totalPagesBinding: "parent.totalPages",
        truncatePagesBinding: "parent.truncatePages",
        numPagesToShowBinding: "parent.numPagesToShow",
        showFLBinding: "parent.showFL"
      });
    }).property(),

    //pageItemsBinding: "pageItemsObj.pageItems",

    pageItems: (function () {
      this.validate();
      return this.get("pageItemsObj.pageItems");
    }).property("pageItemsObj.pageItems", "pageItemsObj"),

    canStepForward: (function () {
      var page = Number(this.get("currentPage"));
      var totalPages = Number(this.get("totalPages"));
      return page < totalPages;
    }).property("currentPage", "totalPages"),

    canStepBackward: (function () {
      var page = Number(this.get("currentPage"));
      return page > 1;
    }).property("currentPage"),

    actions: {
      pageClicked: function pageClicked(number) {
        _emberCliPaginationUtil['default'].log("PageNumbers#pageClicked number " + number);
        this.set("currentPage", number);
        this.sendAction('action', number);
      },
      incrementPage: function incrementPage(num) {
        var currentPage = Number(this.get("currentPage")),
            totalPages = Number(this.get("totalPages"));

        if (currentPage === totalPages && num === 1) {
          return false;
        }
        if (currentPage <= 1 && num === -1) {
          return false;
        }
        this.incrementProperty('currentPage', num);

        var newPage = this.get('currentPage');
        this.sendAction('action', newPage);
      }
    }
  });
});
define('rose/components/ui-accordion', ['exports', 'semantic-ui-ember/components/ui-accordion'], function (exports, _semanticUiEmberComponentsUiAccordion) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiAccordion['default'];
    }
  });
});
define('rose/components/ui-checkbox', ['exports', 'semantic-ui-ember/components/ui-checkbox'], function (exports, _semanticUiEmberComponentsUiCheckbox) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiCheckbox['default'];
    }
  });
});
define('rose/components/ui-dropdown-array', ['exports', 'semantic-ui-ember/components/ui-dropdown-array'], function (exports, _semanticUiEmberComponentsUiDropdownArray) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiDropdownArray['default'];
    }
  });
});
define('rose/components/ui-dropdown', ['exports', 'semantic-ui-ember/components/ui-dropdown'], function (exports, _semanticUiEmberComponentsUiDropdown) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiDropdown['default'];
    }
  });
});
define('rose/components/ui-embed', ['exports', 'semantic-ui-ember/components/ui-embed'], function (exports, _semanticUiEmberComponentsUiEmbed) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiEmbed['default'];
    }
  });
});
define('rose/components/ui-modal', ['exports', 'semantic-ui-ember/components/ui-modal'], function (exports, _semanticUiEmberComponentsUiModal) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiModal['default'];
    }
  });
});
define('rose/components/ui-nag', ['exports', 'semantic-ui-ember/components/ui-nag'], function (exports, _semanticUiEmberComponentsUiNag) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiNag['default'];
    }
  });
});
define('rose/components/ui-popup', ['exports', 'semantic-ui-ember/components/ui-popup'], function (exports, _semanticUiEmberComponentsUiPopup) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiPopup['default'];
    }
  });
});
define('rose/components/ui-progress', ['exports', 'semantic-ui-ember/components/ui-progress'], function (exports, _semanticUiEmberComponentsUiProgress) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiProgress['default'];
    }
  });
});
define('rose/components/ui-radio', ['exports', 'semantic-ui-ember/components/ui-radio'], function (exports, _semanticUiEmberComponentsUiRadio) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiRadio['default'];
    }
  });
});
define('rose/components/ui-rating', ['exports', 'semantic-ui-ember/components/ui-rating'], function (exports, _semanticUiEmberComponentsUiRating) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiRating['default'];
    }
  });
});
define('rose/components/ui-search', ['exports', 'semantic-ui-ember/components/ui-search'], function (exports, _semanticUiEmberComponentsUiSearch) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiSearch['default'];
    }
  });
});
define('rose/components/ui-shape', ['exports', 'semantic-ui-ember/components/ui-shape'], function (exports, _semanticUiEmberComponentsUiShape) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiShape['default'];
    }
  });
});
define('rose/components/ui-sidebar', ['exports', 'semantic-ui-ember/components/ui-sidebar'], function (exports, _semanticUiEmberComponentsUiSidebar) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiSidebar['default'];
    }
  });
});
define('rose/components/ui-sticky', ['exports', 'semantic-ui-ember/components/ui-sticky'], function (exports, _semanticUiEmberComponentsUiSticky) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _semanticUiEmberComponentsUiSticky['default'];
    }
  });
});
define('rose/controllers/application', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    isLoading: false,

    actions: {
      cancelWizard: function cancelWizard() {
        var settings = this.get('settings.user');
        settings.set('firstRun', false);
        settings.save().then(function () {
          return location.reload();
        });
      },

      saveConfig: function saveConfig(data) {
        var _this = this;

        var payload = data;
        payload.id = 1;

        this.settings.system.destroyRecord().then(function () {
          kango.dispatchMessage('LoadNetworks', payload.networks);
          delete payload.networks;
        }).then(function () {
          return _this.store.createRecord('system-config', payload).save();
        }).then(function (settings) {
          return _this.set('settings.system', settings);
        }).then(function () {
          return _this.send('cancelWizard');
        });
      }
    }
  });
});
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
define('rose/controllers/array', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('rose/controllers/backup', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    jsonData: (function () {
      var result = {};

      var models = this.get('model');

      models.forEach(function (model) {
        result[model.type] = model.data;
      });

      result['export-date'] = Date.now();

      return JSON.stringify(result, null, 4);
    }).property('model'),

    actions: {
      openModal: function openModal(name) {
        _ember['default'].$('.ui.' + name + '.modal').modal('show');
      },

      download: function download() {
        window.saveAs(new Blob([this.get('jsonData')]), 'rose-data.txt');
      },

      approveModal: function approveModal() {
        var _this = this;

        ['comment', 'interaction', 'extract', 'diary-entry'].forEach(function (type) {
          return _this.store.findAll(type).then(function (records) {
            return records.invoke('destroyRecord');
          });
        });

        ['click', 'fb-login', 'mousemove', 'scroll', 'window'].forEach(function (type) {
          return kango.invokeAsyncCallback('localforage.removeItem', type + '-activity-records');
        });

        return true;
      }
    }
  });
});
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
define('rose/controllers/comments', ['exports', 'ember', 'ember-cli-pagination/computed/paged-array'], function (exports, _ember, _emberCliPaginationComputedPagedArray) {
  exports['default'] = _ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: _ember['default'].computed.sort('model', 'listSorting'),

    queryParams: ["page"],
    page: 1,
    perPage: 20,
    pagedContent: (0, _emberCliPaginationComputedPagedArray['default'])('sortedList', { pageBinding: "page", perPageBinding: "perPage" }),
    totalPagesBinding: "pagedContent.totalPages"
  });
});
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
define('rose/controllers/data-converter', ['exports', 'ember', 'npm:lodash/isArray', 'npm:papaparse', 'npm:flat'], function (exports, _ember, _npmLodashIsArray, _npmPapaparse, _npmFlat) {
    exports['default'] = _ember['default'].Controller.extend({
        tables: [],
        selectedTable: null,

        roseDataObject: null,

        actions: {
            updateSelected: function updateSelected(component, id) {
                this.set('selectedTable', id);

                this.send('converToCSV');
            },

            fileLoaded: function fileLoaded(file) {
                var tables = [];
                var text = file.data;
                var json = JSON.parse(text);

                this.set('roseDataObject', json);

                for (var key in json) {
                    var value = json[key];
                    if ((0, _npmLodashIsArray['default'])(value)) {
                        tables.pushObject(key);
                    }
                }

                this.set('tables', tables);
            },

            converToCSV: function converToCSV() {
                var roseData = this.get('roseDataObject');
                var selectedTable = this.get('selectedTable');
                var data = roseData[selectedTable];

                var csv = _npmPapaparse['default'].unparse(data.map(function (record) {
                    return (0, _npmFlat['default'])(record);
                }));

                this.set('csvtext', csv);
            },

            download: function download() {
                window.saveAs(new Blob([this.get('csvtext')]), this.get('selectedTable') + '.csv');
            }
        }
    });
});
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
define('rose/controllers/debug-log', ['exports', 'ember', 'ember-cli-pagination/computed/paged-array'], function (exports, _ember, _emberCliPaginationComputedPagedArray) {
  exports['default'] = _ember['default'].Controller.extend({
    model: [],
    queryParams: ['page'],
    modelSorting: ['date:desc'],
    log: _ember['default'].computed.sort('model', 'modelSorting'),
    page: 1,
    perPage: 20,
    pagedContent: (0, _emberCliPaginationComputedPagedArray['default'])('log', { pageBinding: 'page', perPageBinding: 'perPage' }),
    totalPagesBinding: 'pagedContent.totalPages'
  });
});
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
define('rose/controllers/diary', ['exports', 'ember', 'ember-cli-pagination/computed/paged-array'], function (exports, _ember, _emberCliPaginationComputedPagedArray) {
  exports['default'] = _ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: _ember['default'].computed.sort('model', 'listSorting'),

    queryParams: ["page"],
    page: 1,
    perPage: 20,
    pagedContent: (0, _emberCliPaginationComputedPagedArray['default'])('sortedList', { pageBinding: "page", perPageBinding: "perPage" }),
    totalPagesBinding: "pagedContent.totalPages",

    diaryInputIsEmpty: _ember['default'].computed.empty('diaryInput'),

    actions: {
      save: function save() {
        var entry = {
          text: this.get('diaryInput')
        };
        this.store.createRecord('diary-entry', entry).save();
        this.set('diaryInput', null);
      },
      cancel: function cancel() {
        this.set('diaryInput', null);
      }
    }
  });
});
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
define('rose/controllers/extracts', ['exports', 'ember', 'ember-cli-pagination/computed/paged-array'], function (exports, _ember, _emberCliPaginationComputedPagedArray) {
  exports['default'] = _ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: _ember['default'].computed.sort('model', 'listSorting'),

    queryParams: ["page"],
    page: 1,
    perPage: 20,
    pagedContent: (0, _emberCliPaginationComputedPagedArray['default'])('sortedList', { pageBinding: "page", perPageBinding: "perPage" }),
    totalPagesBinding: "pagedContent.totalPages"
  });
});
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
define('rose/controllers/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller.extend({
    settings: _ember['default'].inject.service('settings'),
    trackingEnabledLabel: (function () {
      var trackingEnabled = this.get('settings.user.trackingEnabled');
      return this.get('i18n').t('index.tracking' + (trackingEnabled ? 'Enabled' : 'Disabled')).toString();
    }).property('settings.user.trackingEnabled'),
    actions: {
      toggleTracking: function toggleTracking() {
        this.get('settings.user').save().then(function () {
          return kango.dispatchMessage('toggle-tracking');
        });
      }
    }
  });
});
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
define('rose/controllers/interactions', ['exports', 'ember', 'ember-cli-pagination/computed/paged-array'], function (exports, _ember, _emberCliPaginationComputedPagedArray) {
  exports['default'] = _ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: _ember['default'].computed.sort('model', 'listSorting'),

    queryParams: ["page"],
    page: 1,
    perPage: 20,
    pagedContent: (0, _emberCliPaginationComputedPagedArray['default'])('sortedList', { pageBinding: "page", perPageBinding: "perPage" }),
    totalPagesBinding: "pagedContent.totalPages"
  });
});
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
define('rose/controllers/object', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('rose/controllers/observer', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Controller.extend({
        actions: {
            save: function save() {
                return this.get('model').save();
            },

            discard: function discard() {
                var observer = this.get('model');
                observer.rollbackAttributes();
            },

            addPattern: function addPattern() {
                var patterns = this.get('model.patterns');
                patterns.createFragment('pattern');
            },

            removePattern: function removePattern(pattern) {
                var patterns = this.get('model.patterns');
                patterns.removeObject(pattern);
            }
        }
    });
});
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
define('rose/controllers/observers', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Controller.extend({
        listSorting: ['name'],
        sortedList: _ember['default'].computed.sort('model', 'listSorting'),

        actions: {
            exportObservers: function exportObservers() {
                var observerList = this.get('sortedList').invoke('toJSON');
                var observerListString = JSON.stringify(observerList, null, 4);

                window.saveAs(new Blob([observerListString]), 'observer-list.json');
            }
        }
    });
});
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
define('rose/controllers/settings', ['exports', 'ember', 'rose/locales/languages'], function (exports, _ember, _roseLocalesLanguages) {
  exports['default'] = _ember['default'].Controller.extend({
    navigator: _ember['default'].inject.service(),
    updateSigned: (function () {
      return this.get('settings.system.lastUpdated') === null || this.get('settings.system.forceSecureUpdate');
    }).property('settings.system.lastUpdated'),
    updateInProgress: false,
    updateResult: '',
    updateResulti18n: (function () {
      return 'settings.' + this.get('updateResult');
    }).property('updateResult'),
    availableLanguages: _roseLocalesLanguages['default'],
    updateIntervals: [{ label: 'hourly', value: 3600000 }, { label: 'daily', value: 86400000 }, { label: 'weekly', value: 604800000 }, { label: 'monthly', value: 2629743830 }],

    actions: {

      saveSettings: function saveSettings() {
        this.get('settings.user').save();
        this.get('settings.system').save();
      },

      changeI18nLanguage: function changeI18nLanguage() {
        this.set('i18n.locale', this.get('settings.user.currentLanguage'));
        this.send('saveSettings');
      },

      manualUpdate: function manualUpdate() {
        var _this = this;

        this.set('updateInProgress', true);

        _ember['default'].$('.manualUpdate .message:not(.hidden)').transition('slide down');

        var showResult = function showResult(status) {
          _this.set('updateInProgress', false);
          _this.set('updateResult', status);

          _this.get('settings.system').reload().then(function () {
            kango.removeMessageListener('update-successful', successfulUpdate);
            kango.removeMessageListener('update-unsuccessful', unsuccessfulUpdate);
            _ember['default'].$('.manualUpdate .message').transition('slide down');
          });
        };
        var successfulUpdate = function successfulUpdate(evt) {
          var status = evt.data;
          if (status === 'uptodate') {
            status = _this.get('i18n').t('settings.uptodate').toString();
          }
          _this.set('updateMessage', status);
          showResult('success');
        };
        kango.addMessageListener('update-successful', successfulUpdate);

        var unsuccessfulUpdate = function unsuccessfulUpdate(evt) {
          var err = evt.data;
          console.log(err);
          _this.set('updateMessage', err.message);
          showResult('error');
        };
        kango.addMessageListener('update-unsuccessful', unsuccessfulUpdate);

        kango.dispatchMessage('update-start');
      },

      closeMessage: function closeMessage() {
        _ember['default'].$('.manualUpdate .message').transition('slide down');
      },

      changeAutoUpdate: function changeAutoUpdate() {
        this.get('settings.system').save().then(function () {
          return kango.dispatchMessage('reschedule-auto-update');
        });
      },

      openModal: function openModal(name) {
        _ember['default'].$('.ui.' + name + '.modal').modal('show');
      },

      approveModal: function approveModal() {
        var _this2 = this;

        kango.dispatchMessage('reset-configuration');
        _ember['default'].RSVP.all([this.store.findAll('extractor').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.store.findAll('network').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.store.findAll('observer').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.get('settings.user').destroyRecord(), this.get('settings.system').destroyRecord()]).then(function () {
          return _this2.get('settings').setup();
        }).then(function () {
          return _this2.transitionToRoute('index');
        })['catch'](function (err) {
          return console.error(err);
        });
      }
    }
  });
});
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
define('rose/controllers/study-creator', ['exports', 'ember', 'npm:normalize-url', 'npm:kbpgp'], function (exports, _ember, _npmNormalizeUrl, _npmKbpgp) {
  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  function removeFileName(str) {
    return (0, _npmNormalizeUrl['default'])(str.substring(0, str.lastIndexOf('/')));
  }

  function getPatternRessource(url) {
    return _ember['default'].$.getJSON(url).then(function (list) {
      return list.map(function (item) {
        return _ember['default'].Object.create(item);
      });
    });
  }

  function randomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    while (text.length < length) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  exports['default'] = _ember['default'].Controller.extend({
    baseFileIsLoading: false,
    baseFileNotFound: false,
    networks: [],
    keyAvailable: true,

    exportDisabled: (function () {
      return !this.get('networks').some(function (network) {
        return network.isEnabled;
      });
    }).property('networks.@each.isEnabled'),

    facebookDisabled: (function () {
      return !this.get('networks').some(function (network) {
        return network.name === 'facebook' && network.isEnabled;
      });
    }).property('networks.@each.isEnabled'),

    secureUpdateImpossible: (function () {
      if (!this.get('keyAvailable') || !this.get('model.autoUpdateIsEnabled')) {
        this.set('model.forceSecureUpdate', false);
        return true;
      }
      return false;
    }).property('model.autoUpdateIsEnabled', 'keyAvailable'),

    updateIntervals: [{ label: 'hourly', value: 3600000 }, { label: 'daily', value: 86400000 }, { label: 'weekly', value: 604800000 }, { label: 'monthly', value: 2629743830 }],

    actions: {
      saveSettings: function saveSettings() {
        this.set('model.repositoryURL', (0, _npmNormalizeUrl['default'])(this.get('model.repositoryURL')));
        this.get('model').save();
      },

      download: function download() {
        var networks = this.get('networks').filterBy('isEnabled', true).map(function (network) {
          network = JSON.parse(JSON.stringify(network));
          delete network.isEnabled;
          if (network.extractors) {
            network.extractors = network.extractors.filter(function (extractor) {
              return extractor.isEnabled || extractor.type !== 'url';
            }).map(function (extractor) {
              delete extractor.isEnabled;
              return extractor;
            });
          }
          if (network.observers) {
            network.observers = network.observers.filter(function (observer) {
              return observer.isEnabled;
            }).map(function (observer) {
              delete observer.isEnabled;
              return observer;
            });
          }
          return network;
        });

        var model = this.get('model').toJSON();
        model.networks = networks;
        var jsondata = JSON.stringify(model, null, 4);
        var fileName = this.get('model.fileName');

        window.saveAs(new Blob([jsondata]), fileName);
      },

      fetchBaseFile: function fetchBaseFile() {
        var _this = this;

        // this.set('networks', [])
        this.setProperties({
          networks: [],
          baseFileNotFound: false
        });

        var baseFileUrl = this.get('model.repositoryURL');
        var repositoryURL = removeFileName(baseFileUrl);

        _ember['default'].$.getJSON(baseFileUrl).then(function (baseJSON) {
          if (baseJSON.networks) {
            var networks = baseJSON.networks;
            networks.forEach(function (network) {
              if (!network.observers && !network.extractors) {
                return;
              }
              var requests = [network.extractors ? getPatternRessource(repositoryURL + '/' + network.extractors) : [], network.observers ? getPatternRessource(repositoryURL + '/' + network.observers) : []];
              _ember['default'].RSVP.Promise.all(requests).then(function (results) {
                var _results = _slicedToArray(results, 2);

                network.extractors = _results[0];
                network.observers = _results[1];

                _this.get('networks').pushObject(_ember['default'].Object.create(network));
              });
            });

            _ember['default'].$.get(repositoryURL + '/public.key').then(function (key) {
              _npmKbpgp['default'].KeyManager.import_from_armored_pgp({ armored: key }, function (err, keymanager) {
                if (err) {
                  _this.set('keyAvailable', false);
                  return console.error(err);
                }
                _this.set('model.fingerprint', keymanager.get_pgp_fingerprint_str().toUpperCase());
                _this.set('keyAvailable', true);
              });
            }).fail(function () {
              return _this.set('keyAvailable', false);
            });
          }
        }).fail(function () {
          return _this.set('baseFileNotFound', true);
        });
      },

      enableAll: function enableAll(network) {
        network.observers.forEach(function (item) {
          return item.set('isEnabled', true);
        });
        network.extractors.forEach(function (item) {
          return item.set('isEnabled', true);
        });
      },

      disableAll: function disableAll(network) {
        network.observers.forEach(function (item) {
          return item.set('isEnabled', false);
        });
        network.extractors.forEach(function (item) {
          return item.set('isEnabled', false);
        });
      },

      generateSalt: function generateSalt() {
        this.set('model.salt', randomString(12));
      },

      toggleForceSecureUpdate: function toggleForceSecureUpdate() {
        // const state = this.get('model.forceSecureUpdate')
        this.get('model').save();
      }
    }
  });
});
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
define('rose/defaults/study-creator', ['exports'], function (exports) {
  exports['default'] = {
    roseCommentsIsEnabled: true,
    roseCommentsRatingIsEnabled: true,
    salt: 'ROSE',
    hashLength: 5,
    repositoryURL: 'https://secure-software-engineering.github.io/rose/master/base.json',
    fingerprint: '25E769C697EC2C20DA3BDDE9F188CF170FA234E8',
    autoUpdateIsEnabled: true,
    forceSecureUpdate: true,
    updateInterval: 86400000,
    fileName: 'rose-study-configuration.json'
  };
});
define('rose/helpers/boolean-to-yesno', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Helper.extend({
        i18n: _ember['default'].inject.service(),
        compute: function compute(params) {
            var i18n = this.get('i18n');
            return params[0] ? i18n.t('on') : i18n.t('off');
        }
    });
});
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
define('rose/helpers/moment-duration', ['exports', 'ember-moment/helpers/moment-duration'], function (exports, _emberMomentHelpersMomentDuration) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberMomentHelpersMomentDuration['default'];
    }
  });
});
define('rose/helpers/moment-format', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-format'], function (exports, _ember, _roseConfigEnvironment, _emberMomentHelpersMomentFormat) {
  exports['default'] = _emberMomentHelpersMomentFormat['default'].extend({
    globalOutputFormat: _ember['default'].get(_roseConfigEnvironment['default'], 'moment.outputFormat'),
    globalAllowEmpty: !!_ember['default'].get(_roseConfigEnvironment['default'], 'moment.allowEmpty')
  });
});
define('rose/helpers/moment-from-now', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-from-now'], function (exports, _ember, _roseConfigEnvironment, _emberMomentHelpersMomentFromNow) {
  exports['default'] = _emberMomentHelpersMomentFromNow['default'].extend({
    globalAllowEmpty: !!_ember['default'].get(_roseConfigEnvironment['default'], 'moment.allowEmpty')
  });
});
define('rose/helpers/moment-to-now', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-to-now'], function (exports, _ember, _roseConfigEnvironment, _emberMomentHelpersMomentToNow) {
  exports['default'] = _emberMomentHelpersMomentToNow['default'].extend({
    globalAllowEmpty: !!_ember['default'].get(_roseConfigEnvironment['default'], 'moment.allowEmpty')
  });
});
define('rose/helpers/t', ['exports', 'ember-i18n/helper'], function (exports, _emberI18nHelper) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nHelper['default'];
    }
  });
});
define("rose/initializers/ember-i18n", ["exports", "rose/instance-initializers/ember-i18n"], function (exports, _roseInstanceInitializersEmberI18n) {
  exports["default"] = {
    name: _roseInstanceInitializersEmberI18n["default"].name,

    initialize: function initialize() {
      var application = arguments[1] || arguments[0]; // depending on Ember version
      if (application.instanceInitializer) {
        return;
      }

      _roseInstanceInitializersEmberI18n["default"].initialize(application);
    }
  };
});
define('rose/initializers/i18n', ['exports', 'ember-i18n-inject/initializers/i18n'], function (exports, _emberI18nInjectInitializersI18n) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nInjectInitializersI18n['default'];
    }
  });
  Object.defineProperty(exports, 'initialize', {
    enumerable: true,
    get: function get() {
      return _emberI18nInjectInitializersI18n.initialize;
    }
  });
});
define('rose/initializers/kango-api', ['exports'], function (exports) {
  exports.initialize = initialize;
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

  function initialize(application) {
    application.deferReadiness();

    KangoAPI.onReady(function () {
      application.advanceReadiness();
    });
  }

  exports['default'] = {
    name: 'kango-api',
    initialize: initialize
  };
});
define("rose/initializers/liquid-fire", ["exports", "liquid-fire/router-dsl-ext", "liquid-fire/ember-internals"], function (exports, _liquidFireRouterDslExt, _liquidFireEmberInternals) {
  (0, _liquidFireEmberInternals.registerKeywords)();

  exports["default"] = {
    name: 'liquid-fire',
    initialize: function initialize() {}
  };
});
// This initializer exists only to make sure that the following
// imports happen before the app boots.
define('rose/initializers/settings', ['exports'], function (exports) {
    exports.initialize = initialize;
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

    function initialize(application) {
        application.inject('route', 'settings', 'service:settings');
        application.inject('controller', 'settings', 'service:settings');
    }

    exports['default'] = {
        name: 'settings',
        initialize: initialize
    };
});
define("rose/instance-initializers/ember-i18n", ["exports", "ember", "ember-i18n/stream", "ember-i18n/legacy-helper", "rose/config/environment"], function (exports, _ember, _emberI18nStream, _emberI18nLegacyHelper, _roseConfigEnvironment) {
  exports["default"] = {
    name: 'ember-i18n',

    initialize: function initialize(appOrAppInstance) {
      if (_emberI18nLegacyHelper["default"] != null) {
        (function () {
          // Used for Ember < 1.13
          var i18n = appOrAppInstance.container.lookup('service:i18n');

          i18n.localeStream = new _emberI18nStream["default"](function () {
            return i18n.get('locale');
          });

          _ember["default"].addObserver(i18n, 'locale', i18n, function () {
            this.localeStream.value(); // force the stream to be dirty
            this.localeStream.notify();
          });

          _ember["default"].HTMLBars._registerHelper('t', _emberI18nLegacyHelper["default"]);
        })();
      }
    }
  };
});
define('rose/locales/de/translations', ['exports'], function (exports) {
  exports['default'] = {
    // General
    and: 'und',
    yes: 'Ja',
    no: 'Nein',
    on: 'Ein',
    off: 'Aus',
    hourly: 'Stündlich',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    url: 'periodisch',
    click: 'Mausklick',
    input: 'Tastatureingabe',

    action: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      edit: 'Editieren',
      hide: 'Verbergen',
      unhide: 'Aufdecken',
      'delete': 'Löschen',
      download: 'Exportieren',
      details: 'Details',
      reset: 'Zurücksetzen',
      update: 'Aktualisieren',
      confirm: 'Bestätigen'
    },

    // Dashboard
    index: {
      title: 'ROSE Übersicht',
      subtitle: 'Gesamtanzahl gesammelter Datensätze in Ihrer lokalen ROSE-Installation.',
      trackingEnabledHeader: 'Jegliches Erfassen von Daten an/aus',
      trackingEnabled: 'Die Datenerfassung ist komplett aktiviert.',
      trackingDisabled: 'Die Datenerfassung ist komplett deaktiviert.',
      comments: 'Kommentare',
      interactions: 'Interaktionen',
      extracts: 'Extrakte'
    },

    // Sidebar Menu
    sidebarMenu: {
      data: 'Daten',
      dashboard: 'Übersichts',
      diary: 'Tagebuch',
      backup: 'Datenverwaltung',
      settings: 'Einstellungen',
      comments: 'Kommentare',
      interactions: 'Interaktionen',
      extracts: 'Extrakte',
      networks: 'Netzwerke',
      more: 'Mehr',
      help: 'Hilfe',
      about: 'Über',
      extraFeatures: 'Funktionen für Forscher',
      studyCreator: 'Studienkonfigurator',
      debugLog: 'Anwendungsprotokoll',
      observerEditor: 'Editor für Observatoren',
      dataConverter: 'Datenkonverter'
    },

    // ROSE Initialization Wizard
    wizard: {
      header: 'Willkommen in ROSE',
      description: 'Zunächst muss ROSE konfiguriert werden, um richtig zu funktionieren.',
      configOptions: 'Wählen Sie eine der beiden Optionen, um ROSE für den ersten Einsatz zu konfigurieren.',
      defaultConfigHeader: 'Standardeinstellungen nutzen',
      defaultConfigDescription: 'Ich habe keine Konfigurationsdatei um ROSE zu benutzen.',
      defaultBtn: 'Nutze Standardeinstellungen',
      fileConfigHeader: 'Konfigurationsdatei benutzen',
      fileConfigDescription: 'Ich habe eine angepasste Konfigurationsdatei, um ROSE für seinen Einsatz vorzubereiten.',
      fileConfigBtn: 'Lade Konfigurationsdatei',
      urlConfig: 'URL zu einem ROSE-Datenspeicher angeben...',
      privacyNoteTitle: 'Hinweise zum Privatsphärenschutz',
      privacyNote: '<p>ROSE sammelt Daten über Ihre Interaktionen mit Social-Media-Plattformen, falls Sie an einer empirischen Studie zum Nutzungsverhalten teilnehmen, oder für Ihre persönlichen Zwecke. Alle Daten werden nur lokal in Ihrem Webbrowser gespeichert. Die Software übermittelt keine gesammelten Daten über das Internet zu anderen Servern. Zudem sind lokale Daten pseudonymisiert. Um die Funktion zur Datensammlung auszuschalten, gehen Sie in das Einstellungsmenü und nutzen Sie den Schalter mit der Beschriftung &ldquo;Datensammlung An/Aus&rdquo;. Wenn Sie weitere Fragen haben, so besuchen Sie die <a href="https://secure-software-engineering.github.io/rose/index.html">Github-Seiten von ROSE.</p>',
      overlayNoteTitle: 'Information zur Nutzung von Einblendungen',
      overlayNote: '<p>ROSE blendet auf Social-Media-Plattformen eigene Elemente ein, um dem Nutzer zu ermöglichen Notizen zu betrachteten Inhalten zu hinterlegen. Diese Einblendungen sind eine rote Schleife mit der Aufschrift &ldquo;Kommentar&rdquo; und eine hineinschiebende Nutzerschnittstelle, um Notizen zu verwalten (siehe Bilder unten). Jegliche Daten, welche an diesen Nutzerschnittstellen eingegeben werden, werden nur lokal gespeichert - wie alle anderen Daten auch, welche ROSE sammelt. Wenn Sie die Funktion zur Datensammlung ausschalten, dann verschwinden auch alle Einblendungen.</p>',
      privacyAgree: 'Ich habe die Hinweise zum Datenschutz und Einblendungen gelesen und verstanden. Ich möchte fortfahren.'
    },

    // Diary Page
    diary: {
      title: 'Tagebuch',
      subtitle: 'Hier können Sie über alles was Ihnen auffällt Notizen hinterlassen.'
    },

    // Data Management aka Backup Page
    backup: {
      title: 'Datenverwaltung',
      subtitle: 'Untersuchen, löschen und exportieren aller Daten, welche ROSE gesammelt hat.',
      resetData: 'Alle Daten löschen',
      resetDataLabel: 'Lösche alle Daten die ROSE gesammelt hat.',
      'export': 'Daten exportieren',
      exportLabel: 'Exportiere und speichere alle Daten in einer einzigen Datei auf Ihrem Computer.'
    },

    resetDataModal: {
      question: 'Bestätigen Sie das Löschen aller gesammelten Daten',
      warning: 'Möchten Sie wirklich alle gesammelten Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
    },

    // Settings Page
    settings: {
      title: 'Einstellungen',
      subtitle: 'Verwalten Sie die Konfiguration von ROSE.',
      language: 'Sprache',
      languageLabel: 'Wählen Sie Ihre bevorzugte Sprache, oder nutzen Sie die Standardsprache Ihres Browsers (&ldquo;Auto detect&rdquo;).',
      commentReminder: 'Erinnerung für Kommentare',
      commentReminderLabel: 'ROSE wird gelegentlich eine Nachricht im unteren Bereich des Bildschirms anzeigen, um Sie daran zu erinnern Ihre Aktionen zu kommentieren, falls das innerhalb einer Forschungsstudie notwendig ist. Sie können diese Funktion ausschalten, falls Sie dadurch gestört werden.',
      extraFeatures: 'Funktionen für Forscher und Entwickler',
      extraFeaturesLabel: 'ROSE hat zusätzliche Funktionen für Forscher und ROSE-Entwickler. Diese Funktionen sind im Hauptmenü nicht sichtbar, wenn sie nicht hier eingeschaltet werden.',
      resetRose: 'ROSE-Konfiguration zurücksetzen',
      resetRoseLabel: 'Wenn Sie die Konfiguration von ROSE zurücksetzen, wird der initiale Begrüßungsbildschirm wieder erscheinen. Sie können dann die Standardkonfiguration auswählen, oder eine spezielle Konfigurationsdatei für Ihre Studie laden.',
      manualUpdate: 'Datensammel-Paket aktualisieren',
      manualUpdateLabel: 'Social-Media-Plattformen verändern gelegentlich die Gestaltung ihrer Webseiten. ROSE benötigt dann eine Aktualisierung der Datensammel-Pakete, um mit diesen Änderungen umgehen zu können. Um eine Aktualisierung manuell auszulösen, klicken Sie bitte den &ldquo;Update&rdquo;-Knopf.',
      autoUpdate: 'Automatische Aktualisierung der Datensammel-Pakete',
      autoUpdateLabel: 'Für automatische Aktualisierungen, um aktuelle Veränderungen bei Social-Media-Plattformen zu berücksichtigen, stellen Sie die automatische Aktualisierung ein.',
      autoUpdateInterval: 'Intervall für automatische Aktualisierungen',
      autoUpdateIntervalLabel: 'ROSE prüft automatisch in bestimmten Zeitintervallen, ob neue Pakete vorliegen.',
      lastChecked: 'Zuletzt geprüft',
      never: 'nie',
      lastUpdated: 'Letzte Aktualisierung',
      signedStatus: 'Status',
      signedUpdate: 'Signiert',
      unsignedUpdate: 'Nicht signiert',
      uptodate: 'Alle Pakete sind aktuell.',
      error: 'Aktualisierung gescheitert.',
      success: 'Aktualisierung erfolgreich.',
      noInternetConnection: 'Keine Internet-Verbindung'
    },

    resetConfigModal: {
      question: 'Bestätigen Sie, dass Sie die Konfiguration von ROSE zurücksetzen wollen',
      warning: 'Sind Sie sicher, dass Sie die Konfiguration zurücksetzen wollen? Diese Aktion wird Sie zurück zum initialen Begrüßungsbildschirm bringen. Alle gesammelten Daten bleiben erhalten.'
    },

    // Comments Page
    comments: {
      title: 'Kommentare',
      subtitle: 'Alle Kommentare, welche Sie in der Seitenleiste eingegeben haben.',

      you: 'Sie',
      commentedOn: 'kommentieren von'
    },

    // Interactions Page
    interactions: {
      title: 'Interaktion',
      subtitle: 'Alle Ihre vergangenen Interaktionen auf dieser Social-Media-Plattform, welche von ROSE aufgezeichnet wurden.',
      actionOn: 'Aktion mit',
      action: 'Aktion'
    },

    // Extracts Settings Page
    extracts: {
      title: 'Extrakte',
      subtitle: 'Informationen von ROSE extrahiert'
    },

    // Help Page
    help: {
      title: 'Hilfe',
      subtitle: 'Häufig gestellte Fragen über ROSE',

      issue1: {
        question: 'Woher sammelt ROSE meine Daten und Kommentare auf Social-Media-Plattformen?',
        answer: '<p>ROSE sammelt alle Daten direkt im Webbrowser und speichert sie auch dort. Es gibt keine Datenaustausch zwischen ROSE und den Social-Media-Plattformen, und auch nicht zwischen ROSE und den Forschern der Studie an der Sie ggf. teilnehmen. ROSE erlaubt Zugriff auf diese Daten durch eine Export-Funktion, über welche Sie die Daten auch an Forscher für den Zweck einer Studie weiterleiten können.</p><p>Diese privatsphäreschützende Gestaltung von ROSE hat einen Nachteil: Da Daten nur lokal gespeichert werden, ohne automatische Weiterleitung, können sie im Falle eines Systemfehlers verloren gehen, und Sie können sie auch versehentlich in Ihrem Browser löschen. In diesem Fall sind die Daten nicht wiederherstellbar.</p>'
      },
      issue2: {
        question: 'Sind meine ROSE-Kommentare für andere Studienteilnehmer oder meine Freunde auf Social-Media-Plattformen sichtbar?',
        answer: '<p>Nein. Kommentare, die Sie in ROSE machen, sind nicht sichtbar für andere. Aus technischen Gründen und zum Schutz Ihrer Privatsphäre überträgt ROSE keine gesammelten Daten zu anderen Servern der Social-Media-Plattformen und der Studien-Forscher. ROSE empfängt solche Daten auch nicht von anderen Quellen. Da ROSE fest in Ihren Browser integriert und auf den Webseiten der Social-Media-Plattformen sichtbar ist, erscheint es so als wäre es eine echte Funktion dieser Plattformen, wenngleich es allein in Ihrem Browser ausgeführt wird. Es gibt keine Möglichkeit von Social-Media-Plattformen festzustellen, ob Sie ROSE verwenden, oder nicht.</p>'
      },
      issue3: {
        question: 'Welche Arten von Daten werden von ROSE gesammelt?',
        answer: '<p>ROSE sammelt folgende Arten von Daten:</p><ul><li>Datum und Zeit von Interaktionen auf Social-Media-Plattformen, also die Zeit zu der Sie die Interaktion ausgelöst haben. </li><li>Art der Interaktion, z.B., &ldquo;liking content&rdquo;, &ldquo;viewing a profile&rdquo;, &ldquo;sharing content&rdquo;.</li><li>Eindeutige Identifikatoren aus Buchstaben und Zahlen (z.B., &ldquo;2a2d6fc3&rdquo;), welche mit dem Inhalt und den Personen in Zusammenhang stehen, mit denen Sie interagiert haben. Mit diesen Identifikatoren können Forscher erkennen, dass Sie mehrfach mit den gleichen Personen oder Inhalten interagiert haben. Die Forscher können jedoch nur Vergleiche anstellen und nicht die tatsächlichen Inhalte oder Personen in Erfahrung bringen.</li><li>Generelle und spezifische Privatssphäre-Einstellungen auf Social-Media-Plattformen, z.B., ob bei Facebook ein Eintrag nur für &ldquo;Freunde&rdquo; sichtbar oder öffentlich ist.</li><li>Studienkommentare.</li></ul>'
      },
      issue4: {
        question: 'Sammelt ROSE auch Inhalte, welche ich mit meinen Freunden teile?',
        answer: '<p>Nein. ROSE sammelt keinerlei derartige Informationen, wie z.B. Bilder, Links, persönliche Nachrichten, Gruppen- und Kontaktnamen. ROSE sammelt nur Daten über die Arten von Interaktionen, z.B., ob Sie ein Bild kommentiert haben, oder mit einem Freund persönliche Nachrichten ausgetauscht haben. In der nachfolgenden Analyse können die Studienforscher nur feststellen, dass Sie eine Interaktion durchgeführt haben, den Zeitpunkt, und die Art der Interaktion. Forscher können z.B. feststellen, dass Sie ein Bild kommentiert haben, aber sie können nicht herausfinden, ob das Bild einen Bären oder Freunde von Ihnen auf einer Party gezeigt hat. Wenn Sie zusätzliche Informationen zu Inhalten hinterlegen möchten, um Ihre Interaktionen zu erklären, dann nutzen Sie bitte die Kommentierungs- oder Tagebuch-Funktionen von ROSE.</p>'
      },
      issue5: {
        question: 'Wie kontrolliere ich, welche Arten von Interaktionen ROSE sammelt?',
        answer: '<p>Sie können dazu einfach den Menüpunkt &ldquo;Interaktionen&rdquo; öffnen. Wenn Sie die Daten exportieren und mit den Forschern teilen möchten, dann können Sie ebenfalls alle Daten in einem kompakten text-basierten Format untersuchen. Sie werden feststellen, dass die exportierten Daten keine persönlichen Informationen von Ihnen enthalten.</p>'
      },
      issue6: {
        question: 'Wie kann ich sicherstellen das ROSE meine Daten anonymisiert?',
        answer: '<p>ROSE-Daten enthalten praktisch keine Informationen über die eine andere Person herausfinden könnte, welcher Social-Media-Nutzer die Daten erstellt hat. ROSE speichert keine Daten zu Nutzernamen, Bildern, Videos und sonstigen Inhalten, welche Social-Media-Nutzer miteinander austauschen. Deshalb haben ROSE-Daten eine vergleichbare Anonymität wie Daten, die durch andere empirische Forschungsmethoden, wie z.B. anonyme Interviews, gesammelt werden. Beim Export der Daten können Sie den Datensatz, ähnlich einem Interviewtranskript, diesbezüglich gegenprüfen. </p>'
      },
      issue7: {
        question: 'Kann ich den Quellcode von ROSE einsehen, um diese Erklärungen zum Privatsphärenschutz zu prüfen?',
        answer: '<p>Ja. ROSE ist freie, quelloffene Software unter der GPL (GNU General Public License). Sie können den Quellcode überprüfen, verändern und weiterverwenden unter den Bedingungen der GPL. Sollten Sie Hilfe benötigen, so kontaktieren Sie den Ansprechpartner für ROSE bei Fraunhofer SIT.</p>'
      },
      issue8: {
        question: 'Kann ich ROSE nach dem Ende einer Studie für persönliche Zwecke weiter benutzen?',
        answer: '<p>Ja. Sie können ROSE für eigene Zwecke weiter benutzen, es werden automatisch keine Daten zu den Forschern weitergeleitet. Bitte berücksichtigen Sie die GPL-Lizenzbedingungen. Allerdings besteht nach Ende der Studie kein Anspruch auf Unterstützung, wie z.B. ROSE-Aktualisierungen.</p>'
      }
    },

    // About Page
    about: {
      title: 'Über ROSE',
      subtitle: 'Informationen zu ROSE',
      description: 'ROSE ist eine Webbrowser-Erweiterung, welche empirische Feldstudien unterstützt durch Aufzeichnen von Nutzerinteraktionen mit Social-Media-Plattformen für einen definierte Zeit. Bitte berücksichtigen Sie die Hilfe-Seite für weitere Informationen zu den Funktionen und Nutzung von ROSE.',
      developedBy: 'ROSE wurde entwickelt von',

      address: {
        name: 'Fraunhofer Institut für Sichere Informationstechnologie SIT',
        street: 'Rheinstraße 75',
        country: 'Deutschland'
      },

      forQuestions: 'Für Fragen zu ROSE kontaktieren Sie gern den Projektleiter:',
      licenceNotice: 'Dieses Programm ist freie Software. Sie können es unter den Bedingungen der GNU General Public License, wie von der Free Software Foundation veröffentlicht, weitergeben und/oder modifizieren, entweder gemäß Version 3 der Lizenz oder (nach Ihrer Option) jeder späteren Version.'
    },

    // Study Creator Page
    studyCreator: {
      title: 'Studienkonfigurator',
      subtitle: 'Diese Seite erlaubt das Erstellen einer maßgeschneiderten Konfigurationsdatei für Ihre Studie. Diese Konfigurationsdatei können Sie an Ihre Studienteilnehmer weiterleiten; durch Laden der Datei in die lokale Installation von ROSE passen die Studienteilnehmer ihre ROSE-Installation an die Anforderungen Ihrer Studie an.',
      roseComments: 'In-Situ-Kommentare',
      roseCommentsDesc: 'Aktivieren Sie diese Option, wenn die Funktion für In-Situ-Kommentare für Ihre Teilnehmer verfügbar sein soll. Zur Zeit arbeitet diese Funktion nur für Facebook.',
      roseCommentsRating: 'Hinzufügen der In-Situ-Bewertungsoption',
      roseCommentsRatingDesc: 'Aktivieren, falls die Funktion für In-Situ-Kommentare auch nach Bewertungen von Inhalten fragen soll.',
      salt: 'Kryptografischer Salt für die Inhalte-Identifikatoren',
      saltDesc: 'ROSE zeichnet pseudonyme Identifikatoren für Inhalte auf, welche die Interaktionen zu Inhalten und Personen später zueinander zuordenbar machen, ohne die eigentlichen Inhalte offenzulegen. Diese Identifikatoren werden aus dem Webseiten-Inhalt und einem kryptografischen Salt hergeleitet. Als Salt können Sie eine x-beliebige Zeichenkette verwenden, z.B. &ldquo;ROSE123&rdquo;. Wenn Sie Gruppen von Teilnehmern untersuchen wollen, dann sollte der Salt jedoch bei allen Teilnehmern gleich sein, da Sie sonst nachträglich Daten über Teilnehmer hinweg nicht korrelieren können.',
      generateSaltButton: 'Generieren',
      hashLength: 'Länge des Identifikators für Inhalte und Personen',
      hashLengthDesc: 'Hier können Sie die Länge der pseudonymen Identifikatoren für ROSE festlegen. Sie müssen dabei Privatsphäre der Teilnehmer und Eindeutigkeit der Identifikatoren abwägen. Kürzere Identifikatoren sind privatsphäreschützender; längere Identifikatoren sind einzigartiger und Kollisionen sind unwahrscheinlicher. Jede zusätzliche Stelle erhöht den Raum verfügbarer Identifikatoren um den Faktor 16. Zum Beispiel, erlaubt die Länge 4 somit 16*16*16*16=65536 eindeutige Identifikatoren für Ihre Studie. Als Daumenregel ist 5 ein in der Praxis bewährter Wert.',
      repositoryUrl: 'URL des Speichers für Datensammel-Pakete',
      repositoryUrlDesc: 'ROSE erhält seine Muster um Nutzerinteraktionen zu erkennen in Datensammel-Paketen aus einem zentralen Speicher. Hier können Sie die URL dieses Online-Speichers eingeben.',
      autoUpdate: 'Automatische Aktualisierung der Muster während der Studie',
      autoUpdateDesc: 'Datensammel-Pakete mit Erkennungsmustern werden normalerweise nur mit einer Konfigurationsdatei in ROSE geladen. Es ist aber auch möglich sie kontinuierlich zu aktualisieren, während eine Studie läuft. Dies ist besonders wichtig für Langzeit-Studien, während der die Webseiten von Social-Media-Plattformen viele Änderungen erfahren können.',
      exportConfig: 'Exportiere Konfigurationsdatei',
      exportConfigDesc: 'Hier können Sie eine Konfigurationsdatei exportieren, welche alle Einstellungen von dieser Seite enthält. Ihre Studienteilnehmer können diese Datei in ihre ROSE-Installation laden.',
      fingerprint: 'Prüfen des Schlüssel-Fingerabdrucks des Speichers für Datensammel-Pakete',
      fingerprintDesc: 'Der ausgewählte Speicher für Datensammel-Pakete enthält einen Signierschlüssel, um die Herkunft und Vertrauenswürdigkeit der Aufzeichnungsmuster nachzuweisen. ROSE prüft die Herkunft aller von diesem Speicher ausgelieferten Muster, bevor es diese lädt. Wenn Aktualisierungen auf &ldquo;sichere Aktualisierungen&rdquo; beschränkt werden, dann wird ROSE nur Muster aktualisieren, welche mit einem Schlüsselpaar signiert wurden, welches den folgenden Fingerabdruck für den öffentlichen Schlüssel besitzt. Dieser Fingerabdruck wird unabänderlich in der Konfigurationsdatei gespeichert. Bevor Sie weitermachen, prüfen Sie, ob der Fingerabdruck korrekt ist, ansonsten werden spätere Aktualisierungen fehlschlagen.',
      optionalFeaturesHeader: 'Optionale Facebook-Funktionen',
      privacyHeader: 'Privatsphäre-Einstellungen',
      repositoryHeader: 'Speicher für Datensammel-Pakete konfigurieren',
      configurationHeader: 'Datensammlung konfigurieren',
      autoUpdateHeader: 'Automatische Aktualisierung der Datensammel-Pakete konfigurieren',
      networks: 'Zu überwachende Social-Media-Plattformen',
      networksDesc: 'Hier können Sie ein- und ausschalten, auf welchen Webseiten ROSE Daten sammeln soll.',
      patterns: 'Verfügbare Aufzeichnungsmuster',
      enableAll: 'Alle verfügbaren aktivieren',
      disableAll: 'Alle verfügbaren de-aktivieren',
      forceSecureUpdate: 'Sichere Aktualisierungen verlangen',
      forceSecureUpdateDesc: 'Wenn diese Funktion angeschaltet ist, dann sind Aktualisierungen der Datensammel-Pakete nur aus sicherer Quelle erlaubt. Sie müssen dann den korrekten Fingerabdruck des öffentlichen Signaturschlüssels oben angeben.',
      updateInterval: 'Intervall für die automatische Prüfung auf Aktualisierung der Datensammel-Pakete',
      updateIntervalLabel: 'Wählen Sie ein Intervall, um nach Aktualisierungen der Datensammel-Pakete zu suchen',
      baseFileNotFound: 'Ungültige URL der Basisdatei des Datenspeichers.',

      table: {
        enabled: 'Status (An/Aus)',
        name: 'Muster-Name',
        version: 'Aktuelle Version',
        description: 'Erläuterung',
        type: 'Typ'
      }
    },

    // Application Log
    debugLog: {
      title: 'Anwendungsprotokoll',
      subtitle: 'Diese Seite zeigt alle Nachrichten, welche die Module von ROSE ausgegeben haben',
      date: 'Zeitstempel',
      message: 'Meldung',
      module: 'Modulname'
    },

    observerEditor: {
      title: 'Editor für Observations-Muster',
      subtitle: 'Dieser Editor erlaubt das Verändern der Observations-Muster zu Testzwecken, oder um neue zu erstellen. Diese Funktionen ist für Experten.'
    },

    dataConverter: {
      title: 'Datenkonverter',
      subtitle: 'Konverter um XML-ROSE-Exporte in CSV-Dateien umzuwandeln. Laden Sie die XML-Datei und wählen Sie die Datensätze, welche in die CSV-Datei übertragen werden sollen.'
    }
  };
});
define('rose/locales/en/translations', ['exports'], function (exports) {
  exports['default'] = {
    // General
    and: 'and',
    yes: 'Yes',
    no: 'No',
    on: 'On',
    off: 'Off',
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    url: 'periodic',
    click: 'mouse-click',
    input: 'keyboard-input',

    action: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      hide: 'Hide',
      unhide: 'Unhide',
      'delete': 'Delete',
      download: 'Export',
      details: 'Details',
      reset: 'Reset',
      update: 'Update',
      confirm: 'Confirm'
    },

    // Dashboard
    index: {
      title: 'ROSE Control Center',
      subtitle: 'Count of items collected in your local ROSE installation',
      trackingEnabledHeader: 'All Tracking function on/off',
      trackingEnabled: 'Tracking is globally enabled.',
      trackingDisabled: 'Tracking is globally disabled.',
      comments: 'Comments',
      interactions: 'Interactions',
      extracts: 'Extracts'
    },

    // Sidebar Menu
    sidebarMenu: {
      data: 'Data',
      dashboard: 'Dashboard',
      diary: 'Diary',
      backup: 'Data Management',
      settings: 'Settings',
      comments: 'Comments',
      interactions: 'Interactions',
      extracts: 'Extracts',
      networks: 'Networks',
      more: 'More',
      help: 'Help',
      about: 'About',
      extraFeatures: 'Researcher Features',
      studyCreator: 'Study Creator',
      debugLog: 'Application Log',
      observerEditor: 'Observer Editor',
      dataConverter: 'Data Converter'
    },

    // ROSE Initialization Wizard
    wizard: {
      header: 'Welcome to ROSE',
      description: 'We first need to configure ROSE to work properly.',
      configOptions: 'Choose one of the following two options to configure ROSE before your first use.',
      defaultConfigHeader: 'Use default configuration',
      defaultConfigDescription: 'I have no configuration file to customize ROSE.',
      defaultBtn: 'Use default configuration',
      fileConfigHeader: 'Use configuration file',
      fileConfigDescription: 'I have a customized configuration file for initializing ROSE.',
      fileConfigBtn: 'Load configuration file',
      urlConfig: 'Specifiy a URL to a ROSE repository...',
      privacyNoteTitle: 'Privacy Note',
      privacyNote: '<p>ROSE collects data about your interactions with social media sites for the purpose of participating in an empirical study, or, if you are not participating in a study, for personal purposes. ROSE stores all collected data locally and in an anonymized way in your web browser. ROSE does not send any tracking data over the Internet to other servers, neither to social media sites nor to the researchers in whose study you might participate. At any time you can disable the tracking functions of ROSE by using the &ldquo;tracking on/off&rdquo; switch in the settings menu. If you have any further questions see the <a href="https://secure-software-engineering.github.io/rose/index.html">Github pages of ROSE</a>.</p>',
      overlayNoteTitle: 'Information on the Use of Overlays',
      overlayNote: '<p>ROSE adds overlays to social media sites such as Facebook thereby enabling the user to take notes on content he or she encounters online. These overlays are a red ribbon with the caption &ldquo;Comment&rdquo; and a sliding-in graphical user interface to manage notes, see pictures below. All data entered to text fields embedded in these overlays is store locally alone, just like any other data collected by ROSE. Disabling the tracking function also disables all overlays.</p>',
      privacyAgree: 'I have read and understood the notes on privacy and overlays. I want to proceed.'
    },

    // Diary Page
    diary: {
      title: 'Diary',
      subtitle: 'Here you can take notes of everything that attracted your attention'
    },

    // Data Management aka Backup Page
    backup: {
      title: 'Data Management',
      subtitle: 'Clear, review, or export all data recorded by ROSE.',
      resetData: 'Clear all data',
      resetDataLabel: 'Delete all data collected by ROSE.',
      'export': 'Export data',
      exportLabel: 'Export and save all collected data to a single file locally on your computer.'
    },

    resetDataModal: {
      question: 'Confirm deletion of all collected data',
      warning: 'Are you sure you want to delete all data collected? This action cannot be undone.'
    },

    // Settings Page
    settings: {
      title: 'Settings',
      subtitle: 'Manage the configuration of ROSE.',
      language: 'Language',
      languageLabel: 'Choose your preferred language, or use the browser default language (&ldquo;auto detect&rdquo; option).',
      commentReminder: 'Comment reminder',
      commentReminderLabel: 'ROSE will occasionally display a message at the bottom of the screen reminding you to comment on your actions if a research study requires you to do so. You can deactivate this reminder if it disturbs you.',
      extraFeatures: 'Features for researchers and developers',
      extraFeaturesLabel: 'ROSE has additional features for field researchers and ROSE developers. These features are not visible in the menu unless activated here.',
      resetRose: 'Reset ROSE configuration',
      resetRoseLabel: 'If you reset the configuration of ROSE, the initialization wizard will appear again. You can choose to either use the default configuration or load a specific study configuration file.',
      manualUpdate: 'Update tracking package',
      manualUpdateLabel: 'Social media sites change the design of their web pages from time to time. To adapt to these changes, ROSE requires regular updates of tracking packages containing special patterns for detecting the user interactions. To trigger an update manually, press the “update” button.',
      autoUpdate: 'Automatic tracking package update',
      autoUpdateLabel: 'For automatic updates to recent changes in social media sites, switch on the automatic update function.',
      autoUpdateInterval: 'Automatic update interval',
      autoUpdateIntervalLabel: 'ROSE checks automatically for tracking package updates in the specified time interval.',
      lastChecked: 'Last checked',
      never: 'Never',
      lastUpdated: 'Last updated',
      signedStatus: 'Status',
      signedUpdate: 'Signed',
      unsignedUpdate: 'Unsigned',
      uptodate: 'Everything is already up-to-date.',
      error: 'Update failed.',
      success: 'Update successful.',
      noInternetConnection: 'No internet connection'
    },

    resetConfigModal: {
      question: 'Confirm resetting the configuration of ROSE',
      warning: 'Are you sure you want to reset the configuration of ROSE. This action will bring you back to the initial configuration wizard. All collected data will remain unchanged.'
    },

    // Comments Page
    comments: {
      title: 'Comments',
      subtitle: 'All comments you have entered using the comment sidebar.',
      you: 'You',
      commentedOn: 'commented on'
    },

    // Interactions Page
    interactions: {
      title: 'Interactions',
      subtitle: 'All your recent interactions on this social media site recorded by ROSE.',
      actionOn: 'action on',
      action: 'action'
    },

    // Extracts Settings Page
    extracts: {
      title: 'Extracts',
      subtitle: 'ROSE extracted these information'
    },

    // Help Page
    help: {
      title: 'Help',
      subtitle: 'Frequently asked questions about ROSE',

      issue1: {
        question: 'Where does ROSE collect the data about my social media sites&rsquo; usage and my comments from?',
        answer: '<p>ROSE collects data from about your interactions directly in your web browser; collected data are also stored in the web browser only. There is no data exchange of data between ROSE and the social media sites, or between ROSE and the researchers of the study in which you might participate. ROSE will provide a pre-assembled option through which you can export your data and can send it to the study researchers in case you wish to do so. Having the user anytime in full control of her data is part of the privacy-aware design of ROSE.</p><p>However, this design also has a small disadvantage you need to be aware of: Since data is stored only locally in your browser, it can get lost in case of system errors on your computer, or in the case of accidental deletion of ROSE from your web browser. All Data is irretrievable once it got lost this way.</p>'
      },
      issue2: {
        question: 'Are my ROSE study comments visible to other study participants or my friends on social media site?',
        answer: '<p>No. All comments you make through ROSE are invisible to other study participants or your social media site friends. For technical and especially privacy reasons, ROSE data never leaves your web browser to servers of social media sites or to the researchers of the study. ROSE does not receive tracking data from any other source either. Though ROSE is integrated in your web browser and the social media sites&rsquo; interfaces, thus appearing like an &ldquo;actual&rdquo; social media site function, it completely and exclusively operates in your web browser. Also, there is no way for social media sites to detect from remote whether or not you are using ROSE.</p>'
      },
      issue3: {
        question: 'What types of data are recorded by ROSE?',
        answer: '<p>ROSE records the following types of data:</p><ul><li>Date and time of interactions on social media sites, i.e., the time the study participant engages in an interaction. </li><li>Type of interaction, e.g., &ldquo;liking content&rdquo;, &ldquo;viewing a profile&rdquo;, &ldquo;sharing content&rdquo;.</li><li>Unique identifiers, eight-digit combinations of letters and numbers (e.g., &ldquo;2a2d6fc3&rdquo;) corresponding to each story item (e.g., a picture, a status update) and other user the study participant interacted with. With the identifiers, researchers can detect when study participants interact with the same story item or person repeatedly. But the researchers will not be able to identify the actual item or person.</li><li>General and specific privacy settings concerning interactions, e.g. whether a story item is visible for &ldquo;Friends&rdquo; only or for the public.</li><li>Diary entries.</li><li>ROSE study comments.</li></ul>'
      },
      issue4: {
        question: 'Does ROSE collect the actual content I share with my friends on social media sites?',
        answer: '<p>No. ROSE does not collect any content information, such as pictures, links, or messages on Timelines; chat messages; or the name of groups you attended. ROSE only collects data about the usage of a type of interactions, e.g., whether you commented on a picture, or whether you engaged in a chat with a friend. In the analysis, researchers are only able to see whether you engaged in an interaction, the timestamp, and the type of interaction. For example, researchers can see that you commented on a picture, but they will not know whether the picture showed a polar bear or friends at a party. If you would like to report information regarding the content related to an interaction in order to explain why you made use of a specific action, please use the ROSE comment function or the diary function.</p>'
      },
      issue5: {
        question: 'How do I control what types of interaction ROSE collect?',
        answer: '<p>You can easily check the types of interaction recorded from the ROSE user interface (menu item &ldquo;Interactions&rdquo;). When you export and share your data with the researchers, you can also view all data collected in the compact text-based data format. You will see from the exported data file that there is no personal data collected.</p>'
      },
      issue6: {
        question: 'How can I be sure that ROSE makes my data anonymous?',
        answer: '<p>ROSE data does not contain any information identifying the social media site user who created the data. ROSE does not save any social media site user names, pictures, or videos provided by users. Thus, ROSE data is similar to anonymized data collected through other means, such as anonymous interviews. When you export your data you can cross-check the validity of these privacy claims.</p>'
      },
      issue7: {
        question: 'May I review the source code to check previous declarations?',
        answer: '<p>Yes. ROSE is free, open-source software under GPL (GNU General Public License). You may review the source code, change, or process it under the conditions of the GPL. Should you need assistance, please contact the project contact at Fraunhofer SIT. </p>'
      },
      issue8: {
        question: 'May I use ROSE for personal purposes after the study ends?',
        answer: '<p>Yes. You may continue using ROSE for your own records, as it does not send any information to the researchers automatically. Please note the GPL license’s conditions. However, after the completion of the study, we will not be able to provide you any assistance, such as providing ROSE updates.</p>'
      }
    },

    // About Page
    about: {
      title: 'About ROSE',
      subtitle: 'Information about ROSE',
      description: 'ROSE is a browser extension to support empirical field studies by recording users&rsquo; interactions with social media sites for a limited period of time. Please refer to the Help page for further information on the functions and use of ROSE.',
      developedBy: 'ROSE is developed by',

      address: {
        name: 'Fraunhofer Institute for Secure Information Technology SIT',
        street: 'Rheinstrasse 75',
        country: 'Germany'
      },

      forQuestions: 'For questions about ROSE, feel free to contact the project lead:',
      licenceNotice: 'This program is free software. You can redistribute it and/or modify it under the terms of the GNU General Public License (version 3 or above) as published by the Free Software Foundation.'
    },

    // Study Creator Page
    studyCreator: {
      title: 'Study Creator',
      subtitle: 'With this page you can create a tailored configuration file for your study. You can distribute this configuration file to your study participants; by loading this file into their installations, ROSE participants can adapt their ROSE instances to the specific needs of your empirical study.',

      roseComments: 'In-situ comments',
      roseCommentsDesc: 'Check if ROSE&rsquo;s in-situ comment function should be available to participants. Currently the in-situ commenting works only for Facebook.',
      roseCommentsRating: 'Add in-situ rating option',
      roseCommentsRatingDesc: 'Check if the in-situ comment function should also ask for rating content.',
      salt: 'Cryptographic salt for content identifiers',
      saltDesc: 'ROSE records pseudonymous identifiers for user content allowing researchers to re-identify content without a need to reveal it. These identfiers are derived from user-entered content and a cryptographic salt. As a cryptographic salt you can enter any arbitrary text string, for example &ldquo;ROSE123&rdquo; or whatever else you like. However, make sure that in case you investigate a group of participants all use the same salt in their ROSE configuration. Otherwise you can not correlate identifiers among participants afterwards.',
      generateSaltButton: 'Generate',
      hashLength: 'Content identifier length',
      hashLengthDesc: 'Here you can specify the length of the pseudonymous identifiers created by ROSE. You need to balance participants&rsquo; privacy and the uniqueness of identifiers: the shorter the identifier the more privacy protecting they are; the longer the identifiers the more unique they are and collusion get unlikely. Every digit adds a factor of 16 to the space of possible identifiers for your study. For example, setting the option to 4 allows for 16*16*16*16=65536 unique identifiers for your study. As a rule of thumb, 5 is a good value if you are unsure how to use this option.',
      repositoryUrl: 'URL of tracking package repository',
      repositoryUrlDesc: 'ROSE gets its patterns to match user interactions to specific interaction types in tracking packages from a repository. Here you can enter the URL of this repository.',
      autoUpdate: 'Automatically update tracking packages during study',
      autoUpdateDesc: 'While tracking packages with detection patterns are usually only pushed to ROSE when the configuration file is loaded into participants&rsquo; instances of ROSE, it is also possible to continuously update them while the study is running. This might be necessary for long-term studies, if the user interface of the investigated social media site is likely to change during the course of the study.',
      exportHeader: 'Export configuration',
      exportConfig: 'Export configuration file',
      exportConfigDesc: 'Here you can create and export a configuration file with all the settings entered on this page. Your participants can load this file into their installations of ROSE.',
      fingerprint: 'Check repository&rsquo;s public key fingerprint for Public Key Pinning',
      fingerprintDesc: 'The chosen repository provides a signing key for proving the origin and trustworthiness of patterns. ROSE validates the origin of patterns delivered by this repository before loading them into the tracking engine. Once pattern updates are restricted to the secure mode, ROSE will only update patterns which are signed using an asymmetric key pair with the following public key fingerprint. This fingerprint will be stored in the configuration file and cannot be altered afterwards (called Public Key Pinning). Before continuing, check whether the displayed fingerprint is correct otherwise updates will fail.',
      optionalFeaturesHeader: 'Optional Facebook features',
      privacyHeader: 'Privacy settings',
      repositoryHeader: 'Configure tracking package repository',
      configurationHeader: 'Configure tracking',
      autoUpdateHeader: 'Configure automatic tracking package updates',
      networks: 'Websites to track',
      networksDesc: 'Here you can enable or disable which websites shall be tracked by ROSE',
      patterns: 'Available tracking patterns',
      enableAll: 'Enable all available',
      disableAll: 'Disable all available',
      forceSecureUpdate: 'Force secure update',
      forceSecureUpdateDesc: 'If turned on, update of the tracking package is only allowed from a trustworthy source. You need to provide the correct fingerprint for the signing key above.',
      keyUnavailable: 'No key in the specifified repository to enable secure update!',
      updateInterval: 'Interval to check for an updated tracking package',
      updateIntervalLabel: 'Choose a time interval to check for tracking package updates',
      baseFileNotFound: 'Invalid repository base file URL.',
      fetchRepository: 'Retrieve repository to configure tracking',

      table: {
        enabled: 'Status (on/off)',
        name: 'Pattern name',
        version: 'Current version',
        description: 'Description',
        type: 'Type'
      }
    },

    // Application Log
    debugLog: {
      title: 'Application Log',
      subtitle: 'This page shows all log messages thrown by ROSE application modules',
      date: 'Timestamp',
      message: 'Log message',
      module: 'Module name'
    },

    observerEditor: {
      title: 'Editor for Observer Patterns',
      subtitle: 'This editor allows you to change observer patterns for testing reasons, or to create new ones. This function is for expert use only.'
    },

    dataConverter: {
      title: 'Data Converter',
      subtitle: 'Tool to convert XML data exports from ROSE into more convenient CSV files. Just load the XML file and select the data set you want to convert into a CSV file.'
    }
  };
});
define("rose/locales/languages", ["exports"], function (exports) {
  exports["default"] = [{ name: "English", code: "en" }, { name: "Deutsch", code: "de" }];
});
define('rose/models/comment', ['exports', 'ember-data'], function (exports, _emberData) {

  var model = _emberData['default'].Model.extend({
    text: _emberData['default'].attr('string'),
    createdAt: _emberData['default'].attr('number', { defaultValue: function defaultValue() {
        return Date.now();
      } }),
    checkbox: _emberData['default'].attr('array'),
    updatedAt: _emberData['default'].attr(),
    isPrivate: _emberData['default'].attr('boolean'),
    rating: _emberData['default'].attr('array'),
    contentId: _emberData['default'].attr('string'),
    type: _emberData['default'].attr('string'),
    network: _emberData['default'].attr()
  });

  exports['default'] = model;
});
define('rose/models/diary-entry', ['exports', 'ember-data'], function (exports, _emberData) {

  var model = _emberData['default'].Model.extend({
    text: _emberData['default'].attr('string'),
    createdAt: _emberData['default'].attr('number', { defaultValue: function defaultValue() {
        return Date.now();
      } }),
    updatedAt: _emberData['default'].attr(),
    isPrivate: _emberData['default'].attr('boolean', { defaultValue: false })
  });

  exports['default'] = model;
});
define('rose/models/extract', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    createdAt: _emberData['default'].attr('number'),
    origin: _emberData['default'].attr('object'),
    fields: _emberData['default'].attr()
  });
});
define('rose/models/extractor', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    network: _emberData['default'].attr()
  });
});
define('rose/models/interaction', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    createdAt: _emberData['default'].attr('number'),
    origin: _emberData['default'].attr('object'),
    isPrivate: _emberData['default'].attr('boolean')
  });
});
define('rose/models/network', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    name: _emberData['default'].attr('string'),
    descriptiveName: _emberData['default'].attr('string'),
    identifier: _emberData['default'].attr('string'),
    isEnabled: _emberData['default'].attr('boolean')
  });
});
define('rose/models/observer', ['exports', 'ember-data', 'model-fragments'], function (exports, _emberData, _modelFragments) {
    exports['default'] = _emberData['default'].Model.extend({
        name: _emberData['default'].attr('string'),
        network: _emberData['default'].attr('string'),
        type: _emberData['default'].attr('string'),
        priority: _emberData['default'].attr('number'),
        version: _emberData['default'].attr('string'),
        patterns: _modelFragments['default'].fragmentArray('pattern'),
        isEnabled: _emberData['default'].attr('boolean')
    });
});
define('rose/models/pattern', ['exports', 'ember-data', 'model-fragments'], function (exports, _emberData, _modelFragments) {
    exports['default'] = _modelFragments['default'].Fragment.extend({
        node: _emberData['default'].attr('string'),
        parent: _emberData['default'].attr('string'),
        extractor: _emberData['default'].attr('string')
    });
});
define('rose/models/study-creator-setting', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    roseCommentsIsEnabled: _emberData['default'].attr('boolean'),
    roseCommentsRatingIsEnabled: _emberData['default'].attr('boolean'),
    salt: _emberData['default'].attr('string'),
    hashLength: _emberData['default'].attr('number', { defaultValue: 5 }),
    repositoryURL: _emberData['default'].attr('string'),
    autoUpdateIsEnabled: _emberData['default'].attr('boolean'),
    forceSecureUpdate: _emberData['default'].attr('boolean'),
    fileName: _emberData['default'].attr('string', { defaultValue: 'rose-study-configuration.json' }),
    networks: _emberData['default'].hasMany('network', { async: true }),
    fingerprint: _emberData['default'].attr('string'),
    updateInterval: _emberData['default'].attr('number')
  });
});
define('rose/models/system-config', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    autoUpdateIsEnabled: _emberData['default'].attr('boolean'),
    forceSecureUpdate: _emberData['default'].attr('boolean'),
    roseCommentsIsEnabled: _emberData['default'].attr('boolean'),
    roseCommentsRatingIsEnabled: _emberData['default'].attr('boolean'),
    salt: _emberData['default'].attr('string'),
    hashLength: _emberData['default'].attr('number'),
    repositoryURL: _emberData['default'].attr('string'),
    updateInterval: _emberData['default'].attr('number'),
    fingerprint: _emberData['default'].attr('string'),
    lastChecked: _emberData['default'].attr('number'),
    lastUpdated: _emberData['default'].attr('number')
  });
});
define('rose/models/user-setting', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Model.extend({
    trackingEnabled: _emberData['default'].attr('boolean', { defaultValue: true }),
    commentReminderIsEnabled: _emberData['default'].attr('boolean', { defaultValue: true }),
    developerModeIsEnabled: _emberData['default'].attr('boolean'),
    currentLanguage: _emberData['default'].attr('string', { defaultValue: 'en' }),
    firstRun: _emberData['default'].attr('boolean', { defaultValue: true })
  });
});
define('rose/pods/components/diary-entry/component', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    classNames: ['comment', 'diary-entry'],

    actions: {
      hide: function hide() {
        this.set('model.isPrivate', true);
        this.get('model').save();
      },
      unhide: function unhide() {
        this.set('model.isPrivate', false);
        this.get('model').save();
      },
      'delete': function _delete() {
        this.get('model').destroyRecord();
      },
      edit: function edit() {
        this.set('isEditable', true);
      },
      save: function save() {
        this.set('model.updatedAt', Date.now());
        this.get('model').save();
        this.set('isEditable', false);
      },
      cancel: function cancel() {
        this.get('model').rollbackAttributes();
        this.set('isEditable', false);
      }
    }
  });
});
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
define("rose/pods/components/diary-entry/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 2
            },
            "end": {
              "line": 13,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui form");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["inline", "textarea", [], ["value", ["subexpr", "@mut", [["get", "model.text", ["loc", [null, [11, 23], [11, 33]]]]], [], []]], ["loc", [null, [11, 6], [11, 35]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 2
            },
            "end": {
              "line": 15,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "model.text", ["loc", [null, [14, 4], [14, 18]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 2
            },
            "end": {
              "line": 25,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element3 = dom.childAt(fragment, [1]);
          var element4 = dom.childAt(fragment, [3]);
          var morphs = new Array(4);
          morphs[0] = dom.createElementMorph(element3);
          morphs[1] = dom.createMorphAt(element3, 1, 1);
          morphs[2] = dom.createElementMorph(element4);
          morphs[3] = dom.createMorphAt(element4, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["save"], [], ["loc", [null, [19, 7], [19, 24]]]], ["inline", "t", ["action.save"], [], ["loc", [null, [20, 6], [20, 25]]]], ["element", "action", ["cancel"], [], ["loc", [null, [22, 7], [22, 26]]]], ["inline", "t", ["action.cancel"], [], ["loc", [null, [23, 6], [23, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 2
            },
            "end": {
              "line": 29,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element2);
          morphs[1] = dom.createMorphAt(element2, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["edit"], [], ["loc", [null, [26, 7], [26, 24]]]], ["inline", "t", ["action.edit"], [], ["loc", [null, [27, 6], [27, 25]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 30,
              "column": 2
            },
            "end": {
              "line": 34,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element1);
          morphs[1] = dom.createMorphAt(element1, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["unhide"], [], ["loc", [null, [31, 7], [31, 26]]]], ["inline", "t", ["action.unhide"], [], ["loc", [null, [32, 6], [32, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 34,
              "column": 2
            },
            "end": {
              "line": 38,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/diary-entry/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["hide"], [], ["loc", [null, [35, 7], [35, 24]]]], ["inline", "t", ["action.hide"], [], ["loc", [null, [36, 6], [36, 25]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 44,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/diary-entry/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1, "class", "avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "circular file text outline icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "text disabled");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "actions");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element5 = dom.childAt(fragment, [2]);
        var element6 = dom.childAt(element5, [5]);
        var element7 = dom.childAt(element6, [4]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(dom.childAt(element5, [1, 1]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(element5, [3]), 1, 1);
        morphs[2] = dom.createMorphAt(element6, 1, 1);
        morphs[3] = dom.createMorphAt(element6, 2, 2);
        morphs[4] = dom.createElementMorph(element7);
        morphs[5] = dom.createMorphAt(element7, 1, 1);
        return morphs;
      },
      statements: [["inline", "moment-format", [["get", "model.createdAt", ["loc", [null, [6, 39], [6, 54]]]]], [], ["loc", [null, [6, 23], [6, 56]]]], ["block", "liquid-if", [["get", "isEditable", ["loc", [null, [9, 15], [9, 25]]]]], [], 0, 1, ["loc", [null, [9, 2], [15, 16]]]], ["block", "if", [["get", "isEditable", ["loc", [null, [18, 8], [18, 18]]]]], [], 2, 3, ["loc", [null, [18, 2], [29, 9]]]], ["block", "if", [["get", "model.isPrivate", ["loc", [null, [30, 8], [30, 23]]]]], [], 4, 5, ["loc", [null, [30, 2], [38, 9]]]], ["element", "action", ["delete"], [], ["loc", [null, [39, 7], [39, 26]]]], ["inline", "t", ["action.delete"], [], ["loc", [null, [40, 6], [40, 27]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5]
    };
  })());
});
define('rose/pods/components/installation-wizard/component', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    ajax: _ember['default'].inject.service(),
    read: false,
    unread: (function () {
      return !this.get('read');
    }).property('read'),

    actions: {

      selectDefaultConfig: function selectDefaultConfig() {
        var _this = this;

        var ajax = this.get('ajax');
        var src = kango.io.getResourceUrl('res/defaults/rose-configuration.json');

        ajax.request(src, { dataType: 'json' }).then(function (json) {
          return _this.sendAction('onsuccess', json);
        });
      },

      fileLoaded: function fileLoaded(file) {
        var json = JSON.parse(file.data);
        this.sendAction('onsuccess', json);
      }
    }
  });
});
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
define("rose/pods/components/installation-wizard/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 55,
              "column": 12
            },
            "end": {
              "line": 63,
              "column": 12
            }
          },
          "moduleName": "rose/pods/components/installation-wizard/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "add icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n              ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 3, 3, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["wizard.fileConfigBtn"], [], ["loc", [null, [62, 14], [62, 42]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 72,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/installation-wizard/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui two column centered grid");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "column");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "ui segment form");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h2");
        dom.setAttribute(el4, "class", "ui dividing header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("i");
        dom.setAttribute(el5, "class", "download icon");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "content");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "sub header");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h4");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h4");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "ui stackable two column grid");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "column");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("img");
        dom.setAttribute(el7, "class", "ui fluid image");
        dom.setAttribute(el7, "src", "../icons/Screenshot-CommentRibbon.png");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "column");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("img");
        dom.setAttribute(el7, "class", "ui fluid image");
        dom.setAttribute(el7, "src", "../icons/Screenshot-Sidebar.png");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4, "class", "ui divider");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("form");
        dom.setAttribute(el4, "class", "ui form");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "field");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5, "class", "ui two cards");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "card");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7, "class", "content");
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("div");
        dom.setAttribute(el8, "class", "header");
        var el9 = dom.createComment("");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("div");
        dom.setAttribute(el8, "class", "description");
        var el9 = dom.createTextNode("\n                ");
        dom.appendChild(el8, el9);
        var el9 = dom.createComment("");
        dom.appendChild(el8, el9);
        var el9 = dom.createTextNode("\n              ");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n            ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("button");
        dom.setAttribute(el7, "class", "ui primary bottom attached button");
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n            ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6, "class", "card");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7, "class", "content");
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("div");
        dom.setAttribute(el8, "class", "header");
        var el9 = dom.createComment("");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n              ");
        dom.appendChild(el7, el8);
        var el8 = dom.createElement("div");
        dom.setAttribute(el8, "class", "description");
        var el9 = dom.createTextNode("\n                ");
        dom.appendChild(el8, el9);
        var el9 = dom.createComment("");
        dom.appendChild(el8, el9);
        var el9 = dom.createTextNode("\n              ");
        dom.appendChild(el8, el9);
        dom.appendChild(el7, el8);
        var el8 = dom.createTextNode("\n            ");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 1, 1]);
        var element1 = dom.childAt(element0, [1, 3]);
        var element2 = dom.childAt(element0, [13]);
        var element3 = dom.childAt(element2, [3]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(element4, [3]);
        var element7 = dom.childAt(element3, [3]);
        var element8 = dom.childAt(element7, [1]);
        var morphs = new Array(15);
        morphs[0] = dom.createMorphAt(element1, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element0, [5]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element0, [7]), 0, 0);
        morphs[5] = dom.createMorphAt(dom.childAt(element0, [9]), 1, 1);
        morphs[6] = dom.createMorphAt(dom.childAt(element2, [1]), 1, 1);
        morphs[7] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
        morphs[8] = dom.createMorphAt(dom.childAt(element5, [3]), 1, 1);
        morphs[9] = dom.createAttrMorph(element6, 'disabled');
        morphs[10] = dom.createElementMorph(element6);
        morphs[11] = dom.createMorphAt(element6, 1, 1);
        morphs[12] = dom.createMorphAt(dom.childAt(element8, [1]), 0, 0);
        morphs[13] = dom.createMorphAt(dom.childAt(element8, [3]), 1, 1);
        morphs[14] = dom.createMorphAt(element7, 3, 3);
        return morphs;
      },
      statements: [["inline", "t", ["wizard.header"], [], ["loc", [null, [7, 10], [7, 31]]]], ["inline", "t", ["wizard.description"], [], ["loc", [null, [8, 34], [8, 60]]]], ["inline", "t", ["wizard.privacyNoteTitle"], [], ["loc", [null, [12, 10], [12, 41]]]], ["inline", "t", ["wizard.privacyNote"], [], ["loc", [null, [13, 9], [13, 35]]]], ["inline", "t", ["wizard.overlayNoteTitle"], [], ["loc", [null, [15, 10], [15, 41]]]], ["inline", "t", ["wizard.overlayNote"], [], ["loc", [null, [17, 8], [17, 34]]]], ["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "read", ["loc", [null, [32, 32], [32, 36]]]]], [], []], "label", ["subexpr", "t", ["wizard.privacyAgree"], [], ["loc", [null, [32, 43], [32, 68]]]]], ["loc", [null, [32, 10], [32, 71]]]], ["inline", "t", ["wizard.defaultConfigHeader"], [], ["loc", [null, [38, 34], [38, 68]]]], ["inline", "t", ["wizard.defaultConfigDescription"], [], ["loc", [null, [40, 16], [40, 55]]]], ["attribute", "disabled", ["get", "unread", ["loc", [null, [44, 64], [44, 70]]]]], ["element", "action", ["selectDefaultConfig"], [], ["loc", [null, [44, 20], [44, 52]]]], ["inline", "t", ["wizard.defaultBtn"], [], ["loc", [null, [45, 14], [45, 39]]]], ["inline", "t", ["wizard.fileConfigHeader"], [], ["loc", [null, [50, 34], [50, 65]]]], ["inline", "t", ["wizard.fileConfigDescription"], [], ["loc", [null, [52, 16], [52, 52]]]], ["block", "rose-file-picker", [], ["fileLoaded", "fileLoaded", "dropzone", false, "preview", false, "readAs", "readAsText", "class", "ui bottom attached primary button", "isEnabled", ["subexpr", "@mut", [["get", "read", ["loc", [null, [60, 38], [60, 42]]]]], [], []]], 0, null, ["loc", [null, [55, 12], [63, 33]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/pods/components/no-data-message/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 6
          }
        },
        "moduleName": "rose/pods/components/no-data-message/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui icon message");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "open folder outline icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "header");
        var el4 = dom.createTextNode("\n      There is no data to list here, yet.\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes() {
        return [];
      },
      statements: [],
      locals: [],
      templates: []
    };
  })());
});
define("rose/pods/components/page-numbers/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 4
            },
            "end": {
              "line": 6,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/page-numbers/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "class", "icon item");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "left arrow icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element1);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", -1], [], ["loc", [null, [3, 29], [3, 58]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 4
            },
            "end": {
              "line": 10,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/page-numbers/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "class", "icon item disabled");
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "left arrow icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 13,
                "column": 8
              },
              "end": {
                "line": 15,
                "column": 8
              }
            },
            "moduleName": "rose/pods/components/page-numbers/template.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "disabled item");
            var el2 = dom.createTextNode("...");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 17,
                  "column": 12
                },
                "end": {
                  "line": 19,
                  "column": 12
                }
              },
              "moduleName": "rose/pods/components/page-numbers/template.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["content", "item.page", ["loc", [null, [18, 16], [18, 29]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 16,
                "column": 8
              },
              "end": {
                "line": 20,
                "column": 8
              }
            },
            "moduleName": "rose/pods/components/page-numbers/template.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "link-to", [["subexpr", "query-params", [], ["page", ["get", "item.page", ["loc", [null, [17, 42], [17, 51]]]]], ["loc", [null, [17, 23], [17, 52]]]]], ["class", "item active"], 0, null, ["loc", [null, [17, 12], [19, 24]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 21,
                  "column": 12
                },
                "end": {
                  "line": 23,
                  "column": 12
                }
              },
              "moduleName": "rose/pods/components/page-numbers/template.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["content", "item.page", ["loc", [null, [22, 16], [22, 29]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 20,
                "column": 8
              },
              "end": {
                "line": 24,
                "column": 8
              }
            },
            "moduleName": "rose/pods/components/page-numbers/template.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "link-to", [["subexpr", "query-params", [], ["page", ["get", "item.page", ["loc", [null, [21, 42], [21, 51]]]]], ["loc", [null, [21, 23], [21, 52]]]]], ["class", "item"], 0, null, ["loc", [null, [21, 12], [23, 24]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 12,
              "column": 4
            },
            "end": {
              "line": 25,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/page-numbers/template.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "item.dots", ["loc", [null, [13, 14], [13, 23]]]]], [], 0, null, ["loc", [null, [13, 8], [15, 15]]]], ["block", "if", [["get", "item.current", ["loc", [null, [16, 14], [16, 26]]]]], [], 1, 2, ["loc", [null, [16, 8], [24, 15]]]]],
        locals: ["item"],
        templates: [child0, child1, child2]
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 27,
              "column": 4
            },
            "end": {
              "line": 31,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/page-numbers/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "class", "icon item");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "right arrow icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element0);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", 1], [], ["loc", [null, [28, 25], [28, 53]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 31,
              "column": 4
            },
            "end": {
              "line": 35,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/page-numbers/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          dom.setAttribute(el1, "class", "icon item disabled");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "right arrow icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 37,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/page-numbers/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui pagination menu");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element2, 1, 1);
        morphs[1] = dom.createMorphAt(element2, 3, 3);
        morphs[2] = dom.createMorphAt(element2, 5, 5);
        return morphs;
      },
      statements: [["block", "if", [["get", "canStepBackward", ["loc", [null, [2, 10], [2, 25]]]]], [], 0, 1, ["loc", [null, [2, 4], [10, 11]]]], ["block", "each", [["get", "pageItems", ["loc", [null, [12, 12], [12, 21]]]]], [], 2, null, ["loc", [null, [12, 4], [25, 13]]]], ["block", "if", [["get", "canStepForward", ["loc", [null, [27, 10], [27, 24]]]]], [], 3, 4, ["loc", [null, [27, 4], [35, 11]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define('rose/pods/components/rose-comment/component', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    isEditable: false,
    classNames: ['comment'],

    actions: {
      hide: function hide() {
        this.set('model.isPrivate', true);
        this.get('model').save();
      },
      unhide: function unhide() {
        this.set('model.isPrivate', false);
        this.get('model').save();
      },
      'delete': function _delete() {
        this.get('model').destroyRecord();
      },
      edit: function edit() {
        this.set('isEditable', true);
      },
      save: function save() {
        this.set('model.updatedAt', Date.now());
        this.get('model').save();
        this.set('isEditable', false);
      },
      cancel: function cancel() {
        this.get('model').rollbackAttributes();
        this.set('isEditable', false);
      }
    }
  });
});
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
define("rose/pods/components/rose-comment/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 4
            },
            "end": {
              "line": 13,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "rating");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "star icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 3, 3);
          return morphs;
        },
        statements: [["content", "value", ["loc", [null, [11, 6], [11, 15]]]]],
        locals: ["value"],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 16,
              "column": 2
            },
            "end": {
              "line": 20,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui form");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["inline", "textarea", [], ["value", ["subexpr", "@mut", [["get", "model.text", ["loc", [null, [18, 23], [18, 33]]]]], [], []]], ["loc", [null, [18, 6], [18, 35]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 2
            },
            "end": {
              "line": 22,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui segment");
          var el2 = dom.createElement("pre");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 0]), 0, 0);
          return morphs;
        },
        statements: [["content", "model.text", ["loc", [null, [21, 33], [21, 47]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 2
            },
            "end": {
              "line": 32,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element3 = dom.childAt(fragment, [1]);
          var element4 = dom.childAt(fragment, [3]);
          var morphs = new Array(4);
          morphs[0] = dom.createElementMorph(element3);
          morphs[1] = dom.createMorphAt(element3, 1, 1);
          morphs[2] = dom.createElementMorph(element4);
          morphs[3] = dom.createMorphAt(element4, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["save"], [], ["loc", [null, [26, 7], [26, 24]]]], ["inline", "t", ["action.save"], [], ["loc", [null, [27, 6], [27, 25]]]], ["element", "action", ["cancel"], [], ["loc", [null, [29, 7], [29, 26]]]], ["inline", "t", ["action.cancel"], [], ["loc", [null, [30, 6], [30, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 32,
              "column": 2
            },
            "end": {
              "line": 36,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element2);
          morphs[1] = dom.createMorphAt(element2, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["edit"], [], ["loc", [null, [33, 7], [33, 24]]]], ["inline", "t", ["action.edit"], [], ["loc", [null, [34, 6], [34, 25]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 37,
              "column": 2
            },
            "end": {
              "line": 41,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element1);
          morphs[1] = dom.createMorphAt(element1, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["unhide"], [], ["loc", [null, [38, 7], [38, 26]]]], ["inline", "t", ["action.unhide"], [], ["loc", [null, [39, 6], [39, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 41,
              "column": 2
            },
            "end": {
              "line": 45,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["hide"], [], ["loc", [null, [42, 7], [42, 24]]]], ["inline", "t", ["action.hide"], [], ["loc", [null, [43, 6], [43, 25]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 51,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/rose-comment/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1, "class", "avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "circular comment icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2, "class", "author");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("strong");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "text");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "actions");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element5 = dom.childAt(fragment, [2]);
        var element6 = dom.childAt(element5, [7]);
        var element7 = dom.childAt(element5, [11]);
        var element8 = dom.childAt(element7, [4]);
        var morphs = new Array(10);
        morphs[0] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
        morphs[1] = dom.createMorphAt(element5, 3, 3);
        morphs[2] = dom.createMorphAt(dom.childAt(element5, [5]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(element6, 3, 3);
        morphs[5] = dom.createMorphAt(dom.childAt(element5, [9]), 1, 1);
        morphs[6] = dom.createMorphAt(element7, 1, 1);
        morphs[7] = dom.createMorphAt(element7, 2, 2);
        morphs[8] = dom.createElementMorph(element8);
        morphs[9] = dom.createMorphAt(element8, 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["comments.you"], [], ["loc", [null, [5, 20], [5, 40]]]], ["inline", "t", ["comments.commentedOn"], [], ["loc", [null, [5, 45], [5, 73]]]], ["content", "model.contentId", ["loc", [null, [5, 82], [5, 101]]]], ["inline", "moment-format", [["get", "model.createdAt", ["loc", [null, [7, 39], [7, 54]]]]], [], ["loc", [null, [7, 23], [7, 56]]]], ["block", "each", [["get", "model.rating", ["loc", [null, [8, 12], [8, 24]]]]], [], 0, null, ["loc", [null, [8, 4], [13, 13]]]], ["block", "liquid-if", [["get", "isEditable", ["loc", [null, [16, 15], [16, 25]]]]], [], 1, 2, ["loc", [null, [16, 2], [22, 16]]]], ["block", "if", [["get", "isEditable", ["loc", [null, [25, 8], [25, 18]]]]], [], 3, 4, ["loc", [null, [25, 2], [36, 9]]]], ["block", "if", [["get", "model.isPrivate", ["loc", [null, [37, 8], [37, 23]]]]], [], 5, 6, ["loc", [null, [37, 2], [45, 9]]]], ["element", "action", ["delete"], [], ["loc", [null, [46, 7], [46, 26]]]], ["inline", "t", ["action.delete"], [], ["loc", [null, [47, 6], [47, 27]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6]
    };
  })());
});
define('rose/pods/components/rose-extract/component', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    classNames: ['comment'],
    showDetails: false,

    jsonData: (function () {
      return JSON.stringify(this.get('model'), null, 2);
    }).property('model'),

    actions: {
      toggleDetails: function toggleDetails() {
        this.toggleProperty('showDetails');
      },
      hide: function hide() {
        this.set('model.isPrivate', true);
        this.get('model').save();
      },
      unhide: function unhide() {
        this.set('model.isPrivate', false);
        this.get('model').save();
      },
      'delete': function _delete() {
        this.get('model').destroyRecord();
      }
    }
  });
});
/*
Copyright (C) 2015
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
define("rose/pods/components/rose-extract/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 2
            },
            "end": {
              "line": 14,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-extract/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui segment");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("pre");
          var el3 = dom.createElement("code");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1, 0]), 0, 0);
          return morphs;
        },
        statements: [["content", "jsonData", ["loc", [null, [12, 15], [12, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 2
            },
            "end": {
              "line": 20,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-extract/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element1);
          morphs[1] = dom.createMorphAt(element1, 0, 0);
          return morphs;
        },
        statements: [["element", "action", ["unhide"], [], ["loc", [null, [19, 7], [19, 26]]]], ["inline", "t", ["action.unhide"], [], ["loc", [null, [19, 27], [19, 48]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 2
            },
            "end": {
              "line": 22,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-extract/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["element", "action", ["hide"], [], ["loc", [null, [21, 7], [21, 24]]]], ["inline", "t", ["action.hide"], [], ["loc", [null, [21, 25], [21, 44]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 26,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/rose-extract/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1, "class", "avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "circular eyedropper icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2, "class", "author");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "text");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "actions");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [2]);
        var element3 = dom.childAt(element2, [7]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [5]);
        var morphs = new Array(8);
        morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
        morphs[1] = dom.createMorphAt(dom.childAt(element2, [3, 1]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [5]), 1, 1);
        morphs[3] = dom.createElementMorph(element4);
        morphs[4] = dom.createMorphAt(element4, 0, 0);
        morphs[5] = dom.createMorphAt(element3, 3, 3);
        morphs[6] = dom.createElementMorph(element5);
        morphs[7] = dom.createMorphAt(element5, 0, 0);
        return morphs;
      },
      statements: [["content", "model.origin.extractor", ["loc", [null, [5, 20], [5, 46]]]], ["inline", "moment-format", [["get", "model.createdAt", ["loc", [null, [7, 39], [7, 54]]]]], [], ["loc", [null, [7, 23], [7, 56]]]], ["block", "liquid-if", [["get", "showDetails", ["loc", [null, [10, 15], [10, 26]]]]], [], 0, null, ["loc", [null, [10, 2], [14, 16]]]], ["element", "action", ["toggleDetails"], [], ["loc", [null, [17, 7], [17, 33]]]], ["inline", "t", ["action.details"], [], ["loc", [null, [17, 34], [17, 56]]]], ["block", "if", [["get", "model.isPrivate", ["loc", [null, [18, 8], [18, 23]]]]], [], 1, 2, ["loc", [null, [18, 2], [22, 9]]]], ["element", "action", ["delete"], [], ["loc", [null, [23, 7], [23, 26]]]], ["inline", "t", ["action.delete"], [], ["loc", [null, [23, 27], [23, 48]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define('rose/pods/components/rose-file-picker/component', ['exports', 'ember', 'ember-cli-file-picker/components/file-picker'], function (exports, _ember, _emberCliFilePickerComponentsFilePicker) {
  exports['default'] = _emberCliFilePickerComponentsFilePicker['default'].extend({
    classNameBindings: ['isEnabled:enabled:disabled'],
    isEnabled: true
  });
});
/*
Copyright (C) 2017
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
define("rose/pods/components/rose-file-picker/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "triple-curlies"
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "rose/pods/components/rose-file-picker/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__dropzone");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [3, 4], [3, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "rose/pods/components/rose-file-picker/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [6, 2], [6, 11]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 11,
              "column": 0
            }
          },
          "moduleName": "rose/pods/components/rose-file-picker/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__preview");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 0
            },
            "end": {
              "line": 17,
              "column": 0
            }
          },
          "moduleName": "rose/pods/components/rose-file-picker/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__progress");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "file-picker__progress__value");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createAttrMorph(element0, 'style');
          return morphs;
        },
        statements: [["attribute", "style", ["get", "progressStyle", ["loc", [null, [15, 55], [15, 68]]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 20,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/rose-file-picker/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(4);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["block", "if", [["get", "dropzone", ["loc", [null, [1, 6], [1, 14]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]], ["block", "if", [["get", "preview", ["loc", [null, [9, 6], [9, 13]]]]], [], 2, null, ["loc", [null, [9, 0], [11, 7]]]], ["block", "if", [["get", "progress", ["loc", [null, [13, 6], [13, 14]]]]], [], 3, null, ["loc", [null, [13, 0], [17, 7]]]], ["inline", "input", [], ["type", "file", "value", ["subexpr", "@mut", [["get", "file", ["loc", [null, [19, 26], [19, 30]]]]], [], []], "accept", ["subexpr", "@mut", [["get", "accept", ["loc", [null, [19, 38], [19, 44]]]]], [], []], "multiple", ["subexpr", "@mut", [["get", "multiple", ["loc", [null, [19, 54], [19, 62]]]]], [], []], "class", "file-picker__input"], ["loc", [null, [19, 0], [19, 91]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define('rose/pods/components/rose-interaction/component', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Component.extend({
    classNames: ['comment'],
    showDetails: false,

    jsonData: (function () {
      return JSON.stringify(this.get('model'), null, 2);
    }).property('model'),

    actions: {
      toggleDetails: function toggleDetails() {
        this.toggleProperty('showDetails');
      },
      hide: function hide() {
        this.set('model.isPrivate', true);
        this.get('model').save();
      },
      unhide: function unhide() {
        this.set('model.isPrivate', false);
        this.get('model').save();
      },
      'delete': function _delete() {
        this.get('model').destroyRecord();
      }
    }
  });
});
/*
Copyright (C) 2015
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
define("rose/pods/components/rose-interaction/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 2
            },
            "end": {
              "line": 8,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("strong");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
          return morphs;
        },
        statements: [["inline", "t", ["interactions.actionOn"], [], ["loc", [null, [7, 4], [7, 33]]]], ["content", "model.origin.target.contentId", ["loc", [null, [7, 42], [7, 75]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 8,
                "column": 2
              },
              "end": {
                "line": 10,
                "column": 2
              }
            },
            "moduleName": "rose/pods/components/rose-interaction/template.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode(" ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("strong");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
            return morphs;
          },
          statements: [["inline", "t", ["interactions.actionOn"], [], ["loc", [null, [9, 4], [9, 33]]]], ["content", "model.origin.target.commentId", ["loc", [null, [9, 42], [9, 75]]]]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 10,
                "column": 2
              },
              "end": {
                "line": 12,
                "column": 2
              }
            },
            "moduleName": "rose/pods/components/rose-interaction/template.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n  ");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["interactions.action"], [], ["loc", [null, [11, 4], [11, 31]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 2
            },
            "end": {
              "line": 12,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "model.origin.target.commentId", ["loc", [null, [8, 12], [8, 41]]]]], [], 0, 1, ["loc", [null, [8, 2], [12, 2]]]]],
        locals: [],
        templates: [child0, child1]
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 17,
              "column": 2
            },
            "end": {
              "line": 21,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui segment");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("pre");
          var el3 = dom.createElement("code");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1, 0]), 0, 0);
          return morphs;
        },
        statements: [["content", "jsonData", ["loc", [null, [19, 15], [19, 27]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 2
            },
            "end": {
              "line": 27,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element1);
          morphs[1] = dom.createMorphAt(element1, 0, 0);
          return morphs;
        },
        statements: [["element", "action", ["unhide"], [], ["loc", [null, [26, 7], [26, 26]]]], ["inline", "t", ["action.unhide"], [], ["loc", [null, [26, 27], [26, 48]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 27,
              "column": 2
            },
            "end": {
              "line": 29,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("a");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element0);
          morphs[1] = dom.createMorphAt(element0, 0, 0);
          return morphs;
        },
        statements: [["element", "action", ["hide"], [], ["loc", [null, [28, 7], [28, 24]]]], ["inline", "t", ["action.hide"], [], ["loc", [null, [28, 25], [28, 44]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 33,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/rose-interaction/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1, "class", "avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "circular pointing right icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2, "class", "author");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3, "class", "date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "text");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "actions");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [2]);
        var element3 = dom.childAt(element2, [9]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [5]);
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
        morphs[1] = dom.createMorphAt(element2, 3, 3);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [5, 1]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [7]), 1, 1);
        morphs[4] = dom.createElementMorph(element4);
        morphs[5] = dom.createMorphAt(element4, 0, 0);
        morphs[6] = dom.createMorphAt(element3, 3, 3);
        morphs[7] = dom.createElementMorph(element5);
        morphs[8] = dom.createMorphAt(element5, 0, 0);
        return morphs;
      },
      statements: [["content", "model.origin.observer", ["loc", [null, [5, 20], [5, 45]]]], ["block", "if", [["get", "model.origin.target.contentId", ["loc", [null, [6, 8], [6, 37]]]]], [], 0, 1, ["loc", [null, [6, 2], [12, 9]]]], ["inline", "moment-format", [["get", "model.createdAt", ["loc", [null, [14, 39], [14, 54]]]]], [], ["loc", [null, [14, 23], [14, 56]]]], ["block", "liquid-if", [["get", "showDetails", ["loc", [null, [17, 15], [17, 26]]]]], [], 2, null, ["loc", [null, [17, 2], [21, 16]]]], ["element", "action", ["toggleDetails"], [], ["loc", [null, [24, 7], [24, 33]]]], ["inline", "t", ["action.details"], [], ["loc", [null, [24, 34], [24, 56]]]], ["block", "if", [["get", "model.isPrivate", ["loc", [null, [25, 8], [25, 23]]]]], [], 3, 4, ["loc", [null, [25, 2], [29, 9]]]], ["element", "action", ["delete"], [], ["loc", [null, [30, 7], [30, 26]]]], ["inline", "t", ["action.delete"], [], ["loc", [null, [30, 27], [30, 48]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define('rose/pods/components/statistic-item/component', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Component.extend({
        classNames: ['statistic'],

        count: _ember['default'].computed('data', function () {
            var data = this.get('data');
            var filtered = data.filterBy('network', this.get('network'));
            var filteredOrigin = data.filterBy('origin.network', this.get('network'));
            return filtered.length || filteredOrigin.length;
        })
    });
});
/*
Copyright (C) 2016
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
define("rose/pods/components/statistic-item/template", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/statistic-item/template.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "value");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "label");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]), 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        return morphs;
      },
      statements: [["content", "count", ["loc", [null, [2, 4], [2, 13]]]], ["inline", "t", [["get", "label", ["loc", [null, [5, 8], [5, 13]]]]], [], ["loc", [null, [5, 4], [5, 15]]]]],
      locals: [],
      templates: []
    };
  })());
});
define('rose/router', ['exports', 'ember', 'rose/config/environment'], function (exports, _ember, _roseConfigEnvironment) {

  var Router = _ember['default'].Router.extend({
    location: _roseConfigEnvironment['default'].locationType
  });

  exports['default'] = Router.map(function () {
    this.route('about');
    this.route('help');
    this.route('diary');
    this.route('backup');
    this.route('settings');
    this.route('comments', { path: '/:network_name/comments' });
    this.route('interactions', { path: '/:network_name/interactions' });
    this.route('extracts', { path: '/:network_name/extracts' });
    this.route('study-creator');
    this.route('debug-log', {});
    this.route('observers');
    this.route('observer', { path: '/observer/:observer_id' });
    this.route('data-converter');
  });
});
/*
Copyright (C) 2015-2016
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
define('rose/routes/about', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({});
});
define('rose/routes/application', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    beforeModel: function beforeModel() {
      var settings = this.get('settings');
      return settings.setup();
    },

    afterModel: function afterModel() {
      this.set('i18n.locale', this.get('settings.user.currentLanguage'));
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);

      return this.store.findAll('network').then(function (networks) {
        controller.set('networks', networks);
      });
    },

    actions: {
      resetConfig: function resetConfig() {
        var _this = this;

        var settings = this.get('settings.user');
        settings.destroyRecord().then(function () {
          return _this.get('settings').setup();
        }).then(function () {
          return _this.transitionTo('application');
        });
      },

      loading: function loading() {
        var _this2 = this;

        if (this.controller) {
          this.controller.set('isLoading', true);
          this.router.one('didTransition', function () {
            _this2.controller.set('isLoading', false);
          });
        }
        return true;
      }
    }
  });
});
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
define('rose/routes/backup', ['exports', 'ember'], function (exports, _ember) {

  var addDateString = function addDateString(dateKeys) {
    return function (record) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = dateKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var dateKey = _step.value;

          if (record[dateKey] !== undefined) {
            record[dateKey + 'String'] = new Date(record[dateKey]).toISOString();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return record;
    };
  };

  var getItem = function getItem(key, dateKeys) {
    return new _ember['default'].RSVP.Promise(function (resolve) {
      kango.invokeAsyncCallback('localforage.getItem', key, function (data) {
        if (dateKeys) {
          data = data.map(addDateString(dateKeys));
        }
        resolve({
          type: key,
          data: data
        });
      });
    });
  };

  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      var _this = this;

      var getModels = function getModels(key, dateKeys) {
        return _this.store.findAll(key).then(function (records) {
          var data = records.invoke('serialize');
          if (dateKeys) {
            data.map(addDateString(dateKeys));
          }
          return {
            type: key,
            data: data
          };
        });
      };

      var promises = [getModels('comment', ['createdAt', 'updatedAt']), getModels('interaction', ['createdAt']), getModels('extract', ['createdAt']), getModels('diary-entry', ['createdAt', 'updatedAt']), getModels('user-setting'), getModels('system-config'), getItem('click-activity-records', ['date']), getItem('mousemove-activity-records', ['date']), getItem('window-activity-records', ['date']), getItem('scroll-activity-records', ['date']), getItem('fb-login-activity-records', ['date']), getItem('install-date'), getItem('rose-data-version'), getItem('rose-version')];

      return _ember['default'].RSVP.all(promises);
    }
  });
});
/*
Copyright (C) 2015-2017
    Felix A. Epp <work@felixepp.de>
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
define('rose/routes/comments', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model(params) {
      return this.store.query('comment', { network: params.network_name });
    }
  });
});
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
define('rose/routes/data-converter', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({});
});
define('rose/routes/debug-log', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return localforage.getItem('application-log');
    }
  });
});
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
define('rose/routes/diary', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return this.store.findAll('diary-entry');
    }
  });
});
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
define('rose/routes/extracts', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model(params) {
      return this.store.findAll('extract').then(function (records) {
        return records.filterBy('origin.network', params.network_name);
      });
    }
  });
});
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
define('rose/routes/help', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({});
});
define('rose/routes/index', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      return _ember['default'].RSVP.hash({
        comments: this.store.findAll('comment'),
        interactions: this.store.findAll('interaction'),
        extracts: this.store.findAll('extract')
      });
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);

      return this.store.findAll('network').then(function (networks) {
        controller.set('networks', networks);
      });
    }
  });
});
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
define('rose/routes/interactions', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model(params) {
      return this.store.findAll('interaction').then(function (records) {
        return records.filterBy('origin.network', params.network_name);
      });
    }
  });
});
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
define('rose/routes/observer', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Route.extend({
        model: function model(params) {
            return this.store.findRecord('observer', params.observer_id);
        }
    });
});
/*
Copyright (C) 2016
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
define('rose/routes/observers', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Route.extend({
        model: function model() {
            return this.store.findAll('observer');
        },

        actions: {
            addObserver: function addObserver() {
                var newObserver = this.store.createRecord('observer');
                this.transitionTo('observer', newObserver);
            },

            removeObserver: function removeObserver(observer) {
                return observer.destroyRecord();
            }
        }
    });
});
/*
Copyright (C) 2016
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
define('rose/routes/study-creator', ['exports', 'ember', 'rose/defaults/study-creator'], function (exports, _ember, _roseDefaultsStudyCreator) {
  exports['default'] = _ember['default'].Route.extend({
    model: function model() {
      var _this = this;

      return this.store.findAll('study-creator-setting').then(function (settings) {
        if (_ember['default'].isEmpty(settings)) {
          return _this.store.createRecord('study-creator-setting', _roseDefaultsStudyCreator['default']).save();
        }

        return settings.get('firstObject');
      });
    }
  });
});
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
define('rose/serializers/application', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].JSONSerializer.extend({});
});
define('rose/serializers/pattern', ['exports', 'ember-data'], function (exports, _emberData) {
    exports['default'] = _emberData['default'].JSONSerializer.extend({
        attrs: {
            parent: 'container'
        }
    });
});
define('rose/services/ajax', ['exports', 'ember-ajax/services/ajax'], function (exports, _emberAjaxServicesAjax) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberAjaxServicesAjax['default'];
    }
  });
});
define('rose/services/i18n', ['exports', 'ember-i18n/services/i18n'], function (exports, _emberI18nServicesI18n) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nServicesI18n['default'];
    }
  });
});
define("rose/services/liquid-fire-modals", ["exports", "liquid-fire/modals"], function (exports, _liquidFireModals) {
  exports["default"] = _liquidFireModals["default"];
});
define("rose/services/liquid-fire-transitions", ["exports", "liquid-fire/transition-map"], function (exports, _liquidFireTransitionMap) {
  exports["default"] = _liquidFireTransitionMap["default"];
});
define('rose/services/moment', ['exports', 'ember', 'moment'], function (exports, _ember, _moment2) {
  var computed = _ember['default'].computed;
  exports['default'] = _ember['default'].Service.extend({
    _locale: null,
    _timeZone: null,

    locale: computed({
      get: function get() {
        return this.get('_locale');
      },
      set: function set(propertyKey, locale) {
        this.set('_locale', locale);
        return locale;
      }
    }),

    timeZone: computed({
      get: function get() {
        return this.get('_timeZone');
      },
      set: function set(propertyKey, timeZone) {
        if (_moment2['default'].tz) {
          this.set('_timeZone', timeZone);
          return timeZone;
        } else {
          _ember['default'].Logger.warn('[ember-moment] attempted to set timezone, but moment-timezone unavailable.');
        }
      }
    }),

    changeLocale: function changeLocale(locale) {
      this.set('locale', locale);
    },

    changeTimeZone: function changeTimeZone(timeZone) {
      this.set('timeZone', timeZone);
    },

    moment: function moment() {
      var time = _moment2['default'].apply(undefined, arguments);
      var locale = this.get('locale');
      var timeZone = this.get('timeZone');

      if (locale) {
        time = time.locale(locale);
      }

      if (timeZone && time.tz) {
        time = time.tz(timeZone);
      }

      return time;
    }
  });
});
define('rose/services/navigator', ['exports', 'ember'], function (exports, _ember) {
    exports['default'] = _ember['default'].Service.extend({
        onLine: _ember['default'].computed(function () {
            return navigator.onLine;
        })
    });
});
/*
Copyright (C) 2016
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
define('rose/services/settings', ['exports', 'ember'], function (exports, _ember) {
    var isEmpty = _ember['default'].isEmpty;
    var service = _ember['default'].inject.service;
    var Promise = _ember['default'].RSVP.Promise;
    exports['default'] = _ember['default'].Service.extend({
        store: service(),

        setup: function setup() {
            var _this = this;

            var store = this.get('store');

            var userSettings = store.findRecord('user-setting', 1)['catch'](function () {
                return store.createRecord('user-setting', { id: 1 }).save();
            }).then(function (settings) {
                return _this.set('user', settings);
            });

            var systemSettings = store.findRecord('system-config', 1)['catch'](function () {
                return store.createRecord('system-config', { id: 1 }).save();
            }).then(function (settings) {
                return _this.set('system', settings);
            });

            return Promise.all([userSettings, systemSettings]);
        }
    });
});
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
define("rose/templates/about", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 36,
            "column": 0
          }
        },
        "moduleName": "rose/templates/about.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "info icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("Oliver Hoffmann, Sebastian Ruhleder ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" Felix Epp");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui basic segment");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("address");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("strong");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    64295 Darmstadt");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("br");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2, "href", "mailto: andreas.poller@ sit.fraunhofer.de");
        var el3 = dom.createTextNode("Andreas Poller, andreas.poller@sit.fraunhofer.de");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var element1 = dom.childAt(fragment, [10, 1]);
        var morphs = new Array(10);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [8]), 1, 1);
        morphs[5] = dom.createMorphAt(dom.childAt(element1, [1]), 0, 0);
        morphs[6] = dom.createMorphAt(element1, 4, 4);
        morphs[7] = dom.createMorphAt(element1, 9, 9);
        morphs[8] = dom.createMorphAt(dom.childAt(fragment, [12]), 1, 1);
        morphs[9] = dom.createMorphAt(dom.childAt(fragment, [16]), 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["about.title"], [], ["loc", [null, [4, 4], [4, 23]]]], ["inline", "t", ["about.subtitle"], [], ["loc", [null, [5, 28], [5, 50]]]], ["inline", "t", ["about.description"], [], ["loc", [null, [10, 2], [10, 27]]]], ["inline", "t", ["about.developedBy"], [], ["loc", [null, [15, 0], [15, 25]]]], ["inline", "t", ["and"], [], ["loc", [null, [17, 39], [17, 50]]]], ["inline", "t", ["about.address.name"], [], ["loc", [null, [21, 12], [21, 38]]]], ["inline", "t", ["about.address.street"], [], ["loc", [null, [22, 4], [22, 32]]]], ["inline", "t", ["about.address.country"], [], ["loc", [null, [24, 4], [24, 33]]]], ["inline", "t", ["about.forQuestions"], [], ["loc", [null, [28, 2], [28, 28]]]], ["inline", "t", ["about.licenceNotice"], [], ["loc", [null, [34, 2], [34, 29]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("rose/templates/application", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "rose/templates/application.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "installation-wizard", [], ["cancel", "cancelWizard", "onsuccess", "saveConfig"], ["loc", [null, [3, 0], [3, 68]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 19,
              "column": 0
            }
          },
          "moduleName": "rose/templates/application.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui page grid");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "four wide column");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "twelve wide column");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n    ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [3, 1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 1, 1);
          morphs[1] = dom.createAttrMorph(element1, 'class');
          morphs[2] = dom.createMorphAt(element1, 1, 1);
          return morphs;
        },
        statements: [["inline", "partial", ["sidebar-menu"], [], ["loc", [null, [9, 4], [9, 30]]]], ["attribute", "class", ["concat", ["ui segment ", ["subexpr", "if", [["get", "isLoading", ["loc", [null, [13, 32], [13, 41]]]], "loading"], [], ["loc", [null, [13, 27], [13, 53]]]]]]], ["content", "outlet", ["loc", [null, [14, 6], [14, 16]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 20,
            "column": 0
          }
        },
        "moduleName": "rose/templates/application.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "settings.user.firstRun", ["loc", [null, [1, 6], [1, 28]]]]], [], 0, 1, ["loc", [null, [1, 0], [19, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/backup", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 32,
            "column": 0
          }
        },
        "moduleName": "rose/templates/backup.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "download icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3, "class", "ui primary button");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2, "class", "ui primary button");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var element1 = dom.childAt(fragment, [2]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element2, [5]);
        var element4 = dom.childAt(element1, [3]);
        var element5 = dom.childAt(element1, [5]);
        var morphs = new Array(12);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [3]), 0, 0);
        morphs[4] = dom.createElementMorph(element3);
        morphs[5] = dom.createMorphAt(element3, 1, 1);
        morphs[6] = dom.createMorphAt(dom.childAt(element4, [1]), 0, 0);
        morphs[7] = dom.createMorphAt(dom.childAt(element4, [3]), 0, 0);
        morphs[8] = dom.createMorphAt(element4, 5, 5);
        morphs[9] = dom.createElementMorph(element5);
        morphs[10] = dom.createMorphAt(element5, 1, 1);
        morphs[11] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        return morphs;
      },
      statements: [["inline", "t", ["backup.title"], [], ["loc", [null, [4, 4], [4, 24]]]], ["inline", "t", ["backup.subtitle"], [], ["loc", [null, [5, 28], [5, 51]]]], ["inline", "t", ["backup.resetData"], [], ["loc", [null, [11, 11], [11, 35]]]], ["inline", "t", ["backup.resetDataLabel"], [], ["loc", [null, [12, 7], [12, 36]]]], ["element", "action", ["openModal", "reset-data"], [], ["loc", [null, [14, 38], [14, 73]]]], ["inline", "t", ["action.reset"], [], ["loc", [null, [15, 6], [15, 26]]]], ["inline", "t", ["backup.export"], [], ["loc", [null, [20, 11], [20, 32]]]], ["inline", "t", ["backup.exportLabel"], [], ["loc", [null, [21, 7], [21, 33]]]], ["inline", "textarea", [], ["readonly", true, "value", ["subexpr", "@mut", [["get", "jsonData", ["loc", [null, [22, 35], [22, 43]]]]], [], []]], ["loc", [null, [22, 4], [22, 45]]]], ["element", "action", ["download"], [], ["loc", [null, [26, 36], [26, 57]]]], ["inline", "t", ["action.download"], [], ["loc", [null, [27, 4], [27, 27]]]], ["inline", "partial", ["modal/reset-data"], [], ["loc", [null, [31, 0], [31, 30]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("rose/templates/comments", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "rose/templates/comments.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [10, 26], [10, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [10, 2], [12, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 16,
              "column": 2
            },
            "end": {
              "line": 18,
              "column": 2
            }
          },
          "moduleName": "rose/templates/comments.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "rose-comment", [], ["model", ["subexpr", "@mut", [["get", "comment", ["loc", [null, [17, 25], [17, 32]]]]], [], []]], ["loc", [null, [17, 4], [17, 34]]]]],
        locals: ["comment"],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 2
            },
            "end": {
              "line": 20,
              "column": 2
            }
          },
          "moduleName": "rose/templates/comments.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "no-data-message", ["loc", [null, [19, 4], [19, 23]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 23,
              "column": 0
            },
            "end": {
              "line": 27,
              "column": 0
            }
          },
          "moduleName": "rose/templates/comments.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [24, 26], [24, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [24, 2], [26, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 28,
            "column": 0
          }
        },
        "moduleName": "rose/templates/comments.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui comments");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[3] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
        morphs[4] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["comments.title"], [], ["loc", [null, [4, 4], [4, 26]]]], ["inline", "t", ["comments.subtitle"], [], ["loc", [null, [5, 28], [5, 53]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [9, 6], [9, 18]]]]], [], 0, null, ["loc", [null, [9, 0], [13, 7]]]], ["block", "each", [["get", "pagedContent", ["loc", [null, [16, 10], [16, 22]]]]], [], 1, 2, ["loc", [null, [16, 2], [20, 11]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [23, 6], [23, 18]]]]], [], 3, null, ["loc", [null, [23, 0], [27, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("rose/templates/components/file-picker", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "triple-curlies"
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/file-picker.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__dropzone");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [3, 4], [3, 13]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/file-picker.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "yield", ["loc", [null, [6, 2], [6, 11]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 11,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/file-picker.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__preview");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 0
            },
            "end": {
              "line": 17,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/file-picker.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "file-picker__progress");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2, "class", "file-picker__progress__value");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createAttrMorph(element0, 'style');
          return morphs;
        },
        statements: [["attribute", "style", ["get", "progressStyle", ["loc", [null, [15, 55], [15, 68]]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type", "multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 20,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/file-picker.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(4);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[2] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        morphs[3] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [["block", "if", [["get", "dropzone", ["loc", [null, [1, 6], [1, 14]]]]], [], 0, 1, ["loc", [null, [1, 0], [7, 7]]]], ["block", "if", [["get", "preview", ["loc", [null, [9, 6], [9, 13]]]]], [], 2, null, ["loc", [null, [9, 0], [11, 7]]]], ["block", "if", [["get", "progress", ["loc", [null, [13, 6], [13, 14]]]]], [], 3, null, ["loc", [null, [13, 0], [17, 7]]]], ["inline", "input", [], ["type", "file", "value", ["subexpr", "@mut", [["get", "file", ["loc", [null, [19, 26], [19, 30]]]]], [], []], "accept", ["subexpr", "@mut", [["get", "accept", ["loc", [null, [19, 38], [19, 44]]]]], [], []], "multiple", ["subexpr", "@mut", [["get", "multiple", ["loc", [null, [19, 54], [19, 62]]]]], [], []], "class", "file-picker__input"], ["loc", [null, [19, 0], [19, 91]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("rose/templates/components/liquid-bind", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 5,
                  "column": 4
                },
                "end": {
                  "line": 7,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-bind.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "yield", [["get", "version", ["loc", [null, [6, 15], [6, 22]]]]], [], ["loc", [null, [6, 6], [6, 26]]]]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 7,
                  "column": 4
                },
                "end": {
                  "line": 9,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-bind.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["content", "version", ["loc", [null, [8, 6], [8, 20]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 11,
                "column": 0
              }
            },
            "moduleName": "rose/templates/components/liquid-bind.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [5, 11], [5, 19]]]]], [], 0, 1, ["loc", [null, [5, 4], [9, 12]]]]],
          locals: ["version"],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 12,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-bind.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "attrs.value", ["loc", [null, [2, 28], [2, 39]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [2, 44], [2, 47]]]]], [], []], "outletName", ["subexpr", "@mut", [["get", "attrs.outletName", ["loc", [null, [3, 32], [3, 48]]]]], [], []], "name", "liquid-bind", "renderWhenFalse", true, "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [4, 67], [4, 72]]]]], [], []]], 0, null, ["loc", [null, [2, 2], [11, 22]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 25,
                    "column": 6
                  },
                  "end": {
                    "line": 27,
                    "column": 6
                  }
                },
                "moduleName": "rose/templates/components/liquid-bind.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["inline", "yield", [["get", "version", ["loc", [null, [26, 17], [26, 24]]]]], [], ["loc", [null, [26, 8], [26, 28]]]]],
              locals: [],
              templates: []
            };
          })();
          var child1 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 27,
                    "column": 6
                  },
                  "end": {
                    "line": 29,
                    "column": 6
                  }
                },
                "moduleName": "rose/templates/components/liquid-bind.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["content", "version", ["loc", [null, [28, 8], [28, 22]]]]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 21,
                  "column": 4
                },
                "end": {
                  "line": 31,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-bind.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["block", "if", [["get", "hasBlock", ["loc", [null, [25, 13], [25, 21]]]]], [], 0, 1, ["loc", [null, [25, 6], [29, 14]]]]],
            locals: ["version"],
            templates: [child0, child1]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 13,
                "column": 2
              },
              "end": {
                "line": 32,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-bind.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "attrs.value", ["loc", [null, [21, 30], [21, 41]]]]], [], []], "notify", ["subexpr", "@mut", [["get", "container", ["loc", [null, [21, 49], [21, 58]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [21, 63], [21, 66]]]]], [], []], "outletName", ["subexpr", "@mut", [["get", "attrs.outletName", ["loc", [null, [22, 34], [22, 50]]]]], [], []], "name", "liquid-bind", "renderWhenFalse", true], 0, null, ["loc", [null, [21, 4], [31, 26]]]]],
          locals: ["container"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 12,
              "column": 0
            },
            "end": {
              "line": 33,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-bind.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-container", [], ["id", ["subexpr", "@mut", [["get", "id", ["loc", [null, [14, 9], [14, 11]]]]], [], []], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [15, 12], [15, 17]]]]], [], []], "growDuration", ["subexpr", "@mut", [["get", "growDuration", ["loc", [null, [16, 19], [16, 31]]]]], [], []], "growPixelsPerSecond", ["subexpr", "@mut", [["get", "growPixelsPerSecond", ["loc", [null, [17, 26], [17, 45]]]]], [], []], "growEasing", ["subexpr", "@mut", [["get", "growEasing", ["loc", [null, [18, 17], [18, 27]]]]], [], []], "enableGrowth", ["subexpr", "@mut", [["get", "enableGrowth", ["loc", [null, [19, 19], [19, 31]]]]], [], []]], 0, null, ["loc", [null, [13, 2], [32, 25]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 34,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-bind.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "containerless", ["loc", [null, [1, 6], [1, 19]]]]], [], 0, 1, ["loc", [null, [1, 0], [33, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/components/liquid-container", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 14
          }
        },
        "moduleName": "rose/templates/components/liquid-container.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "yield", [["get", "this", ["loc", [null, [1, 8], [1, 12]]]]], [], ["loc", [null, [1, 0], [1, 14]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("rose/templates/components/liquid-if", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 4,
                  "column": 4
                },
                "end": {
                  "line": 6,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-if.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["content", "yield", ["loc", [null, [5, 6], [5, 15]]]]],
            locals: [],
            templates: []
          };
        })();
        var child1 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 6,
                  "column": 4
                },
                "end": {
                  "line": 8,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-if.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
              return morphs;
            },
            statements: [["inline", "yield", [], ["to", "inverse"], ["loc", [null, [7, 6], [7, 28]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 9,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-if.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "if", [["get", "valueVersion", ["loc", [null, [4, 10], [4, 22]]]]], [], 0, 1, ["loc", [null, [4, 4], [8, 11]]]]],
          locals: ["valueVersion"],
          templates: [child0, child1]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 10,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-if.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "showFirstBlock", ["loc", [null, [2, 27], [2, 41]]]]], [], []], "name", ["subexpr", "@mut", [["get", "helperName", ["loc", [null, [2, 47], [2, 57]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [3, 27], [3, 30]]]]], [], []], "renderWhenFalse", ["subexpr", "hasBlock", ["inverse"], [], ["loc", [null, [3, 47], [3, 67]]]], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [3, 74], [3, 79]]]]], [], []]], 0, null, ["loc", [null, [2, 2], [9, 22]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 21,
                    "column": 6
                  },
                  "end": {
                    "line": 23,
                    "column": 6
                  }
                },
                "moduleName": "rose/templates/components/liquid-if.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                return morphs;
              },
              statements: [["content", "yield", ["loc", [null, [22, 8], [22, 17]]]]],
              locals: [],
              templates: []
            };
          })();
          var child1 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 23,
                    "column": 6
                  },
                  "end": {
                    "line": 25,
                    "column": 6
                  }
                },
                "moduleName": "rose/templates/components/liquid-if.hbs"
              },
              isEmpty: false,
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
                return morphs;
              },
              statements: [["inline", "yield", [], ["to", "inverse"], ["loc", [null, [24, 8], [24, 30]]]]],
              locals: [],
              templates: []
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 19,
                  "column": 4
                },
                "end": {
                  "line": 26,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-if.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["block", "if", [["get", "valueVersion", ["loc", [null, [21, 12], [21, 24]]]]], [], 0, 1, ["loc", [null, [21, 6], [25, 13]]]]],
            locals: ["valueVersion"],
            templates: [child0, child1]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 2
              },
              "end": {
                "line": 27,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-if.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "showFirstBlock", ["loc", [null, [19, 29], [19, 43]]]]], [], []], "notify", ["subexpr", "@mut", [["get", "container", ["loc", [null, [19, 51], [19, 60]]]]], [], []], "name", ["subexpr", "@mut", [["get", "helperName", ["loc", [null, [19, 66], [19, 76]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [20, 8], [20, 11]]]]], [], []], "renderWhenFalse", ["subexpr", "hasBlock", ["inverse"], [], ["loc", [null, [20, 28], [20, 48]]]]], 0, null, ["loc", [null, [19, 4], [26, 24]]]]],
          locals: ["container"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 0
            },
            "end": {
              "line": 28,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-if.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-container", [], ["id", ["subexpr", "@mut", [["get", "id", ["loc", [null, [12, 9], [12, 11]]]]], [], []], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [13, 12], [13, 17]]]]], [], []], "growDuration", ["subexpr", "@mut", [["get", "growDuration", ["loc", [null, [14, 19], [14, 31]]]]], [], []], "growPixelsPerSecond", ["subexpr", "@mut", [["get", "growPixelsPerSecond", ["loc", [null, [15, 26], [15, 45]]]]], [], []], "growEasing", ["subexpr", "@mut", [["get", "growEasing", ["loc", [null, [16, 17], [16, 27]]]]], [], []], "enableGrowth", ["subexpr", "@mut", [["get", "enableGrowth", ["loc", [null, [17, 19], [17, 31]]]]], [], []]], 0, null, ["loc", [null, [11, 2], [27, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 29,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-if.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "containerless", ["loc", [null, [1, 6], [1, 19]]]]], [], 0, 1, ["loc", [null, [1, 0], [28, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/components/liquid-modal", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-modal.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "role", "dialog");
            var el2 = dom.createTextNode("\n      ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n    ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(4);
            morphs[0] = dom.createAttrMorph(element0, 'class');
            morphs[1] = dom.createAttrMorph(element0, 'aria-labelledby');
            morphs[2] = dom.createAttrMorph(element0, 'aria-label');
            morphs[3] = dom.createMorphAt(element0, 1, 1);
            return morphs;
          },
          statements: [["attribute", "class", ["concat", ["lf-dialog ", ["get", "cc.options.dialogClass", ["loc", [null, [3, 28], [3, 50]]]]]]], ["attribute", "aria-labelledby", ["get", "cc.options.ariaLabelledBy", ["loc", [null, [3, 86], [3, 111]]]]], ["attribute", "aria-label", ["get", "cc.options.ariaLabel", ["loc", [null, [3, 127], [3, 147]]]]], ["inline", "lf-vue", [["get", "cc.view", ["loc", [null, [4, 15], [4, 22]]]]], ["dismiss", "dismiss"], ["loc", [null, [4, 6], [4, 42]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type", "multiple-nodes"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 8,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-modal.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 2, 2, contextualElement);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [["block", "lm-container", [], ["action", "escape", "clickAway", "outsideClick"], 0, null, ["loc", [null, [2, 2], [6, 19]]]], ["content", "lf-overlay", ["loc", [null, [7, 2], [7, 16]]]]],
        locals: ["cc"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 9,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-modal.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "liquid-versions", [], ["name", "liquid-modal", "value", ["subexpr", "@mut", [["get", "currentContext", ["loc", [null, [1, 45], [1, 59]]]]], [], []], "renderWhenFalse", false], 0, null, ["loc", [null, [1, 0], [8, 20]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/components/liquid-outlet", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 6
                },
                "end": {
                  "line": 17,
                  "column": 6
                }
              },
              "moduleName": "rose/templates/components/liquid-outlet.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "outlet", [["get", "outletName", ["loc", [null, [16, 17], [16, 27]]]]], [], ["loc", [null, [16, 8], [16, 29]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 19,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-outlet.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "set-outlet-state", [["get", "outletName", ["loc", [null, [15, 26], [15, 36]]]], ["get", "version.outletState", ["loc", [null, [15, 37], [15, 56]]]]], [], 0, null, ["loc", [null, [15, 6], [17, 28]]]]],
          locals: ["version"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 20,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-outlet.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-bind", [["get", "outletState", ["loc", [null, [2, 17], [2, 28]]]]], ["id", ["subexpr", "@mut", [["get", "id", ["loc", [null, [3, 9], [3, 11]]]]], [], []], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [4, 12], [4, 17]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [5, 10], [5, 13]]]]], [], []], "name", "liquid-outlet", "outletName", ["subexpr", "@mut", [["get", "outletName", ["loc", [null, [7, 17], [7, 27]]]]], [], []], "containerless", ["subexpr", "@mut", [["get", "containerless", ["loc", [null, [8, 20], [8, 33]]]]], [], []], "growDuration", ["subexpr", "@mut", [["get", "growDuration", ["loc", [null, [9, 19], [9, 31]]]]], [], []], "growPixelsPerSecond", ["subexpr", "@mut", [["get", "growPixelsPerSecond", ["loc", [null, [10, 26], [10, 45]]]]], [], []], "growEasing", ["subexpr", "@mut", [["get", "growEasing", ["loc", [null, [11, 17], [11, 27]]]]], [], []], "enableGrowth", ["subexpr", "@mut", [["get", "enableGrowth", ["loc", [null, [12, 19], [12, 31]]]]], [], []]], 0, null, ["loc", [null, [2, 2], [19, 20]]]]],
        locals: ["outletState"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 21,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-outlet.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "get-outlet-state", [["get", "outletName", ["loc", [null, [1, 21], [1, 31]]]]], [], 0, null, ["loc", [null, [1, 0], [20, 21]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/components/liquid-versions", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 3,
                  "column": 4
                },
                "end": {
                  "line": 5,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-versions.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "yield", [["get", "version.value", ["loc", [null, [4, 14], [4, 27]]]]], [], ["loc", [null, [4, 6], [4, 31]]]]],
            locals: [],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-versions.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "liquid-child", [], ["version", ["subexpr", "@mut", [["get", "version", ["loc", [null, [3, 28], [3, 35]]]]], [], []], "liquidChildDidRender", "childDidRender", "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [3, 80], [3, 85]]]]], [], []]], 0, null, ["loc", [null, [3, 4], [5, 21]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-versions.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "version.shouldRender", ["loc", [null, [2, 8], [2, 28]]]]], [], 0, null, ["loc", [null, [2, 2], [6, 9]]]]],
        locals: ["version"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-versions.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "each", [["get", "versions", ["loc", [null, [1, 8], [1, 16]]]]], ["key", "@identity"], 0, null, ["loc", [null, [1, 0], [7, 9]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/components/liquid-with", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 4,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-with.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["inline", "yield", [["get", "version", ["loc", [null, [3, 13], [3, 20]]]]], [], ["loc", [null, [3, 4], [3, 24]]]]],
          locals: ["version"],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["wrong-type"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-with.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "attrs.value", ["loc", [null, [2, 28], [2, 39]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [2, 44], [2, 47]]]]], [], []], "name", ["subexpr", "@mut", [["get", "name", ["loc", [null, [2, 53], [2, 57]]]]], [], []], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [2, 64], [2, 69]]]]], [], []]], 0, null, ["loc", [null, [2, 2], [4, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 14,
                  "column": 4
                },
                "end": {
                  "line": 16,
                  "column": 4
                }
              },
              "moduleName": "rose/templates/components/liquid-with.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [["inline", "yield", [["get", "version", ["loc", [null, [15, 15], [15, 22]]]]], [], ["loc", [null, [15, 6], [15, 26]]]]],
            locals: ["version"],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 6,
                "column": 2
              },
              "end": {
                "line": 17,
                "column": 2
              }
            },
            "moduleName": "rose/templates/components/liquid-with.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [["block", "liquid-versions", [], ["value", ["subexpr", "@mut", [["get", "attrs.value", ["loc", [null, [14, 30], [14, 41]]]]], [], []], "notify", ["subexpr", "@mut", [["get", "container", ["loc", [null, [14, 49], [14, 58]]]]], [], []], "use", ["subexpr", "@mut", [["get", "use", ["loc", [null, [14, 63], [14, 66]]]]], [], []], "name", ["subexpr", "@mut", [["get", "name", ["loc", [null, [14, 72], [14, 76]]]]], [], []]], 0, null, ["loc", [null, [14, 4], [16, 25]]]]],
          locals: ["container"],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 18,
              "column": 0
            }
          },
          "moduleName": "rose/templates/components/liquid-with.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "liquid-container", [], ["id", ["subexpr", "@mut", [["get", "id", ["loc", [null, [7, 9], [7, 11]]]]], [], []], "class", ["subexpr", "@mut", [["get", "class", ["loc", [null, [8, 12], [8, 17]]]]], [], []], "growDuration", ["subexpr", "@mut", [["get", "growDuration", ["loc", [null, [9, 19], [9, 31]]]]], [], []], "growPixelsPerSecond", ["subexpr", "@mut", [["get", "growPixelsPerSecond", ["loc", [null, [10, 26], [10, 45]]]]], [], []], "growEasing", ["subexpr", "@mut", [["get", "growEasing", ["loc", [null, [11, 17], [11, 27]]]]], [], []], "enableGrowth", ["subexpr", "@mut", [["get", "enableGrowth", ["loc", [null, [12, 19], [12, 31]]]]], [], []]], 0, null, ["loc", [null, [6, 2], [17, 23]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/liquid-with.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "if", [["get", "containerless", ["loc", [null, [1, 6], [1, 19]]]]], [], 0, 1, ["loc", [null, [1, 0], [18, 7]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/components/page-numbers", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 3,
              "column": 4
            },
            "end": {
              "line": 7,
              "column": 4
            }
          },
          "moduleName": "rose/templates/components/page-numbers.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "arrow prev enabled-arrow");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "#");
          var el3 = dom.createTextNode("«");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element4 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element4);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", -1], [], ["loc", [null, [5, 20], [5, 49]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 7,
              "column": 4
            },
            "end": {
              "line": 11,
              "column": 4
            }
          },
          "moduleName": "rose/templates/components/page-numbers.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "arrow prev disabled");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "#");
          var el3 = dom.createTextNode("«");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element3 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element3);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", -1], [], ["loc", [null, [9, 20], [9, 49]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 14,
                "column": 6
              },
              "end": {
                "line": 18,
                "column": 6
              }
            },
            "moduleName": "rose/templates/components/page-numbers.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            dom.setAttribute(el1, "class", "dots disabled");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("span");
            var el3 = dom.createTextNode("...");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes() {
            return [];
          },
          statements: [],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 19,
                "column": 6
              },
              "end": {
                "line": 23,
                "column": 6
              }
            },
            "moduleName": "rose/templates/components/page-numbers.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            dom.setAttribute(el1, "class", "active page-number");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("a");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]), 0, 0);
            return morphs;
          },
          statements: [["content", "item.page", ["loc", [null, [21, 13], [21, 26]]]]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 23,
                "column": 6
              },
              "end": {
                "line": 27,
                "column": 6
              }
            },
            "moduleName": "rose/templates/components/page-numbers.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            dom.setAttribute(el1, "class", "page-number");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("a");
            dom.setAttribute(el2, "href", "#");
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element2 = dom.childAt(fragment, [1, 1]);
            var morphs = new Array(2);
            morphs[0] = dom.createElementMorph(element2);
            morphs[1] = dom.createMorphAt(element2, 0, 0);
            return morphs;
          },
          statements: [["element", "action", ["pageClicked", ["get", "item.page", ["loc", [null, [25, 45], [25, 54]]]]], [], ["loc", [null, [25, 22], [25, 56]]]], ["content", "item.page", ["loc", [null, [25, 57], [25, 70]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 4
            },
            "end": {
              "line": 28,
              "column": 4
            }
          },
          "moduleName": "rose/templates/components/page-numbers.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          morphs[1] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "if", [["get", "item.dots", ["loc", [null, [14, 12], [14, 21]]]]], [], 0, null, ["loc", [null, [14, 6], [18, 13]]]], ["block", "if", [["get", "item.current", ["loc", [null, [19, 12], [19, 24]]]]], [], 1, 2, ["loc", [null, [19, 6], [27, 13]]]]],
        locals: ["item"],
        templates: [child0, child1, child2]
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 30,
              "column": 4
            },
            "end": {
              "line": 34,
              "column": 4
            }
          },
          "moduleName": "rose/templates/components/page-numbers.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "arrow next enabled-arrow");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "#");
          var el3 = dom.createTextNode("»");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element1);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", 1], [], ["loc", [null, [32, 20], [32, 48]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 34,
              "column": 4
            },
            "end": {
              "line": 38,
              "column": 4
            }
          },
          "moduleName": "rose/templates/components/page-numbers.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1, "class", "arrow next disabled");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "href", "#");
          var el3 = dom.createTextNode("»");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element0);
          return morphs;
        },
        statements: [["element", "action", ["incrementPage", 1], [], ["loc", [null, [36, 20], [36, 48]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 41,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/page-numbers.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "pagination-centered");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        dom.setAttribute(el2, "class", "pagination");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element5 = dom.childAt(fragment, [0, 1]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element5, 1, 1);
        morphs[1] = dom.createMorphAt(element5, 3, 3);
        morphs[2] = dom.createMorphAt(element5, 5, 5);
        return morphs;
      },
      statements: [["block", "if", [["get", "canStepBackward", ["loc", [null, [3, 10], [3, 25]]]]], [], 0, 1, ["loc", [null, [3, 4], [11, 11]]]], ["block", "each", [["get", "pageItems", ["loc", [null, [13, 12], [13, 21]]]]], [], 2, null, ["loc", [null, [13, 4], [28, 13]]]], ["block", "if", [["get", "canStepForward", ["loc", [null, [30, 10], [30, 24]]]]], [], 3, 4, ["loc", [null, [30, 4], [38, 11]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4]
    };
  })());
});
define("rose/templates/components/ui-checkbox", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/ui-checkbox.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("input");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("label");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        if (this.cachedFragment) {
          dom.repairClonedNode(element0, [], true);
        }
        var morphs = new Array(5);
        morphs[0] = dom.createAttrMorph(element0, 'type');
        morphs[1] = dom.createAttrMorph(element0, 'name');
        morphs[2] = dom.createAttrMorph(element0, 'checked');
        morphs[3] = dom.createAttrMorph(element0, 'data-id');
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [2]), 0, 0);
        return morphs;
      },
      statements: [["attribute", "type", ["get", "type", ["loc", [null, [1, 14], [1, 18]]]]], ["attribute", "name", ["get", "name", ["loc", [null, [1, 28], [1, 32]]]]], ["attribute", "checked", ["get", "checked", ["loc", [null, [1, 45], [1, 52]]]]], ["attribute", "data-id", ["get", "data-id", ["loc", [null, [1, 65], [1, 72]]]]], ["content", "label", ["loc", [null, [2, 7], [2, 16]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("rose/templates/components/ui-radio", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/ui-radio.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("input");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("label");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        if (this.cachedFragment) {
          dom.repairClonedNode(element0, [], true);
        }
        var morphs = new Array(6);
        morphs[0] = dom.createAttrMorph(element0, 'type');
        morphs[1] = dom.createAttrMorph(element0, 'name');
        morphs[2] = dom.createAttrMorph(element0, 'checked');
        morphs[3] = dom.createAttrMorph(element0, 'disabled');
        morphs[4] = dom.createAttrMorph(element0, 'data-id');
        morphs[5] = dom.createMorphAt(dom.childAt(fragment, [2]), 0, 0);
        return morphs;
      },
      statements: [["attribute", "type", ["get", "type", ["loc", [null, [1, 14], [1, 18]]]]], ["attribute", "name", ["get", "name", ["loc", [null, [1, 28], [1, 32]]]]], ["attribute", "checked", ["get", "checked", ["loc", [null, [1, 45], [1, 52]]]]], ["attribute", "disabled", ["get", "readonly", ["loc", [null, [1, 66], [1, 74]]]]], ["attribute", "data-id", ["get", "data-id", ["loc", [null, [1, 87], [1, 94]]]]], ["content", "label", ["loc", [null, [2, 7], [2, 16]]]]],
      locals: [],
      templates: []
    };
  })());
});
define("rose/templates/data-converter", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 11,
              "column": 8
            },
            "end": {
              "line": 17,
              "column": 8
            }
          },
          "moduleName": "rose/templates/data-converter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            Select file...\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() {
          return [];
        },
        statements: [],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 26,
                "column": 12
              },
              "end": {
                "line": 30,
                "column": 12
              }
            },
            "moduleName": "rose/templates/data-converter.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "item");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element0, 'data-id');
            morphs[1] = dom.createMorphAt(element0, 1, 1);
            return morphs;
          },
          statements: [["attribute", "data-id", ["concat", [["get", "table", ["loc", [null, [27, 41], [27, 46]]]]]]], ["content", "table", ["loc", [null, [28, 16], [28, 25]]]]],
          locals: ["table"],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 22,
              "column": 8
            },
            "end": {
              "line": 32,
              "column": 8
            }
          },
          "moduleName": "rose/templates/data-converter.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "default text");
          var el2 = dom.createTextNode("Select an item");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "dropdown icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "menu");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [5]), 1, 1);
          return morphs;
        },
        statements: [["block", "each", [["get", "tables", ["loc", [null, [26, 20], [26, 26]]]]], [], 0, null, ["loc", [null, [26, 12], [30, 21]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 46,
            "column": 0
          }
        },
        "moduleName": "rose/templates/data-converter.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "file excel outline icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui form");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("Table");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("CSV");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3, "class", "ui primary button");
        var el4 = dom.createTextNode("\n            Download as CSV\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0, 3]);
        var element2 = dom.childAt(fragment, [2]);
        var element3 = dom.childAt(element2, [7, 1]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(element1, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [1]), 1, 1);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [3]), 3, 3);
        morphs[4] = dom.createMorphAt(dom.childAt(element2, [5]), 3, 3);
        morphs[5] = dom.createElementMorph(element3);
        return morphs;
      },
      statements: [["inline", "t", ["dataConverter.title"], [], ["loc", [null, [4, 4], [4, 31]]]], ["inline", "t", ["dataConverter.subtitle"], [], ["loc", [null, [5, 28], [5, 58]]]], ["block", "file-picker", [], ["fileLoaded", "fileLoaded", "preview", false, "dropzone", false, "readAs", "readAsText", "class", "ui primary button"], 0, null, ["loc", [null, [11, 8], [17, 24]]]], ["block", "ui-dropdown", [], ["class", "selection", "onChange", ["subexpr", "action", ["updateSelected"], [], ["loc", [null, [22, 50], [22, 75]]]]], 1, null, ["loc", [null, [22, 8], [32, 24]]]], ["inline", "textarea", [], ["value", ["subexpr", "@mut", [["get", "csvtext", ["loc", [null, [37, 25], [37, 32]]]]], [], []]], ["loc", [null, [37, 8], [37, 34]]]], ["element", "action", ["download"], [], ["loc", [null, [41, 42], [41, 63]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/debug-log", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "rose/templates/debug-log.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [10, 26], [10, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [10, 2], [12, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 24,
              "column": 4
            },
            "end": {
              "line": 30,
              "column": 4
            }
          },
          "moduleName": "rose/templates/debug-log.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("tr");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [5]), 0, 0);
          return morphs;
        },
        statements: [["inline", "moment-format", [["get", "log.date", ["loc", [null, [26, 26], [26, 34]]]], "LLL"], [], ["loc", [null, [26, 10], [26, 42]]]], ["content", "log.message", ["loc", [null, [27, 10], [27, 25]]]], ["content", "log.module", ["loc", [null, [28, 10], [28, 24]]]]],
        locals: ["log"],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 34,
            "column": 0
          }
        },
        "moduleName": "rose/templates/debug-log.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("table");
        dom.setAttribute(el1, "class", "ui celled table");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("thead");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tbody");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0, 3]);
        var element2 = dom.childAt(fragment, [4]);
        var element3 = dom.childAt(element2, [1, 1]);
        var morphs = new Array(7);
        morphs[0] = dom.createMorphAt(element1, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[3] = dom.createMorphAt(dom.childAt(element3, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element3, [3]), 0, 0);
        morphs[5] = dom.createMorphAt(dom.childAt(element3, [5]), 0, 0);
        morphs[6] = dom.createMorphAt(dom.childAt(element2, [3]), 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["debugLog.title"], [], ["loc", [null, [4, 4], [4, 26]]]], ["inline", "t", ["debugLog.subtitle"], [], ["loc", [null, [5, 28], [5, 53]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [9, 6], [9, 18]]]]], [], 0, null, ["loc", [null, [9, 0], [13, 7]]]], ["inline", "t", ["debugLog.date"], [], ["loc", [null, [18, 10], [18, 31]]]], ["inline", "t", ["debugLog.message"], [], ["loc", [null, [19, 10], [19, 34]]]], ["inline", "t", ["debugLog.module"], [], ["loc", [null, [20, 10], [20, 33]]]], ["block", "each", [["get", "pagedContent", ["loc", [null, [24, 12], [24, 24]]]]], [], 1, null, ["loc", [null, [24, 4], [30, 13]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define("rose/templates/diary", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 24,
              "column": 0
            },
            "end": {
              "line": 28,
              "column": 0
            }
          },
          "moduleName": "rose/templates/diary.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [25, 26], [25, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [25, 2], [27, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 31,
              "column": 2
            },
            "end": {
              "line": 33,
              "column": 2
            }
          },
          "moduleName": "rose/templates/diary.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "diary-entry", [], ["model", ["subexpr", "@mut", [["get", "entry", ["loc", [null, [32, 24], [32, 29]]]]], [], []]], ["loc", [null, [32, 4], [32, 31]]]]],
        locals: ["entry"],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 33,
              "column": 2
            },
            "end": {
              "line": 35,
              "column": 2
            }
          },
          "moduleName": "rose/templates/diary.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "no-data-message", ["loc", [null, [34, 4], [34, 23]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 37,
            "column": 0
          }
        },
        "moduleName": "rose/templates/diary.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "book icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2, "class", "ui button");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui comments");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var element1 = dom.childAt(fragment, [2]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element1, [5]);
        var morphs = new Array(10);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [1]), 1, 1);
        morphs[3] = dom.createAttrMorph(element2, 'class');
        morphs[4] = dom.createElementMorph(element2);
        morphs[5] = dom.createMorphAt(element2, 1, 1);
        morphs[6] = dom.createElementMorph(element3);
        morphs[7] = dom.createMorphAt(element3, 1, 1);
        morphs[8] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        morphs[9] = dom.createMorphAt(dom.childAt(fragment, [8]), 1, 1);
        return morphs;
      },
      statements: [["inline", "t", ["diary.title"], [], ["loc", [null, [4, 4], [4, 23]]]], ["inline", "t", ["diary.subtitle"], [], ["loc", [null, [5, 28], [5, 50]]]], ["inline", "textarea", [], ["value", ["subexpr", "@mut", [["get", "diaryInput", ["loc", [null, [11, 21], [11, 31]]]]], [], []]], ["loc", [null, [11, 4], [11, 33]]]], ["attribute", "class", ["concat", ["ui primary button ", ["subexpr", "if", [["get", "diaryInputIsEmpty", ["loc", [null, [14, 40], [14, 57]]]], "disabled"], [], ["loc", [null, [14, 35], [14, 70]]]]]]], ["element", "action", ["save"], [], ["loc", [null, [14, 72], [14, 89]]]], ["inline", "t", ["action.save"], [], ["loc", [null, [15, 4], [15, 23]]]], ["element", "action", ["cancel"], [], ["loc", [null, [17, 28], [17, 47]]]], ["inline", "t", ["action.cancel"], [], ["loc", [null, [18, 4], [18, 25]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [24, 6], [24, 18]]]]], [], 0, null, ["loc", [null, [24, 0], [28, 7]]]], ["block", "each", [["get", "pagedContent", ["loc", [null, [31, 10], [31, 22]]]]], [], 1, 2, ["loc", [null, [31, 2], [35, 11]]]]],
      locals: [],
      templates: [child0, child1, child2]
    };
  })());
});
define("rose/templates/extracts", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "rose/templates/extracts.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [10, 26], [10, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [10, 2], [12, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 17,
                "column": 4
              },
              "end": {
                "line": 19,
                "column": 4
              }
            },
            "moduleName": "rose/templates/extracts.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "rose-extract", [], ["model", ["subexpr", "@mut", [["get", "extract", ["loc", [null, [18, 25], [18, 32]]]]], [], []]], ["loc", [null, [18, 4], [18, 34]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 16,
              "column": 2
            },
            "end": {
              "line": 20,
              "column": 2
            }
          },
          "moduleName": "rose/templates/extracts.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "unless", [["get", "extract.isDeleted", ["loc", [null, [17, 14], [17, 31]]]]], [], 0, null, ["loc", [null, [17, 4], [19, 15]]]]],
        locals: ["extract"],
        templates: [child0]
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 2
            },
            "end": {
              "line": 22,
              "column": 2
            }
          },
          "moduleName": "rose/templates/extracts.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "no-data-message", ["loc", [null, [21, 4], [21, 23]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 25,
              "column": 0
            },
            "end": {
              "line": 29,
              "column": 0
            }
          },
          "moduleName": "rose/templates/extracts.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [26, 26], [26, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [26, 2], [28, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 30,
            "column": 0
          }
        },
        "moduleName": "rose/templates/extracts.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui comments");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[3] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
        morphs[4] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["extracts.title"], [], ["loc", [null, [4, 4], [4, 26]]]], ["inline", "t", ["extracts.subtitle"], [], ["loc", [null, [5, 28], [5, 53]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [9, 6], [9, 18]]]]], [], 0, null, ["loc", [null, [9, 0], [13, 7]]]], ["block", "each", [["get", "pagedContent", ["loc", [null, [16, 10], [16, 22]]]]], [], 1, 2, ["loc", [null, [16, 2], [22, 11]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [25, 6], [25, 18]]]]], [], 3, null, ["loc", [null, [25, 0], [29, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("rose/templates/help", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 75,
              "column": 0
            }
          },
          "moduleName": "rose/templates/help.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "title");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "dropdown icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(16);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 3, 3);
          morphs[1] = dom.createUnsafeMorphAt(dom.childAt(fragment, [3, 1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(fragment, [5]), 3, 3);
          morphs[3] = dom.createUnsafeMorphAt(dom.childAt(fragment, [7, 1]), 0, 0);
          morphs[4] = dom.createMorphAt(dom.childAt(fragment, [9]), 3, 3);
          morphs[5] = dom.createUnsafeMorphAt(dom.childAt(fragment, [11, 1]), 0, 0);
          morphs[6] = dom.createMorphAt(dom.childAt(fragment, [13]), 3, 3);
          morphs[7] = dom.createUnsafeMorphAt(dom.childAt(fragment, [15, 1]), 0, 0);
          morphs[8] = dom.createMorphAt(dom.childAt(fragment, [17]), 3, 3);
          morphs[9] = dom.createUnsafeMorphAt(dom.childAt(fragment, [19, 1]), 0, 0);
          morphs[10] = dom.createMorphAt(dom.childAt(fragment, [21]), 3, 3);
          morphs[11] = dom.createUnsafeMorphAt(dom.childAt(fragment, [23, 1]), 0, 0);
          morphs[12] = dom.createMorphAt(dom.childAt(fragment, [25]), 3, 3);
          morphs[13] = dom.createUnsafeMorphAt(dom.childAt(fragment, [27, 1]), 0, 0);
          morphs[14] = dom.createMorphAt(dom.childAt(fragment, [29]), 3, 3);
          morphs[15] = dom.createUnsafeMorphAt(dom.childAt(fragment, [31, 1]), 0, 0);
          return morphs;
        },
        statements: [["inline", "t", ["help.issue1.question"], [], ["loc", [null, [13, 4], [13, 32]]]], ["inline", "t", ["help.issue1.answer"], [], ["loc", [null, [16, 7], [16, 35]]]], ["inline", "t", ["help.issue2.question"], [], ["loc", [null, [21, 4], [21, 32]]]], ["inline", "t", ["help.issue2.answer"], [], ["loc", [null, [24, 7], [24, 35]]]], ["inline", "t", ["help.issue3.question"], [], ["loc", [null, [29, 4], [29, 32]]]], ["inline", "t", ["help.issue3.answer"], [], ["loc", [null, [32, 7], [32, 35]]]], ["inline", "t", ["help.issue4.question"], [], ["loc", [null, [37, 4], [37, 32]]]], ["inline", "t", ["help.issue4.answer"], [], ["loc", [null, [40, 7], [40, 35]]]], ["inline", "t", ["help.issue5.question"], [], ["loc", [null, [45, 4], [45, 32]]]], ["inline", "t", ["help.issue5.answer"], [], ["loc", [null, [48, 7], [48, 35]]]], ["inline", "t", ["help.issue6.question"], [], ["loc", [null, [53, 4], [53, 32]]]], ["inline", "t", ["help.issue6.answer"], [], ["loc", [null, [56, 7], [56, 35]]]], ["inline", "t", ["help.issue7.question"], [], ["loc", [null, [61, 4], [61, 32]]]], ["inline", "t", ["help.issue7.answer"], [], ["loc", [null, [64, 7], [64, 35]]]], ["inline", "t", ["help.issue8.question"], [], ["loc", [null, [69, 4], [69, 32]]]], ["inline", "t", ["help.issue8.answer"], [], ["loc", [null, [72, 7], [72, 35]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 76,
            "column": 0
          }
        },
        "moduleName": "rose/templates/help.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "question icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["help.title"], [], ["loc", [null, [4, 4], [4, 22]]]], ["inline", "t", ["help.subtitle"], [], ["loc", [null, [5, 28], [5, 49]]]], ["block", "ui-accordion", [], [], 0, null, ["loc", [null, [9, 0], [75, 17]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/index", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 27,
              "column": 0
            },
            "end": {
              "line": 41,
              "column": 0
            }
          },
          "moduleName": "rose/templates/index.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui four statistics");
          dom.setAttribute(el1, "style", "margin-top:2em; margin-bottom: -1em;");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "statistic");
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "value");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("i");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3, "class", "label");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [0]);
          var element1 = dom.childAt(element0, [1]);
          var element2 = dom.childAt(element1, [1, 1]);
          var morphs = new Array(5);
          morphs[0] = dom.createAttrMorph(element2, 'class');
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]), 1, 1);
          morphs[2] = dom.createMorphAt(element0, 3, 3);
          morphs[3] = dom.createMorphAt(element0, 5, 5);
          morphs[4] = dom.createMorphAt(element0, 7, 7);
          return morphs;
        },
        statements: [["attribute", "class", ["concat", [["get", "network.name", ["loc", [null, [31, 24], [31, 36]]]], " icon"]]], ["content", "network.descriptiveName", ["loc", [null, [34, 12], [34, 39]]]], ["inline", "statistic-item", [], ["label", "index.comments", "network", ["subexpr", "@mut", [["get", "network.name", ["loc", [null, [37, 52], [37, 64]]]]], [], []], "data", ["subexpr", "@mut", [["get", "model.comments", ["loc", [null, [37, 70], [37, 84]]]]], [], []]], ["loc", [null, [37, 4], [37, 86]]]], ["inline", "statistic-item", [], ["label", "index.interactions", "network", ["subexpr", "@mut", [["get", "network.name", ["loc", [null, [38, 56], [38, 68]]]]], [], []], "data", ["subexpr", "@mut", [["get", "model.interactions", ["loc", [null, [38, 74], [38, 92]]]]], [], []]], ["loc", [null, [38, 4], [38, 94]]]], ["inline", "statistic-item", [], ["label", "index.extracts", "network", ["subexpr", "@mut", [["get", "network.name", ["loc", [null, [39, 52], [39, 64]]]]], [], []], "data", ["subexpr", "@mut", [["get", "model.extracts", ["loc", [null, [39, 70], [39, 84]]]]], [], []]], ["loc", [null, [39, 4], [39, 86]]]]],
        locals: ["network"],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 42,
            "column": 0
          }
        },
        "moduleName": "rose/templates/index.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h1");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "dashboard icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        dom.setAttribute(el2, "class", "ui center aligned icon header");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("i");
        dom.setAttribute(el3, "class", "power icon");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "fields");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "four wide field");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "eight wide field");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element3 = dom.childAt(fragment, [0, 3]);
        var element4 = dom.childAt(fragment, [2]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(element3, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element3, [3]), 0, 0);
        morphs[2] = dom.createAttrMorph(element4, 'class');
        morphs[3] = dom.createMorphAt(dom.childAt(element4, [1]), 3, 3);
        morphs[4] = dom.createMorphAt(dom.childAt(element4, [3, 3]), 1, 1);
        morphs[5] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["index.title"], [], ["loc", [null, [4, 8], [4, 27]]]], ["inline", "t", ["index.subtitle"], [], ["loc", [null, [5, 32], [5, 54]]]], ["attribute", "class", ["concat", ["ui form ", ["get", "updateResult", ["loc", [null, [9, 22], [9, 34]]]]]]], ["inline", "t", ["index.trackingEnabledHeader"], [], ["loc", [null, [12, 6], [12, 41]]]], ["inline", "ui-checkbox", [], ["class", "toggle", "checked", ["subexpr", "@mut", [["get", "settings.user.trackingEnabled", ["loc", [null, [18, 34], [18, 63]]]]], [], []], "label", ["subexpr", "@mut", [["get", "trackingEnabledLabel", ["loc", [null, [19, 32], [19, 52]]]]], [], []], "onChange", ["subexpr", "action", ["toggleTracking"], [], ["loc", [null, [20, 35], [20, 60]]]]], ["loc", [null, [17, 12], [20, 62]]]], ["block", "each", [["get", "networks", ["loc", [null, [27, 8], [27, 16]]]]], [], 0, null, ["loc", [null, [27, 0], [41, 9]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/interactions", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 9,
              "column": 0
            },
            "end": {
              "line": 13,
              "column": 0
            }
          },
          "moduleName": "rose/templates/interactions.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [10, 26], [10, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [10, 2], [12, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 17,
                "column": 4
              },
              "end": {
                "line": 19,
                "column": 4
              }
            },
            "moduleName": "rose/templates/interactions.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "rose-interaction", [], ["model", ["subexpr", "@mut", [["get", "interaction", ["loc", [null, [18, 29], [18, 40]]]]], [], []]], ["loc", [null, [18, 4], [18, 42]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 16,
              "column": 2
            },
            "end": {
              "line": 20,
              "column": 2
            }
          },
          "moduleName": "rose/templates/interactions.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [["block", "unless", [["get", "interaction.isDeleted", ["loc", [null, [17, 14], [17, 35]]]]], [], 0, null, ["loc", [null, [17, 4], [19, 15]]]]],
        locals: ["interaction"],
        templates: [child0]
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 20,
              "column": 2
            },
            "end": {
              "line": 22,
              "column": 2
            }
          },
          "moduleName": "rose/templates/interactions.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["content", "no-data-message", ["loc", [null, [21, 4], [21, 23]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 26,
              "column": 0
            },
            "end": {
              "line": 30,
              "column": 0
            }
          },
          "moduleName": "rose/templates/interactions.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "page-numbers", [], ["content", ["subexpr", "@mut", [["get", "pagedContent", ["loc", [null, [27, 26], [27, 38]]]]], [], []], "numPagesToShow", 5, "showFL", true], ["loc", [null, [27, 2], [29, 31]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 31,
            "column": 0
          }
        },
        "moduleName": "rose/templates/interactions.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui comments");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(element0, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        morphs[3] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
        morphs[4] = dom.createMorphAt(fragment, 6, 6, contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["inline", "t", ["interactions.title"], [], ["loc", [null, [4, 4], [4, 30]]]], ["inline", "t", ["interactions.subtitle"], [], ["loc", [null, [5, 28], [5, 57]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [9, 6], [9, 18]]]]], [], 0, null, ["loc", [null, [9, 0], [13, 7]]]], ["block", "each", [["get", "pagedContent", ["loc", [null, [16, 10], [16, 22]]]]], [], 1, 2, ["loc", [null, [16, 2], [22, 11]]]], ["block", "if", [["get", "pagedContent", ["loc", [null, [26, 6], [26, 18]]]]], [], 3, null, ["loc", [null, [26, 0], [30, 7]]]]],
      locals: [],
      templates: [child0, child1, child2, child3]
    };
  })());
});
define("rose/templates/modal/reset-config", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["multiple-nodes"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 18,
              "column": 0
            }
          },
          "moduleName": "rose/templates/modal/reset-config.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "close icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "header");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "actions");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui black cancel button");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui positive right labeled icon button");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.setAttribute(el3, "class", "checkmark icon");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [6]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [4, 1]), 0, 0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [1]), 1, 1);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [3]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["resetConfigModal.question"], [], ["loc", [null, [4, 2], [4, 35]]]], ["inline", "t", ["resetConfigModal.warning"], [], ["loc", [null, [7, 5], [7, 37]]]], ["inline", "t", ["action.cancel"], [], ["loc", [null, [11, 4], [11, 25]]]], ["inline", "t", ["action.confirm"], [], ["loc", [null, [14, 4], [14, 26]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "rose/templates/modal/reset-config.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "ui-modal", [], ["class", "reset-config", "onApprove", ["subexpr", "action", ["approveModal"], [], ["loc", [null, [1, 43], [1, 66]]]]], 0, null, ["loc", [null, [1, 0], [18, 13]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/modal/reset-data", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": {
            "name": "missing-wrapper",
            "problems": ["multiple-nodes"]
          },
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 17,
              "column": 0
            }
          },
          "moduleName": "rose/templates/modal/reset-data.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "close icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "header");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "content");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "actions");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui black button");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui positive button");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [6]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [4]), 1, 1);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [1]), 1, 1);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [3]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["resetDataModal.question"], [], ["loc", [null, [4, 2], [4, 33]]]], ["inline", "t", ["resetDataModal.warning"], [], ["loc", [null, [7, 2], [7, 32]]]], ["inline", "t", ["action.cancel"], [], ["loc", [null, [11, 4], [11, 25]]]], ["inline", "t", ["action.confirm"], [], ["loc", [null, [14, 4], [14, 26]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 18,
            "column": 0
          }
        },
        "moduleName": "rose/templates/modal/reset-data.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [["block", "ui-modal", [], ["class", "reset-data", "onApprove", ["subexpr", "action", ["approveModal"], [], ["loc", [null, [1, 41], [1, 64]]]]], 0, null, ["loc", [null, [1, 0], [17, 13]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/observer", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 39,
              "column": 2
            },
            "end": {
              "line": 61,
              "column": 2
            }
          },
          "moduleName": "rose/templates/observer.hbs"
        },
        isEmpty: false,
        arity: 2,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          dom.setAttribute(el1, "class", "ui dividing header");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "content");
          var el3 = dom.createTextNode("Pattern #");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui red horizontal label");
          dom.setAttribute(el2, "style", "float: right");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.setAttribute(el3, "class", "remove icon");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n      Remove\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createTextNode("node");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createTextNode("parent");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createTextNode("extractor");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [3]);
          var morphs = new Array(5);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]), 1, 1);
          morphs[1] = dom.createElementMorph(element1);
          morphs[2] = dom.createMorphAt(dom.childAt(fragment, [3]), 3, 3);
          morphs[3] = dom.createMorphAt(dom.childAt(fragment, [5]), 3, 3);
          morphs[4] = dom.createMorphAt(dom.childAt(fragment, [7]), 3, 3);
          return morphs;
        },
        statements: [["content", "index", ["loc", [null, [41, 38], [41, 47]]]], ["element", "action", ["removePattern", ["get", "pattern", ["loc", [null, [42, 87], [42, 94]]]]], [], ["loc", [null, [42, 62], [42, 96]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "pattern.node", ["loc", [null, [49, 18], [49, 30]]]]], [], []]], ["loc", [null, [49, 4], [49, 32]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "pattern.parent", ["loc", [null, [54, 18], [54, 32]]]]], [], []]], ["loc", [null, [54, 4], [54, 34]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "pattern.extractor", ["loc", [null, [59, 18], [59, 35]]]]], [], []]], ["loc", [null, [59, 4], [59, 37]]]]],
        locals: ["pattern", "index"],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 67,
            "column": 0
          }
        },
        "moduleName": "rose/templates/observer.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "ui warning message");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "header");
        var el4 = dom.createTextNode("You have unsaved changes!");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("name");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("network");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("type");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("priority");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createTextNode("version");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2, "class", "ui primary button");
        var el3 = dom.createTextNode("Save");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2, "class", "ui button");
        var el3 = dom.createTextNode("Discard");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2, "class", "ui secondary button");
        var el3 = dom.createTextNode("Add Pattern");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0, 3]);
        var element3 = dom.childAt(fragment, [2]);
        var element4 = dom.childAt(element3, [15]);
        var element5 = dom.childAt(element3, [17]);
        var element6 = dom.childAt(element3, [19]);
        var morphs = new Array(12);
        morphs[0] = dom.createMorphAt(element2, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element2, [3]), 0, 0);
        morphs[2] = dom.createAttrMorph(element3, 'class');
        morphs[3] = dom.createMorphAt(dom.childAt(element3, [3]), 3, 3);
        morphs[4] = dom.createMorphAt(dom.childAt(element3, [5]), 3, 3);
        morphs[5] = dom.createMorphAt(dom.childAt(element3, [7]), 3, 3);
        morphs[6] = dom.createMorphAt(dom.childAt(element3, [9]), 3, 3);
        morphs[7] = dom.createMorphAt(dom.childAt(element3, [11]), 3, 3);
        morphs[8] = dom.createMorphAt(element3, 13, 13);
        morphs[9] = dom.createElementMorph(element4);
        morphs[10] = dom.createElementMorph(element5);
        morphs[11] = dom.createElementMorph(element6);
        return morphs;
      },
      statements: [["content", "model.name", ["loc", [null, [4, 4], [4, 18]]]], ["content", "model.description", ["loc", [null, [5, 28], [5, 49]]]], ["attribute", "class", ["concat", ["ui form ", ["subexpr", "if", [["get", "model.hasDirtyAttributes", ["loc", [null, [9, 26], [9, 50]]]], "warning"], [], ["loc", [null, [9, 21], [9, 62]]]]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.name", ["loc", [null, [16, 18], [16, 28]]]]], [], []]], ["loc", [null, [16, 4], [16, 30]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.network", ["loc", [null, [21, 18], [21, 31]]]]], [], []]], ["loc", [null, [21, 4], [21, 33]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.type", ["loc", [null, [26, 18], [26, 28]]]]], [], []]], ["loc", [null, [26, 4], [26, 30]]]], ["inline", "input", [], ["type", "number", "value", ["subexpr", "@mut", [["get", "model.priority", ["loc", [null, [31, 32], [31, 46]]]]], [], []]], ["loc", [null, [31, 4], [31, 48]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.version", ["loc", [null, [36, 18], [36, 31]]]]], [], []]], ["loc", [null, [36, 4], [36, 33]]]], ["block", "each", [["get", "model.patterns", ["loc", [null, [39, 10], [39, 24]]]]], [], 0, null, ["loc", [null, [39, 2], [61, 11]]]], ["element", "action", ["save"], [], ["loc", [null, [63, 36], [63, 53]]]], ["element", "action", ["discard"], [], ["loc", [null, [64, 28], [64, 48]]]], ["element", "action", ["addPattern"], [], ["loc", [null, [65, 38], [65, 61]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/observers", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 19,
                "column": 10
              },
              "end": {
                "line": 21,
                "column": 10
              }
            },
            "moduleName": "rose/templates/observers.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["content", "observer.name", ["loc", [null, [20, 12], [20, 29]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 4
            },
            "end": {
              "line": 24,
              "column": 4
            }
          },
          "moduleName": "rose/templates/observers.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "item");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "right floated content");
          var el3 = dom.createTextNode("\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("button");
          dom.setAttribute(el3, "class", "ui right mini red labeled icon button");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("i");
          dom.setAttribute(el4, "class", "remove icon");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n            Remove\n          ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "content");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [1, 1]);
          var morphs = new Array(2);
          morphs[0] = dom.createElementMorph(element1);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]), 1, 1);
          return morphs;
        },
        statements: [["element", "action", ["removeObserver", ["get", "observer", ["loc", [null, [13, 90], [13, 98]]]]], [], ["loc", [null, [13, 64], [13, 100]]]], ["block", "link-to", ["observer", ["get", "observer", ["loc", [null, [19, 32], [19, 40]]]]], [], 0, null, ["loc", [null, [19, 10], [21, 22]]]]],
        locals: ["observer"],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 29,
            "column": 0
          }
        },
        "moduleName": "rose/templates/observers.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui celled ordered list");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "class", "ui primary button");
        var el2 = dom.createTextNode("Add Observer");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("button");
        dom.setAttribute(el1, "class", "ui button");
        var el2 = dom.createTextNode("Export Observer");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0, 3]);
        var element3 = dom.childAt(fragment, [4]);
        var element4 = dom.childAt(fragment, [6]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(element2, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element2, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]), 1, 1);
        morphs[3] = dom.createElementMorph(element3);
        morphs[4] = dom.createElementMorph(element4);
        return morphs;
      },
      statements: [["inline", "t", ["observerEditor.title"], [], ["loc", [null, [4, 4], [4, 32]]]], ["inline", "t", ["observerEditor.subtitle"], [], ["loc", [null, [5, 28], [5, 59]]]], ["block", "each", [["get", "sortedList", ["loc", [null, [10, 12], [10, 22]]]]], [], 0, null, ["loc", [null, [10, 4], [24, 13]]]], ["element", "action", ["addObserver"], [], ["loc", [null, [27, 34], [27, 58]]]], ["element", "action", ["exportObservers"], [], ["loc", [null, [28, 26], [28, 54]]]]],
      locals: [],
      templates: [child0]
    };
  })());
});
define("rose/templates/settings", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 21,
                "column": 8
              },
              "end": {
                "line": 25,
                "column": 8
              }
            },
            "moduleName": "rose/templates/settings.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "item");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element7 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element7, 'data-value');
            morphs[1] = dom.createMorphAt(element7, 1, 1);
            return morphs;
          },
          statements: [["attribute", "data-value", ["get", "language.code", ["loc", [null, [22, 41], [22, 54]]]]], ["content", "language.name", ["loc", [null, [23, 12], [23, 29]]]]],
          locals: ["language"],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 14,
              "column": 4
            },
            "end": {
              "line": 27,
              "column": 4
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "default text");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("input");
          dom.setAttribute(el1, "type", "hidden");
          dom.setAttribute(el1, "name", "interval");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "dropdown icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "menu");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element8 = dom.childAt(fragment, [3]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 0, 0);
          morphs[1] = dom.createAttrMorph(element8, 'value');
          morphs[2] = dom.createMorphAt(dom.childAt(fragment, [7]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["settings.language"], [], ["loc", [null, [17, 32], [17, 57]]]], ["attribute", "value", ["get", "settings.user.currentLanguage", ["loc", [null, [18, 51], [18, 80]]]]], ["block", "each", [["get", "availableLanguages", ["loc", [null, [21, 16], [21, 34]]]]], [], 0, null, ["loc", [null, [21, 8], [25, 17]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 65,
              "column": 10
            },
            "end": {
              "line": 67,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "moment-format", [["get", "settings.system.lastChecked", ["loc", [null, [66, 28], [66, 55]]]], "YYYY-MM-DD HH:mm"], [], ["loc", [null, [66, 12], [66, 76]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 67,
              "column": 10
            },
            "end": {
              "line": 69,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["settings.never"], [], ["loc", [null, [68, 12], [68, 34]]]]],
        locals: [],
        templates: []
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 72,
              "column": 10
            },
            "end": {
              "line": 74,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "moment-format", [["get", "settings.system.lastUpdated", ["loc", [null, [73, 28], [73, 55]]]], "YYYY-MM-DD HH:mm"], [], ["loc", [null, [73, 12], [73, 76]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 74,
              "column": 10
            },
            "end": {
              "line": 76,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["settings.never"], [], ["loc", [null, [75, 12], [75, 34]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 80,
              "column": 10
            },
            "end": {
              "line": 82,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["settings.signedUpdate"], [], ["loc", [null, [81, 12], [81, 41]]]]],
        locals: [],
        templates: []
      };
    })();
    var child6 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 82,
              "column": 10
            },
            "end": {
              "line": 84,
              "column": 10
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["settings.unsignedUpdate"], [], ["loc", [null, [83, 12], [83, 43]]]]],
        locals: [],
        templates: []
      };
    })();
    var child7 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 90,
              "column": 4
            },
            "end": {
              "line": 92,
              "column": 4
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element6 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createAttrMorph(element6, 'class');
          morphs[1] = dom.createElementMorph(element6);
          morphs[2] = dom.createMorphAt(element6, 0, 0);
          return morphs;
        },
        statements: [["attribute", "class", ["concat", ["ui ", ["subexpr", "if", [["get", "updateInProgress", ["loc", [null, [91, 27], [91, 43]]]], "loading"], [], ["loc", [null, [91, 22], [91, 55]]]], " button"]]], ["element", "action", ["manualUpdate"], [], ["loc", [null, [91, 64], [91, 89]]]], ["inline", "t", ["action.update"], [], ["loc", [null, [91, 90], [91, 111]]]]],
        locals: [],
        templates: []
      };
    })();
    var child8 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 92,
              "column": 4
            },
            "end": {
              "line": 97,
              "column": 4
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui disabled labeled button");
          dom.setAttribute(el1, "tabindex", "0");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui button");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2, "class", "ui basic label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element5 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(dom.childAt(element5, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element5, [3]), 0, 0);
          return morphs;
        },
        statements: [["inline", "t", ["action.update"], [], ["loc", [null, [94, 29], [94, 50]]]], ["inline", "t", ["settings.noInternetConnection"], [], ["loc", [null, [95, 32], [95, 69]]]]],
        locals: [],
        templates: []
      };
    })();
    var child9 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 99,
              "column": 4
            },
            "end": {
              "line": 105,
              "column": 4
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "close icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "header");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element3 = dom.childAt(fragment, [1]);
          var element4 = dom.childAt(element3, [1]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element3, 'class');
          morphs[1] = dom.createAttrMorph(element4, 'onclick');
          morphs[2] = dom.createMorphAt(dom.childAt(element3, [3]), 0, 0);
          morphs[3] = dom.createMorphAt(dom.childAt(element3, [5]), 0, 0);
          return morphs;
        },
        statements: [["attribute", "class", ["concat", ["ui ", ["get", "updateResult", ["loc", [null, [100, 21], [100, 33]]]], " message hidden"]]], ["attribute", "onclick", ["subexpr", "action", ["closeMessage"], [], ["loc", [null, [101, 36], [101, 61]]]]], ["inline", "t", [["get", "updateResulti18n", ["loc", [null, [102, 30], [102, 46]]]]], [], ["loc", [null, [102, 26], [102, 48]]]], ["content", "updateMessage", ["loc", [null, [103, 9], [103, 26]]]]],
        locals: [],
        templates: []
      };
    })();
    var child10 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 129,
                  "column": 8
                },
                "end": {
                  "line": 133,
                  "column": 8
                }
              },
              "moduleName": "rose/templates/settings.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1, "class", "item");
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element0 = dom.childAt(fragment, [1]);
              var morphs = new Array(2);
              morphs[0] = dom.createAttrMorph(element0, 'data-value');
              morphs[1] = dom.createMorphAt(element0, 1, 1);
              return morphs;
            },
            statements: [["attribute", "data-value", ["get", "interval.value", ["loc", [null, [130, 41], [130, 55]]]]], ["inline", "t", [["get", "interval.label", ["loc", [null, [131, 16], [131, 30]]]]], [], ["loc", [null, [131, 12], [131, 32]]]]],
            locals: ["interval"],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 122,
                "column": 4
              },
              "end": {
                "line": 135,
                "column": 4
              }
            },
            "moduleName": "rose/templates/settings.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "default text");
            var el2 = dom.createTextNode("Select an interval");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("input");
            dom.setAttribute(el1, "type", "hidden");
            dom.setAttribute(el1, "name", "interval");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1, "class", "dropdown icon");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "menu");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element1 = dom.childAt(fragment, [3]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element1, 'value');
            morphs[1] = dom.createMorphAt(dom.childAt(fragment, [7]), 1, 1);
            return morphs;
          },
          statements: [["attribute", "value", ["get", "settings.system.updateInterval", ["loc", [null, [126, 51], [126, 81]]]]], ["block", "each", [["get", "updateIntervals", ["loc", [null, [129, 16], [129, 31]]]]], [], 0, null, ["loc", [null, [129, 8], [133, 17]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 117,
              "column": 2
            },
            "end": {
              "line": 137,
              "column": 2
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element2, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(element2, 5, 5);
          return morphs;
        },
        statements: [["inline", "t", ["settings.autoUpdateInterval"], [], ["loc", [null, [119, 11], [119, 46]]]], ["inline", "t", ["settings.autoUpdateIntervalLabel"], [], ["loc", [null, [120, 7], [120, 47]]]], ["block", "ui-dropdown", [], ["class", "selection", "selected", ["subexpr", "@mut", [["get", "settings.system.updateInterval", ["loc", [null, [123, 29], [123, 59]]]]], [], []], "onChange", ["subexpr", "action", ["changeAutoUpdate"], [], ["loc", [null, [124, 29], [124, 56]]]]], 0, null, ["loc", [null, [122, 4], [135, 20]]]]],
        locals: [],
        templates: [child0]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 149,
            "column": 0
          }
        },
        "moduleName": "rose/templates/settings.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field manualUpdate");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3, "class", "ui celled small table");
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("thead");
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n      ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n    ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("        ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("        ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("td");
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("i");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("        ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n      ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n    ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n  ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3, "class", "ui red button");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element9 = dom.childAt(fragment, [0, 3]);
        var element10 = dom.childAt(fragment, [2]);
        var element11 = dom.childAt(element10, [1]);
        var element12 = dom.childAt(element10, [3]);
        var element13 = dom.childAt(element10, [5]);
        var element14 = dom.childAt(element10, [7]);
        var element15 = dom.childAt(element14, [5]);
        var element16 = dom.childAt(element15, [1, 1]);
        var element17 = dom.childAt(element15, [3, 1]);
        var element18 = dom.childAt(element17, [5]);
        var element19 = dom.childAt(element18, [1]);
        var element20 = dom.childAt(element10, [9]);
        var element21 = dom.childAt(element10, [13]);
        var element22 = dom.childAt(element21, [5]);
        var morphs = new Array(33);
        morphs[0] = dom.createMorphAt(element9, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element9, [3]), 0, 0);
        morphs[2] = dom.createAttrMorph(element10, 'class');
        morphs[3] = dom.createMorphAt(dom.childAt(element11, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element11, [3]), 0, 0);
        morphs[5] = dom.createMorphAt(element11, 5, 5);
        morphs[6] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
        morphs[7] = dom.createMorphAt(dom.childAt(element12, [3]), 0, 0);
        morphs[8] = dom.createMorphAt(element12, 5, 5);
        morphs[9] = dom.createMorphAt(dom.childAt(element13, [1]), 0, 0);
        morphs[10] = dom.createMorphAt(dom.childAt(element13, [3]), 0, 0);
        morphs[11] = dom.createMorphAt(element13, 5, 5);
        morphs[12] = dom.createMorphAt(dom.childAt(element14, [1]), 0, 0);
        morphs[13] = dom.createMorphAt(dom.childAt(element14, [3]), 0, 0);
        morphs[14] = dom.createMorphAt(dom.childAt(element16, [1]), 0, 0);
        morphs[15] = dom.createMorphAt(dom.childAt(element16, [3]), 0, 0);
        morphs[16] = dom.createMorphAt(dom.childAt(element16, [5]), 0, 0);
        morphs[17] = dom.createMorphAt(dom.childAt(element17, [1]), 1, 1);
        morphs[18] = dom.createMorphAt(dom.childAt(element17, [3]), 1, 1);
        morphs[19] = dom.createAttrMorph(element18, 'class');
        morphs[20] = dom.createAttrMorph(element19, 'class');
        morphs[21] = dom.createMorphAt(element18, 3, 3);
        morphs[22] = dom.createMorphAt(element14, 7, 7);
        morphs[23] = dom.createMorphAt(element14, 9, 9);
        morphs[24] = dom.createMorphAt(dom.childAt(element20, [1]), 0, 0);
        morphs[25] = dom.createMorphAt(dom.childAt(element20, [3]), 0, 0);
        morphs[26] = dom.createMorphAt(element20, 5, 5);
        morphs[27] = dom.createMorphAt(element10, 11, 11);
        morphs[28] = dom.createMorphAt(dom.childAt(element21, [1]), 0, 0);
        morphs[29] = dom.createMorphAt(dom.childAt(element21, [3]), 0, 0);
        morphs[30] = dom.createElementMorph(element22);
        morphs[31] = dom.createMorphAt(element22, 1, 1);
        morphs[32] = dom.createMorphAt(fragment, 4, 4, contextualElement);
        return morphs;
      },
      statements: [["inline", "t", ["settings.title"], [], ["loc", [null, [4, 4], [4, 26]]]], ["inline", "t", ["settings.subtitle"], [], ["loc", [null, [5, 28], [5, 53]]]], ["attribute", "class", ["concat", ["ui form ", ["get", "updateResult", ["loc", [null, [9, 22], [9, 34]]]]]]], ["inline", "t", ["settings.language"], [], ["loc", [null, [11, 11], [11, 36]]]], ["inline", "t", ["settings.languageLabel"], [], ["loc", [null, [12, 7], [12, 37]]]], ["block", "ui-dropdown", [], ["class", "selection", "selected", ["subexpr", "@mut", [["get", "settings.user.currentLanguage", ["loc", [null, [15, 29], [15, 58]]]]], [], []], "onChange", ["subexpr", "action", ["changeI18nLanguage"], [], ["loc", [null, [16, 29], [16, 58]]]]], 0, null, ["loc", [null, [14, 4], [27, 20]]]], ["inline", "t", ["settings.commentReminder"], [], ["loc", [null, [31, 11], [31, 43]]]], ["inline", "t", ["settings.commentReminderLabel"], [], ["loc", [null, [32, 7], [32, 44]]]], ["inline", "ui-checkbox", [], ["class", "toggle", "checked", ["subexpr", "@mut", [["get", "settings.user.commentReminderIsEnabled", ["loc", [null, [34, 26], [34, 64]]]]], [], []], "label", ["subexpr", "boolean-to-yesno", [["get", "settings.user.commentReminderIsEnabled", ["loc", [null, [35, 42], [35, 80]]]]], [], ["loc", [null, [35, 24], [35, 81]]]], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [36, 27], [36, 50]]]]], ["loc", [null, [33, 4], [36, 52]]]], ["inline", "t", ["settings.extraFeatures"], [], ["loc", [null, [41, 11], [41, 41]]]], ["inline", "t", ["settings.extraFeaturesLabel"], [], ["loc", [null, [42, 7], [42, 42]]]], ["inline", "ui-checkbox", [], ["class", "toggle", "checked", ["subexpr", "@mut", [["get", "settings.user.developerModeIsEnabled", ["loc", [null, [44, 26], [44, 62]]]]], [], []], "label", ["subexpr", "boolean-to-yesno", [["get", "settings.user.developerModeIsEnabled", ["loc", [null, [45, 42], [45, 78]]]]], [], ["loc", [null, [45, 24], [45, 79]]]], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [46, 27], [46, 50]]]]], ["loc", [null, [43, 4], [46, 52]]]], ["inline", "t", ["settings.manualUpdate"], [], ["loc", [null, [51, 11], [51, 40]]]], ["inline", "t", ["settings.manualUpdateLabel"], [], ["loc", [null, [52, 7], [52, 41]]]], ["inline", "t", ["settings.lastChecked"], [], ["loc", [null, [57, 12], [57, 40]]]], ["inline", "t", ["settings.lastUpdated"], [], ["loc", [null, [58, 12], [58, 40]]]], ["inline", "t", ["settings.signedStatus"], [], ["loc", [null, [59, 12], [59, 41]]]], ["block", "if", [["get", "settings.system.lastChecked", ["loc", [null, [65, 16], [65, 43]]]]], [], 1, 2, ["loc", [null, [65, 10], [69, 17]]]], ["block", "if", [["get", "settings.system.lastUpdated", ["loc", [null, [72, 16], [72, 43]]]]], [], 3, 4, ["loc", [null, [72, 10], [76, 17]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "updateSigned", ["loc", [null, [78, 24], [78, 36]]]], "positive"], [], ["loc", [null, [78, 19], [78, 49]]]]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "updateSigned", ["loc", [null, [79, 25], [79, 37]]]], "lock", "unlock alternate"], [], ["loc", [null, [79, 20], [79, 65]]]], " icon"]]], ["block", "if", [["get", "updateSigned", ["loc", [null, [80, 16], [80, 28]]]]], [], 5, 6, ["loc", [null, [80, 10], [84, 17]]]], ["block", "if", [["get", "navigator.onLine", ["loc", [null, [90, 10], [90, 26]]]]], [], 7, 8, ["loc", [null, [90, 4], [97, 11]]]], ["block", "if", [["get", "updateResult", ["loc", [null, [99, 10], [99, 22]]]]], [], 9, null, ["loc", [null, [99, 4], [105, 11]]]], ["inline", "t", ["settings.autoUpdate"], [], ["loc", [null, [109, 11], [109, 38]]]], ["inline", "t", ["settings.autoUpdateLabel"], [], ["loc", [null, [110, 7], [110, 39]]]], ["inline", "ui-checkbox", [], ["class", "toggle", "checked", ["subexpr", "@mut", [["get", "settings.system.autoUpdateIsEnabled", ["loc", [null, [112, 26], [112, 61]]]]], [], []], "label", ["subexpr", "boolean-to-yesno", [["get", "settings.system.autoUpdateIsEnabled", ["loc", [null, [113, 42], [113, 77]]]]], [], ["loc", [null, [113, 24], [113, 78]]]], "onChange", ["subexpr", "action", ["changeAutoUpdate"], [], ["loc", [null, [114, 27], [114, 54]]]]], ["loc", [null, [111, 4], [114, 56]]]], ["block", "if", [["get", "settings.system.autoUpdateIsEnabled", ["loc", [null, [117, 8], [117, 43]]]]], [], 10, null, ["loc", [null, [117, 2], [137, 9]]]], ["inline", "t", ["settings.resetRose"], [], ["loc", [null, [140, 11], [140, 37]]]], ["inline", "t", ["settings.resetRoseLabel"], [], ["loc", [null, [141, 7], [141, 38]]]], ["element", "action", ["openModal", "reset-config"], [], ["loc", [null, [142, 34], [142, 71]]]], ["inline", "t", ["action.reset"], [], ["loc", [null, [143, 6], [143, 26]]]], ["inline", "partial", ["modal/reset-config"], [], ["loc", [null, [148, 0], [148, 32]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8, child9, child10]
    };
  })());
});
define("rose/templates/sidebar-menu", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 2
            },
            "end": {
              "line": 5,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "dashboard icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.dashboard"], [], ["loc", [null, [3, 4], [3, 33]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 2
            },
            "end": {
              "line": 9,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "book icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.diary"], [], ["loc", [null, [7, 4], [7, 29]]]]],
        locals: [],
        templates: []
      };
    })();
    var child2 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 16,
                "column": 6
              },
              "end": {
                "line": 18,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.comments"], [], ["loc", [null, [17, 8], [17, 36]]]]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 19,
                "column": 6
              },
              "end": {
                "line": 21,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.interactions"], [], ["loc", [null, [20, 8], [20, 40]]]]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 22,
                "column": 6
              },
              "end": {
                "line": 24,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.extracts"], [], ["loc", [null, [23, 8], [23, 36]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 11,
              "column": 2
            },
            "end": {
              "line": 27,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "item");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(" ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "menu");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element2 = dom.childAt(fragment, [1]);
          var element3 = dom.childAt(element2, [5]);
          var element4 = dom.childAt(element2, [7]);
          var morphs = new Array(6);
          morphs[0] = dom.createMorphAt(element2, 1, 1);
          morphs[1] = dom.createMorphAt(element2, 3, 3);
          morphs[2] = dom.createAttrMorph(element3, 'class');
          morphs[3] = dom.createMorphAt(element4, 1, 1);
          morphs[4] = dom.createMorphAt(element4, 2, 2);
          morphs[5] = dom.createMorphAt(element4, 3, 3);
          return morphs;
        },
        statements: [["content", "network.descriptiveName", ["loc", [null, [13, 4], [13, 31]]]], ["inline", "t", ["sidebarMenu.data"], [], ["loc", [null, [13, 32], [13, 56]]]], ["attribute", "class", ["concat", [["get", "network.name", ["loc", [null, [14, 16], [14, 28]]]], " icon"]]], ["block", "link-to", ["comments", ["get", "network.name", ["loc", [null, [16, 28], [16, 40]]]]], ["class", "item"], 0, null, ["loc", [null, [16, 6], [18, 18]]]], ["block", "link-to", ["interactions", ["get", "network.name", ["loc", [null, [19, 32], [19, 44]]]]], ["class", "item"], 1, null, ["loc", [null, [19, 6], [21, 18]]]], ["block", "link-to", ["extracts", ["get", "network.name", ["loc", [null, [22, 28], [22, 40]]]]], ["class", "item"], 2, null, ["loc", [null, [22, 6], [24, 18]]]]],
        locals: ["network"],
        templates: [child0, child1, child2]
      };
    })();
    var child3 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 29,
              "column": 2
            },
            "end": {
              "line": 32,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "download icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.backup"], [], ["loc", [null, [30, 4], [30, 30]]]]],
        locals: [],
        templates: []
      };
    })();
    var child4 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 33,
              "column": 2
            },
            "end": {
              "line": 36,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "options icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.settings"], [], ["loc", [null, [34, 4], [34, 32]]]]],
        locals: [],
        templates: []
      };
    })();
    var child5 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 37,
              "column": 2
            },
            "end": {
              "line": 40,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "help circle icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.help"], [], ["loc", [null, [38, 4], [38, 28]]]]],
        locals: [],
        templates: []
      };
    })();
    var child6 = (function () {
      var child0 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 46,
                "column": 6
              },
              "end": {
                "line": 48,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.studyCreator"], [], ["loc", [null, [47, 8], [47, 40]]]]],
          locals: [],
          templates: []
        };
      })();
      var child1 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 49,
                "column": 6
              },
              "end": {
                "line": 51,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.debugLog"], [], ["loc", [null, [50, 8], [50, 36]]]]],
          locals: [],
          templates: []
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 52,
                "column": 6
              },
              "end": {
                "line": 54,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.observerEditor"], [], ["loc", [null, [53, 8], [53, 42]]]]],
          locals: [],
          templates: []
        };
      })();
      var child3 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 55,
                "column": 6
              },
              "end": {
                "line": 57,
                "column": 6
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
            return morphs;
          },
          statements: [["inline", "t", ["sidebarMenu.dataConverter"], [], ["loc", [null, [56, 8], [56, 41]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 41,
              "column": 2
            },
            "end": {
              "line": 60,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "item");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2, "class", "lab icon");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "menu");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [5]);
          var morphs = new Array(5);
          morphs[0] = dom.createMorphAt(element0, 1, 1);
          morphs[1] = dom.createMorphAt(element1, 1, 1);
          morphs[2] = dom.createMorphAt(element1, 2, 2);
          morphs[3] = dom.createMorphAt(element1, 3, 3);
          morphs[4] = dom.createMorphAt(element1, 4, 4);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.extraFeatures"], [], ["loc", [null, [43, 4], [43, 37]]]], ["block", "link-to", ["study-creator"], ["class", "item"], 0, null, ["loc", [null, [46, 6], [48, 18]]]], ["block", "link-to", ["debug-log"], ["class", "item"], 1, null, ["loc", [null, [49, 6], [51, 18]]]], ["block", "link-to", ["observers"], ["class", "item"], 2, null, ["loc", [null, [52, 6], [54, 18]]]], ["block", "link-to", ["data-converter"], ["class", "item"], 3, null, ["loc", [null, [55, 6], [57, 18]]]]],
        locals: [],
        templates: [child0, child1, child2, child3]
      };
    })();
    var child7 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 61,
              "column": 2
            },
            "end": {
              "line": 64,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1, "class", "info circle icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment, 1, 1, contextualElement);
          return morphs;
        },
        statements: [["inline", "t", ["sidebarMenu.about"], [], ["loc", [null, [62, 4], [62, 29]]]]],
        locals: [],
        templates: []
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "triple-curlies"
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 66,
            "column": 0
          }
        },
        "moduleName": "rose/templates/sidebar-menu.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui vertical menu");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element5 = dom.childAt(fragment, [0]);
        var morphs = new Array(8);
        morphs[0] = dom.createMorphAt(element5, 1, 1);
        morphs[1] = dom.createMorphAt(element5, 2, 2);
        morphs[2] = dom.createMorphAt(element5, 4, 4);
        morphs[3] = dom.createMorphAt(element5, 6, 6);
        morphs[4] = dom.createMorphAt(element5, 7, 7);
        morphs[5] = dom.createMorphAt(element5, 8, 8);
        morphs[6] = dom.createMorphAt(element5, 9, 9);
        morphs[7] = dom.createMorphAt(element5, 10, 10);
        return morphs;
      },
      statements: [["block", "link-to", ["index"], ["class", "item"], 0, null, ["loc", [null, [2, 2], [5, 14]]]], ["block", "link-to", ["diary"], ["class", "item"], 1, null, ["loc", [null, [6, 2], [9, 14]]]], ["block", "each", [["get", "networks", ["loc", [null, [11, 10], [11, 18]]]]], [], 2, null, ["loc", [null, [11, 2], [27, 11]]]], ["block", "link-to", ["backup"], ["class", "item"], 3, null, ["loc", [null, [29, 2], [32, 14]]]], ["block", "link-to", ["settings"], ["class", "item"], 4, null, ["loc", [null, [33, 2], [36, 14]]]], ["block", "link-to", ["help"], ["class", "item"], 5, null, ["loc", [null, [37, 2], [40, 14]]]], ["block", "if", [["get", "settings.user.developerModeIsEnabled", ["loc", [null, [41, 8], [41, 44]]]]], [], 6, null, ["loc", [null, [41, 2], [60, 9]]]], ["block", "link-to", ["about"], ["class", "item"], 7, null, ["loc", [null, [61, 2], [64, 14]]]]],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7]
    };
  })());
});
define("rose/templates/study-creator", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    var child0 = (function () {
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 22,
              "column": 4
            },
            "end": {
              "line": 26,
              "column": 4
            }
          },
          "moduleName": "rose/templates/study-creator.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "ui pointing red basic label");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["studyCreator.baseFileNotFound"], [], ["loc", [null, [24, 6], [24, 43]]]]],
        locals: [],
        templates: []
      };
    })();
    var child1 = (function () {
      var child0 = (function () {
        var child0 = (function () {
          var child0 = (function () {
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 62,
                    "column": 12
                  },
                  "end": {
                    "line": 72,
                    "column": 12
                  }
                },
                "moduleName": "rose/templates/study-creator.hbs"
              },
              isEmpty: false,
              arity: 1,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("              ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("tr");
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("td");
                dom.setAttribute(el2, "class", "collapsing");
                var el3 = dom.createTextNode("\n                  ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("td");
                var el3 = dom.createElement("strong");
                var el4 = dom.createComment("");
                dom.appendChild(el3, el4);
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("td");
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("td");
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("td");
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n              ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var element3 = dom.childAt(fragment, [1]);
                var morphs = new Array(5);
                morphs[0] = dom.createMorphAt(dom.childAt(element3, [1]), 1, 1);
                morphs[1] = dom.createMorphAt(dom.childAt(element3, [3, 0]), 0, 0);
                morphs[2] = dom.createMorphAt(dom.childAt(element3, [5]), 0, 0);
                morphs[3] = dom.createMorphAt(dom.childAt(element3, [7]), 0, 0);
                morphs[4] = dom.createMorphAt(dom.childAt(element3, [9]), 0, 0);
                return morphs;
              },
              statements: [["inline", "ui-checkbox", [], ["class", "fitted toggle", "checked", ["subexpr", "@mut", [["get", "observer.isEnabled", ["loc", [null, [65, 62], [65, 80]]]]], [], []]], ["loc", [null, [65, 18], [65, 82]]]], ["content", "observer.name", ["loc", [null, [67, 28], [67, 45]]]], ["content", "observer.description", ["loc", [null, [68, 20], [68, 44]]]], ["inline", "t", [["get", "observer.type", ["loc", [null, [69, 24], [69, 37]]]]], [], ["loc", [null, [69, 20], [69, 39]]]], ["content", "observer.version", ["loc", [null, [70, 20], [70, 40]]]]],
              locals: ["observer"],
              templates: []
            };
          })();
          var child1 = (function () {
            var child0 = (function () {
              return {
                meta: {
                  "fragmentReason": false,
                  "revision": "Ember@2.2.2",
                  "loc": {
                    "source": null,
                    "start": {
                      "line": 75,
                      "column": 14
                    },
                    "end": {
                      "line": 85,
                      "column": 14
                    }
                  },
                  "moduleName": "rose/templates/study-creator.hbs"
                },
                isEmpty: false,
                arity: 0,
                cachedFragment: null,
                hasRendered: false,
                buildFragment: function buildFragment(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("              ");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createElement("tr");
                  var el2 = dom.createTextNode("\n                ");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createElement("td");
                  dom.setAttribute(el2, "class", "collapsing");
                  var el3 = dom.createTextNode("\n                  ");
                  dom.appendChild(el2, el3);
                  var el3 = dom.createComment("");
                  dom.appendChild(el2, el3);
                  var el3 = dom.createTextNode("\n                ");
                  dom.appendChild(el2, el3);
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("\n                ");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createElement("td");
                  var el3 = dom.createElement("strong");
                  var el4 = dom.createComment("");
                  dom.appendChild(el3, el4);
                  dom.appendChild(el2, el3);
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("\n                ");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createElement("td");
                  var el3 = dom.createComment("");
                  dom.appendChild(el2, el3);
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("\n                ");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createElement("td");
                  var el3 = dom.createComment("");
                  dom.appendChild(el2, el3);
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("\n                ");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createElement("td");
                  var el3 = dom.createComment("");
                  dom.appendChild(el2, el3);
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("\n              ");
                  dom.appendChild(el1, el2);
                  dom.appendChild(el0, el1);
                  var el1 = dom.createTextNode("\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                  var element2 = dom.childAt(fragment, [1]);
                  var morphs = new Array(5);
                  morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]), 1, 1);
                  morphs[1] = dom.createMorphAt(dom.childAt(element2, [3, 0]), 0, 0);
                  morphs[2] = dom.createMorphAt(dom.childAt(element2, [5]), 0, 0);
                  morphs[3] = dom.createMorphAt(dom.childAt(element2, [7]), 0, 0);
                  morphs[4] = dom.createMorphAt(dom.childAt(element2, [9]), 0, 0);
                  return morphs;
                },
                statements: [["inline", "ui-checkbox", [], ["class", "fitted toggle", "checked", ["subexpr", "@mut", [["get", "extractor.isEnabled", ["loc", [null, [78, 62], [78, 81]]]]], [], []]], ["loc", [null, [78, 18], [78, 83]]]], ["content", "extractor.name", ["loc", [null, [80, 28], [80, 46]]]], ["content", "extractor.description", ["loc", [null, [81, 20], [81, 45]]]], ["inline", "t", [["get", "extractor.type", ["loc", [null, [82, 24], [82, 38]]]]], [], ["loc", [null, [82, 20], [82, 40]]]], ["content", "extractor.version", ["loc", [null, [83, 20], [83, 41]]]]],
                locals: [],
                templates: []
              };
            })();
            return {
              meta: {
                "fragmentReason": false,
                "revision": "Ember@2.2.2",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 74,
                    "column": 12
                  },
                  "end": {
                    "line": 86,
                    "column": 12
                  }
                },
                "moduleName": "rose/templates/study-creator.hbs"
              },
              isEmpty: false,
              arity: 1,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment, 0, 0, contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [["block", "if", [["get", "extractor.type", ["loc", [null, [75, 20], [75, 34]]]]], [], 0, null, ["loc", [null, [75, 14], [85, 21]]]]],
              locals: ["extractor"],
              templates: [child0]
            };
          })();
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 46,
                  "column": 8
                },
                "end": {
                  "line": 98,
                  "column": 6
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
            isEmpty: false,
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1, "class", "ui field");
              dom.setAttribute(el1, "style", "padding-top: 15px;");
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("label");
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n          ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("table");
              dom.setAttribute(el2, "class", "ui small compact table");
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("thead");
              dom.setAttribute(el3, "class", "full-width");
              var el4 = dom.createTextNode("\n              ");
              dom.appendChild(el3, el4);
              var el4 = dom.createElement("tr");
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              var el6 = dom.createComment("");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              var el6 = dom.createComment("");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              var el6 = dom.createComment("");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              var el6 = dom.createComment("");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              var el6 = dom.createComment("");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n              ");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              var el4 = dom.createTextNode("\n            ");
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("tbody");
              var el4 = dom.createTextNode("\n");
              dom.appendChild(el3, el4);
              var el4 = dom.createComment("");
              dom.appendChild(el3, el4);
              var el4 = dom.createTextNode("\n");
              dom.appendChild(el3, el4);
              var el4 = dom.createComment("");
              dom.appendChild(el3, el4);
              var el4 = dom.createTextNode("            ");
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("tfoot");
              dom.setAttribute(el3, "class", "full-width");
              var el4 = dom.createTextNode("\n              ");
              dom.appendChild(el3, el4);
              var el4 = dom.createElement("tr");
              var el5 = dom.createTextNode("\n                ");
              dom.appendChild(el4, el5);
              var el5 = dom.createElement("th");
              dom.setAttribute(el5, "colspan", "5");
              var el6 = dom.createTextNode("\n                  ");
              dom.appendChild(el5, el6);
              var el6 = dom.createElement("button");
              dom.setAttribute(el6, "class", "ui small green button");
              var el7 = dom.createComment("");
              dom.appendChild(el6, el7);
              dom.appendChild(el5, el6);
              var el6 = dom.createTextNode("\n                  ");
              dom.appendChild(el5, el6);
              var el6 = dom.createElement("button");
              dom.setAttribute(el6, "class", "ui small basic button");
              var el7 = dom.createComment("");
              dom.appendChild(el6, el7);
              dom.appendChild(el5, el6);
              var el6 = dom.createTextNode("\n                ");
              dom.appendChild(el5, el6);
              dom.appendChild(el4, el5);
              var el5 = dom.createTextNode("\n              ");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              var el4 = dom.createTextNode("\n            ");
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n          ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element4 = dom.childAt(fragment, [1]);
              var element5 = dom.childAt(element4, [3]);
              var element6 = dom.childAt(element5, [1, 1]);
              var element7 = dom.childAt(element5, [3]);
              var element8 = dom.childAt(element5, [5, 1, 1]);
              var element9 = dom.childAt(element8, [1]);
              var element10 = dom.childAt(element8, [3]);
              var morphs = new Array(12);
              morphs[0] = dom.createMorphAt(dom.childAt(element4, [1]), 1, 1);
              morphs[1] = dom.createMorphAt(dom.childAt(element6, [1]), 0, 0);
              morphs[2] = dom.createMorphAt(dom.childAt(element6, [3]), 0, 0);
              morphs[3] = dom.createMorphAt(dom.childAt(element6, [5]), 0, 0);
              morphs[4] = dom.createMorphAt(dom.childAt(element6, [7]), 0, 0);
              morphs[5] = dom.createMorphAt(dom.childAt(element6, [9]), 0, 0);
              morphs[6] = dom.createMorphAt(element7, 1, 1);
              morphs[7] = dom.createMorphAt(element7, 3, 3);
              morphs[8] = dom.createElementMorph(element9);
              morphs[9] = dom.createMorphAt(element9, 0, 0);
              morphs[10] = dom.createElementMorph(element10);
              morphs[11] = dom.createMorphAt(element10, 0, 0);
              return morphs;
            },
            statements: [["inline", "t", ["studyCreator.patterns"], [], ["loc", [null, [49, 12], [49, 41]]]], ["inline", "t", ["studyCreator.table.enabled"], [], ["loc", [null, [54, 20], [54, 54]]]], ["inline", "t", ["studyCreator.table.name"], [], ["loc", [null, [55, 20], [55, 51]]]], ["inline", "t", ["studyCreator.table.description"], [], ["loc", [null, [56, 20], [56, 58]]]], ["inline", "t", ["studyCreator.table.type"], [], ["loc", [null, [57, 20], [57, 51]]]], ["inline", "t", ["studyCreator.table.version"], [], ["loc", [null, [58, 20], [58, 54]]]], ["block", "each", [["get", "network.observers", ["loc", [null, [62, 20], [62, 37]]]]], [], 0, null, ["loc", [null, [62, 12], [72, 21]]]], ["block", "each", [["get", "network.extractors", ["loc", [null, [74, 20], [74, 38]]]]], [], 1, null, ["loc", [null, [74, 12], [86, 21]]]], ["element", "action", ["enableAll", ["get", "network", ["loc", [null, [91, 77], [91, 84]]]]], [], ["loc", [null, [91, 56], [91, 86]]]], ["inline", "t", ["studyCreator.enableAll"], [], ["loc", [null, [91, 87], [91, 117]]]], ["element", "action", ["disableAll", ["get", "network", ["loc", [null, [92, 78], [92, 85]]]]], [], ["loc", [null, [92, 56], [92, 87]]]], ["inline", "t", ["studyCreator.disableAll"], [], ["loc", [null, [92, 88], [92, 119]]]]],
            locals: [],
            templates: [child0, child1]
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 40,
                "column": 4
              },
              "end": {
                "line": 100,
                "column": 4
              }
            },
            "moduleName": "rose/templates/study-creator.hbs"
          },
          isEmpty: false,
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "field");
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element11 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createMorphAt(element11, 1, 1);
            morphs[1] = dom.createMorphAt(element11, 3, 3);
            return morphs;
          },
          statements: [["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "network.isEnabled", ["loc", [null, [42, 30], [42, 47]]]]], [], []], "class", "toggle", "label", ["subexpr", "@mut", [["get", "network.descriptiveName", ["loc", [null, [44, 28], [44, 51]]]]], [], []], "value", ["subexpr", "@mut", [["get", "network", ["loc", [null, [45, 28], [45, 35]]]]], [], []]], ["loc", [null, [42, 8], [45, 37]]]], ["block", "if", [["get", "network.isEnabled", ["loc", [null, [46, 14], [46, 31]]]]], [], 0, null, ["loc", [null, [46, 8], [98, 13]]]]],
          locals: ["network"],
          templates: [child0]
        };
      })();
      var child1 = (function () {
        var child0 = (function () {
          return {
            meta: {
              "fragmentReason": false,
              "revision": "Ember@2.2.2",
              "loc": {
                "source": null,
                "start": {
                  "line": 126,
                  "column": 8
                },
                "end": {
                  "line": 130,
                  "column": 8
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
            isEmpty: false,
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("          ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1, "class", "item");
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var element0 = dom.childAt(fragment, [1]);
              var morphs = new Array(2);
              morphs[0] = dom.createAttrMorph(element0, 'data-value');
              morphs[1] = dom.createMorphAt(element0, 1, 1);
              return morphs;
            },
            statements: [["attribute", "data-value", ["get", "interval.value", ["loc", [null, [127, 41], [127, 55]]]]], ["inline", "t", [["get", "interval.label", ["loc", [null, [128, 16], [128, 30]]]]], [], ["loc", [null, [128, 12], [128, 32]]]]],
            locals: ["interval"],
            templates: []
          };
        })();
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 119,
                "column": 4
              },
              "end": {
                "line": 132,
                "column": 4
              }
            },
            "moduleName": "rose/templates/study-creator.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "default text");
            var el2 = dom.createTextNode("Select an interval");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("input");
            dom.setAttribute(el1, "type", "hidden");
            dom.setAttribute(el1, "name", "interval");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1, "class", "dropdown icon");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "menu");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("      ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element1 = dom.childAt(fragment, [3]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element1, 'value');
            morphs[1] = dom.createMorphAt(dom.childAt(fragment, [7]), 1, 1);
            return morphs;
          },
          statements: [["attribute", "value", ["get", "model.updateInterval", ["loc", [null, [123, 51], [123, 71]]]]], ["block", "each", [["get", "updateIntervals", ["loc", [null, [126, 16], [126, 31]]]]], [], 0, null, ["loc", [null, [126, 8], [130, 17]]]]],
          locals: [],
          templates: [child0]
        };
      })();
      var child2 = (function () {
        return {
          meta: {
            "fragmentReason": false,
            "revision": "Ember@2.2.2",
            "loc": {
              "source": null,
              "start": {
                "line": 135,
                "column": 2
              },
              "end": {
                "line": 139,
                "column": 2
              }
            },
            "moduleName": "rose/templates/study-creator.hbs"
          },
          isEmpty: false,
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("  ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1, "class", "ui red basic label");
            var el2 = dom.createTextNode("\n      ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n  ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]), 1, 1);
            return morphs;
          },
          statements: [["inline", "t", ["studyCreator.keyUnavailable"], [], ["loc", [null, [137, 6], [137, 41]]]]],
          locals: [],
          templates: []
        };
      })();
      return {
        meta: {
          "fragmentReason": false,
          "revision": "Ember@2.2.2",
          "loc": {
            "source": null,
            "start": {
              "line": 36,
              "column": 2
            },
            "end": {
              "line": 221,
              "column": 2
            }
          },
          "moduleName": "rose/templates/study-creator.hbs"
        },
        isEmpty: false,
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          dom.setAttribute(el1, "class", "ui dividing header");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui message");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("p");
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          dom.setAttribute(el1, "class", "ui dividing header");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2, "class", "ui action input");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("button");
          dom.setAttribute(el3, "class", "ui button");
          var el4 = dom.createTextNode("\n        ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          dom.setAttribute(el1, "class", "ui dividing header");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          dom.setAttribute(el1, "class", "ui dividing header");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1, "class", "field");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("p");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("button");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element12 = dom.childAt(fragment, [1]);
          var element13 = dom.childAt(fragment, [5]);
          var element14 = dom.childAt(fragment, [7]);
          var element15 = dom.childAt(fragment, [11]);
          var element16 = dom.childAt(fragment, [13]);
          var element17 = dom.childAt(fragment, [17]);
          var element18 = dom.childAt(element17, [5]);
          var element19 = dom.childAt(element18, [3]);
          var element20 = dom.childAt(fragment, [19]);
          var element21 = dom.childAt(fragment, [23]);
          var element22 = dom.childAt(fragment, [25]);
          var element23 = dom.childAt(fragment, [29]);
          var element24 = dom.childAt(fragment, [31]);
          var morphs = new Array(44);
          morphs[0] = dom.createMorphAt(dom.childAt(element12, [1]), 0, 0);
          morphs[1] = dom.createMorphAt(dom.childAt(element12, [3]), 0, 0);
          morphs[2] = dom.createMorphAt(element12, 5, 5);
          morphs[3] = dom.createMorphAt(dom.childAt(fragment, [3]), 0, 0);
          morphs[4] = dom.createMorphAt(dom.childAt(element13, [1]), 0, 0);
          morphs[5] = dom.createMorphAt(dom.childAt(element13, [3]), 0, 0);
          morphs[6] = dom.createMorphAt(element13, 5, 5);
          morphs[7] = dom.createAttrMorph(element14, 'class');
          morphs[8] = dom.createMorphAt(dom.childAt(element14, [1]), 0, 0);
          morphs[9] = dom.createMorphAt(dom.childAt(element14, [3]), 0, 0);
          morphs[10] = dom.createMorphAt(element14, 5, 5);
          morphs[11] = dom.createMorphAt(fragment, 9, 9, contextualElement);
          morphs[12] = dom.createAttrMorph(element15, 'class');
          morphs[13] = dom.createMorphAt(dom.childAt(element15, [1]), 0, 0);
          morphs[14] = dom.createMorphAt(dom.childAt(element15, [3]), 0, 0);
          morphs[15] = dom.createMorphAt(element15, 5, 5);
          morphs[16] = dom.createAttrMorph(element16, 'class');
          morphs[17] = dom.createMorphAt(dom.childAt(element16, [1]), 0, 0);
          morphs[18] = dom.createMorphAt(dom.childAt(element16, [3]), 0, 0);
          morphs[19] = dom.createMorphAt(dom.childAt(element16, [5, 1]), 0, 0);
          morphs[20] = dom.createMorphAt(dom.childAt(fragment, [15]), 0, 0);
          morphs[21] = dom.createMorphAt(dom.childAt(element17, [1]), 0, 0);
          morphs[22] = dom.createMorphAt(dom.childAt(element17, [3]), 0, 0);
          morphs[23] = dom.createMorphAt(element18, 1, 1);
          morphs[24] = dom.createElementMorph(element19);
          morphs[25] = dom.createMorphAt(element19, 1, 1);
          morphs[26] = dom.createMorphAt(dom.childAt(element20, [1]), 0, 0);
          morphs[27] = dom.createMorphAt(dom.childAt(element20, [3]), 0, 0);
          morphs[28] = dom.createMorphAt(element20, 5, 5);
          morphs[29] = dom.createMorphAt(dom.childAt(fragment, [21]), 0, 0);
          morphs[30] = dom.createAttrMorph(element21, 'class');
          morphs[31] = dom.createMorphAt(dom.childAt(element21, [1]), 0, 0);
          morphs[32] = dom.createMorphAt(dom.childAt(element21, [3]), 0, 0);
          morphs[33] = dom.createMorphAt(element21, 5, 5);
          morphs[34] = dom.createAttrMorph(element22, 'class');
          morphs[35] = dom.createMorphAt(dom.childAt(element22, [1]), 0, 0);
          morphs[36] = dom.createMorphAt(dom.childAt(element22, [3]), 0, 0);
          morphs[37] = dom.createMorphAt(element22, 5, 5);
          morphs[38] = dom.createMorphAt(dom.childAt(fragment, [27]), 0, 0);
          morphs[39] = dom.createMorphAt(dom.childAt(element23, [1]), 0, 0);
          morphs[40] = dom.createMorphAt(element23, 3, 3);
          morphs[41] = dom.createAttrMorph(element24, 'class');
          morphs[42] = dom.createElementMorph(element24);
          morphs[43] = dom.createMorphAt(element24, 1, 1);
          return morphs;
        },
        statements: [["inline", "t", ["studyCreator.networks"], [], ["loc", [null, [38, 11], [38, 40]]]], ["inline", "t", ["studyCreator.networksDesc"], [], ["loc", [null, [39, 7], [39, 40]]]], ["block", "each", [["get", "networks", ["loc", [null, [40, 12], [40, 20]]]]], [], 0, null, ["loc", [null, [40, 4], [100, 13]]]], ["inline", "t", ["studyCreator.autoUpdateHeader"], [], ["loc", [null, [103, 33], [103, 70]]]], ["inline", "t", ["studyCreator.autoUpdate"], [], ["loc", [null, [106, 11], [106, 42]]]], ["inline", "t", ["studyCreator.autoUpdateDesc"], [], ["loc", [null, [107, 7], [107, 42]]]], ["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "model.autoUpdateIsEnabled", ["loc", [null, [109, 26], [109, 51]]]]], [], []], "class", "toggle", "label", ["subexpr", "boolean-to-yesno", [["get", "model.autoUpdateIsEnabled", ["loc", [null, [111, 42], [111, 67]]]]], [], ["loc", [null, [111, 24], [111, 68]]]], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [112, 27], [112, 50]]]]], ["loc", [null, [109, 4], [112, 52]]]], ["attribute", "class", ["concat", [["subexpr", "unless", [["get", "model.autoUpdateIsEnabled", ["loc", [null, [115, 23], [115, 48]]]], "disabled "], [], ["loc", [null, [115, 14], [115, 62]]]], "field"]]], ["inline", "t", ["studyCreator.updateInterval"], [], ["loc", [null, [116, 11], [116, 46]]]], ["inline", "t", ["studyCreator.updateIntervalLabel"], [], ["loc", [null, [117, 7], [117, 47]]]], ["block", "ui-dropdown", [], ["class", "selection", "selected", ["subexpr", "@mut", [["get", "model.updateInterval", ["loc", [null, [120, 29], [120, 49]]]]], [], []], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [121, 29], [121, 52]]]]], 1, null, ["loc", [null, [119, 4], [132, 20]]]], ["block", "unless", [["get", "keyAvailable", ["loc", [null, [135, 12], [135, 24]]]]], [], 2, null, ["loc", [null, [135, 2], [139, 13]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "secureUpdateImpossible", ["loc", [null, [141, 19], [141, 41]]]], "disabled "], [], ["loc", [null, [141, 14], [141, 55]]]], "field"]]], ["inline", "t", ["studyCreator.forceSecureUpdate"], [], ["loc", [null, [142, 11], [142, 49]]]], ["inline", "t", ["studyCreator.forceSecureUpdateDesc"], [], ["loc", [null, [143, 7], [143, 49]]]], ["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "model.forceSecureUpdate", ["loc", [null, [145, 26], [145, 49]]]]], [], []], "class", "toggle", "label", ["subexpr", "boolean-to-yesno", [["get", "model.forceSecureUpdate", ["loc", [null, [147, 42], [147, 65]]]]], [], ["loc", [null, [147, 24], [147, 66]]]], "onChange", ["subexpr", "action", ["toggleForceSecureUpdate"], [], ["loc", [null, [148, 27], [148, 61]]]]], ["loc", [null, [145, 4], [148, 63]]]], ["attribute", "class", ["concat", [["subexpr", "unless", [["get", "model.forceSecureUpdate", ["loc", [null, [151, 23], [151, 46]]]], "disabled "], [], ["loc", [null, [151, 14], [151, 60]]]], "field"]]], ["inline", "t", ["studyCreator.fingerprint"], [], ["loc", [null, [152, 11], [152, 43]]]], ["inline", "t", ["studyCreator.fingerprintDesc"], [], ["loc", [null, [153, 7], [153, 43]]]], ["content", "model.fingerprint", ["loc", [null, [155, 9], [155, 30]]]], ["inline", "t", ["studyCreator.privacyHeader"], [], ["loc", [null, [159, 33], [159, 67]]]], ["inline", "t", ["studyCreator.salt"], [], ["loc", [null, [162, 11], [162, 36]]]], ["inline", "t", ["studyCreator.saltDesc"], [], ["loc", [null, [163, 7], [163, 36]]]], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.salt", ["loc", [null, [167, 20], [167, 30]]]]], [], []], "insert-newline", "saveSettings", "focus-out", "saveSettings"], ["loc", [null, [166, 6], [169, 40]]]], ["element", "action", ["generateSalt"], [], ["loc", [null, [171, 32], [171, 57]]]], ["inline", "t", ["studyCreator.generateSaltButton"], [], ["loc", [null, [172, 8], [172, 47]]]], ["inline", "t", ["studyCreator.hashLength"], [], ["loc", [null, [178, 11], [178, 42]]]], ["inline", "t", ["studyCreator.hashLengthDesc"], [], ["loc", [null, [179, 7], [179, 42]]]], ["inline", "input", [], ["type", "number", "value", ["subexpr", "@mut", [["get", "model.hashLength", ["loc", [null, [182, 18], [182, 34]]]]], [], []], "insert-newline", "saveSettings", "focus-out", "saveSettings"], ["loc", [null, [181, 4], [184, 38]]]], ["inline", "t", ["studyCreator.optionalFeaturesHeader"], [], ["loc", [null, [187, 33], [187, 76]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "facebookDisabled", ["loc", [null, [188, 19], [188, 35]]]], "disabled "], [], ["loc", [null, [188, 14], [188, 49]]]], "field"]]], ["inline", "t", ["studyCreator.roseComments"], [], ["loc", [null, [189, 11], [189, 44]]]], ["inline", "t", ["studyCreator.roseCommentsDesc"], [], ["loc", [null, [190, 7], [190, 44]]]], ["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "model.roseCommentsIsEnabled", ["loc", [null, [192, 26], [192, 53]]]]], [], []], "class", "toggle", "label", ["subexpr", "boolean-to-yesno", [["get", "model.roseCommentsIsEnabled", ["loc", [null, [194, 42], [194, 69]]]]], [], ["loc", [null, [194, 24], [194, 70]]]], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [195, 27], [195, 50]]]]], ["loc", [null, [192, 4], [195, 52]]]], ["attribute", "class", ["concat", [["subexpr", "if", [["get", "facebookDisabled", ["loc", [null, [198, 19], [198, 35]]]], "disabled "], [], ["loc", [null, [198, 14], [198, 49]]]], ["subexpr", "unless", [["get", "model.roseCommentsIsEnabled", ["loc", [null, [198, 58], [198, 85]]]], "disabled "], [], ["loc", [null, [198, 49], [198, 99]]]], "field"]]], ["inline", "t", ["studyCreator.roseCommentsRating"], [], ["loc", [null, [199, 11], [199, 50]]]], ["inline", "t", ["studyCreator.roseCommentsRatingDesc"], [], ["loc", [null, [200, 7], [200, 50]]]], ["inline", "ui-checkbox", [], ["checked", ["subexpr", "@mut", [["get", "model.roseCommentsRatingIsEnabled", ["loc", [null, [202, 26], [202, 59]]]]], [], []], "class", "toggle", "label", ["subexpr", "boolean-to-yesno", [["get", "model.roseCommentsRatingIsEnabled", ["loc", [null, [204, 42], [204, 75]]]]], [], ["loc", [null, [204, 24], [204, 76]]]], "onChange", ["subexpr", "action", ["saveSettings"], [], ["loc", [null, [205, 27], [205, 50]]]]], ["loc", [null, [202, 4], [205, 52]]]], ["inline", "t", ["studyCreator.exportConfig"], [], ["loc", [null, [208, 33], [208, 66]]]], ["inline", "t", ["studyCreator.exportConfigDesc"], [], ["loc", [null, [210, 7], [210, 44]]]], ["inline", "input", [], ["value", ["subexpr", "@mut", [["get", "model.fileName", ["loc", [null, [212, 18], [212, 32]]]]], [], []], "insert-newline", "saveSettings", "focus-out", "saveSettings"], ["loc", [null, [212, 4], [214, 38]]]], ["attribute", "class", ["concat", ["ui ", ["subexpr", "if", [["get", "exportDisabled", ["loc", [null, [217, 25], [217, 39]]]], "disabled"], [], ["loc", [null, [217, 20], [217, 52]]]], " primary button"]]], ["element", "action", ["download"], [], ["loc", [null, [217, 69], [217, 90]]]], ["inline", "t", ["action.download"], [], ["loc", [null, [218, 4], [218, 27]]]]],
        locals: [],
        templates: [child0, child1, child2]
      };
    })();
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes"]
        },
        "revision": "Ember@2.2.2",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 223,
            "column": 0
          }
        },
        "moduleName": "rose/templates/study-creator.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "class", "ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2, "class", "lab icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "sub header");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1, "class", "ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        dom.setAttribute(el2, "class", "ui dividing header");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3, "class", "ui input");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2, "class", "field");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("i");
        dom.setAttribute(el4, "class", "cloud download icon");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element25 = dom.childAt(fragment, [0, 3]);
        var element26 = dom.childAt(fragment, [2]);
        var element27 = dom.childAt(element26, [3]);
        var element28 = dom.childAt(element26, [5, 1]);
        var morphs = new Array(11);
        morphs[0] = dom.createMorphAt(element25, 1, 1);
        morphs[1] = dom.createMorphAt(dom.childAt(element25, [3]), 0, 0);
        morphs[2] = dom.createMorphAt(dom.childAt(element26, [1]), 0, 0);
        morphs[3] = dom.createMorphAt(dom.childAt(element27, [1]), 0, 0);
        morphs[4] = dom.createMorphAt(dom.childAt(element27, [3]), 0, 0);
        morphs[5] = dom.createMorphAt(dom.childAt(element27, [5]), 1, 1);
        morphs[6] = dom.createMorphAt(element27, 7, 7);
        morphs[7] = dom.createAttrMorph(element28, 'class');
        morphs[8] = dom.createElementMorph(element28);
        morphs[9] = dom.createMorphAt(element28, 3, 3);
        morphs[10] = dom.createMorphAt(element26, 7, 7);
        return morphs;
      },
      statements: [["inline", "t", ["studyCreator.title"], [], ["loc", [null, [4, 4], [4, 30]]]], ["inline", "t", ["studyCreator.subtitle"], [], ["loc", [null, [5, 28], [5, 57]]]], ["inline", "t", ["studyCreator.configurationHeader"], [], ["loc", [null, [10, 33], [10, 73]]]], ["inline", "t", ["studyCreator.repositoryUrl"], [], ["loc", [null, [13, 11], [13, 45]]]], ["inline", "t", ["studyCreator.repositoryUrlDesc"], [], ["loc", [null, [14, 7], [14, 45]]]], ["inline", "input", [], ["type", "text", "value", ["subexpr", "@mut", [["get", "model.repositoryURL", ["loc", [null, [18, 20], [18, 39]]]]], [], []], "insert-newline", "fetchBaseFile"], ["loc", [null, [17, 6], [19, 46]]]], ["block", "if", [["get", "baseFileNotFound", ["loc", [null, [22, 10], [22, 26]]]]], [], 0, null, ["loc", [null, [22, 4], [26, 11]]]], ["attribute", "class", ["concat", ["ui icon button ", ["subexpr", "if", [["get", "baseFileIsLoading", ["loc", [null, [30, 39], [30, 56]]]], "loading"], [], ["loc", [null, [30, 34], [30, 68]]]]]]], ["element", "action", ["fetchBaseFile"], [], ["loc", [null, [30, 70], [30, 96]]]], ["inline", "t", ["studyCreator.fetchRepository"], [], ["loc", [null, [32, 6], [32, 42]]]], ["block", "if", [["get", "networks.length", ["loc", [null, [36, 8], [36, 23]]]]], [], 1, null, ["loc", [null, [36, 2], [221, 9]]]]],
      locals: [],
      templates: [child0, child1]
    };
  })());
});
define('rose/transforms/array', ['exports', 'ember', 'ember-data'], function (exports, _ember, _emberData) {
  exports['default'] = _emberData['default'].Transform.extend({
    deserialize: function deserialize(serialized) {
      return _ember['default'].typeOf(serialized) == "array" ? serialized : [];
    },

    serialize: function serialize(deserialized) {
      var type = _ember['default'].typeOf(deserialized);
      if (type == 'array') {
        return deserialized;
      } else if (type == 'string') {
        return deserialized.split(',').map(function (item) {
          return _ember['default'].$.trim(item);
        });
      } else {
        return [];
      }
    }
  });
});
/*
Copyright (C) 2015
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
define("rose/transforms/fragment-array", ["exports"], function (exports) {
  exports["default"] = MF.FragmentArrayTransform;
});
define("rose/transforms/fragment", ["exports"], function (exports) {
  exports["default"] = MF.FragmentTransform;
});
define('rose/transforms/object', ['exports', 'ember-data'], function (exports, _emberData) {
  exports['default'] = _emberData['default'].Transform.extend({
    deserialize: function deserialize(serialized) {
      if (!$.isPlainObject(serialized)) {
        return {};
      } else {
        return serialized;
      }
    },

    serialize: function serialize(deserialized) {
      if (!$.isPlainObject(deserialized)) {
        return {};
      } else {
        return deserialized;
      }
    }
  });
});
/*
Copyright (C) 2016
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
define("rose/transitions/cross-fade", ["exports", "liquid-fire"], function (exports, _liquidFire) {
  exports["default"] = crossFade;

  function crossFade() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    (0, _liquidFire.stop)(this.oldElement);
    return _liquidFire.Promise.all([(0, _liquidFire.animate)(this.oldElement, { opacity: 0 }, opts), (0, _liquidFire.animate)(this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts)]);
  }

  // END-SNIPPET
});
// BEGIN-SNIPPET cross-fade-definition
define("rose/transitions/default", ["exports", "liquid-fire"], function (exports, _liquidFire) {
  exports["default"] = defaultTransition;

  // This is what we run when no animation is asked for. It just sets
  // the newly-added element to visible (because we always start them
  // out invisible so that transitions can control their initial
  // appearance).

  function defaultTransition() {
    if (this.newElement) {
      this.newElement.css({ visibility: '' });
    }
    return _liquidFire.Promise.resolve();
  }
});
define("rose/transitions/explode", ["exports", "ember", "liquid-fire"], function (exports, _ember, _liquidFire) {
  exports["default"] = explode;

  // Explode is not, by itself, an animation. It exists to pull apart
  // other elements so that each of the pieces can be targeted by
  // animations.

  function explode() {
    var _this = this;

    var seenElements = {};
    var sawBackgroundPiece = false;

    for (var _len = arguments.length, pieces = Array(_len), _key = 0; _key < _len; _key++) {
      pieces[_key] = arguments[_key];
    }

    var promises = pieces.map(function (piece) {
      if (piece.matchBy) {
        return matchAndExplode(_this, piece, seenElements);
      } else if (piece.pick || piece.pickOld || piece.pickNew) {
        return explodePiece(_this, piece, seenElements);
      } else {
        sawBackgroundPiece = true;
        return runAnimation(_this, piece);
      }
    });
    if (!sawBackgroundPiece) {
      if (this.newElement) {
        this.newElement.css({ visibility: '' });
      }
      if (this.oldElement) {
        this.oldElement.css({ visibility: 'hidden' });
      }
    }
    return _liquidFire.Promise.all(promises);
  }

  function explodePiece(context, piece, seen) {
    var childContext = _ember["default"].copy(context);
    var selectors = [piece.pickOld || piece.pick, piece.pickNew || piece.pick];
    var cleanupOld, cleanupNew;

    if (selectors[0] || selectors[1]) {
      cleanupOld = _explodePart(context, 'oldElement', childContext, selectors[0], seen);
      cleanupNew = _explodePart(context, 'newElement', childContext, selectors[1], seen);
      if (!cleanupOld && !cleanupNew) {
        return _liquidFire.Promise.resolve();
      }
    }

    return runAnimation(childContext, piece)["finally"](function () {
      if (cleanupOld) {
        cleanupOld();
      }
      if (cleanupNew) {
        cleanupNew();
      }
    });
  }

  function _explodePart(context, field, childContext, selector, seen) {
    var child, childOffset, width, height, newChild;
    var elt = context[field];

    childContext[field] = null;
    if (elt && selector) {
      child = elt.find(selector).filter(function () {
        var guid = _ember["default"].guidFor(this);
        if (!seen[guid]) {
          seen[guid] = true;
          return true;
        }
      });
      if (child.length > 0) {
        childOffset = child.offset();
        width = child.outerWidth();
        height = child.outerHeight();
        newChild = child.clone();

        // Hide the original element
        child.css({ visibility: 'hidden' });

        // If the original element's parent was hidden, hide our clone
        // too.
        if (elt.css('visibility') === 'hidden') {
          newChild.css({ visibility: 'hidden' });
        }
        newChild.appendTo(elt.parent());
        newChild.outerWidth(width);
        newChild.outerHeight(height);
        var newParentOffset = newChild.offsetParent().offset();
        newChild.css({
          position: 'absolute',
          top: childOffset.top - newParentOffset.top,
          left: childOffset.left - newParentOffset.left,
          margin: 0
        });

        // Pass the clone to the next animation
        childContext[field] = newChild;
        return function cleanup() {
          newChild.remove();
          child.css({ visibility: '' });
        };
      }
    }
  }

  function animationFor(context, piece) {
    var name, args, func;
    if (!piece.use) {
      throw new Error("every argument to the 'explode' animation must include a followup animation to 'use'");
    }
    if (_ember["default"].isArray(piece.use)) {
      name = piece.use[0];
      args = piece.use.slice(1);
    } else {
      name = piece.use;
      args = [];
    }
    if (typeof name === 'function') {
      func = name;
    } else {
      func = context.lookup(name);
    }
    return function () {
      return _liquidFire.Promise.resolve(func.apply(this, args));
    };
  }

  function runAnimation(context, piece) {
    return new _liquidFire.Promise(function (resolve, reject) {
      animationFor(context, piece).apply(context).then(resolve, reject);
    });
  }

  function matchAndExplode(context, piece, seen) {
    if (!context.oldElement || !context.newElement) {
      return _liquidFire.Promise.resolve();
    }

    // reduce the matchBy scope
    if (piece.pick) {
      context.oldElement = context.oldElement.find(piece.pick);
      context.newElement = context.newElement.find(piece.pick);
    }

    if (piece.pickOld) {
      context.oldElement = context.oldElement.find(piece.pickOld);
    }

    if (piece.pickNew) {
      context.newElement = context.newElement.find(piece.pickNew);
    }

    // use the fastest selector available
    var selector;

    if (piece.matchBy === 'id') {
      selector = function (attrValue) {
        return "#" + attrValue;
      };
    } else if (piece.matchBy === 'class') {
      selector = function (attrValue) {
        return "." + attrValue;
      };
    } else {
      selector = function (attrValue) {
        var escapedAttrValue = attrValue.replace(/'/g, "\\'");
        return "[" + piece.matchBy + "='" + escapedAttrValue + "']";
      };
    }

    var hits = _ember["default"].A(context.oldElement.find("[" + piece.matchBy + "]").toArray());
    return _liquidFire.Promise.all(hits.map(function (elt) {
      var attrValue = _ember["default"].$(elt).attr(piece.matchBy);

      // if there is no match for a particular item just skip it
      if (attrValue === "" || context.newElement.find(selector(attrValue)).length === 0) {
        return _liquidFire.Promise.resolve();
      }

      return explodePiece(context, {
        pick: selector(attrValue),
        use: piece.use
      }, seen);
    }));
  }
});
define('rose/transitions/fade', ['exports', 'liquid-fire'], function (exports, _liquidFire) {
  exports['default'] = fade;

  function fade() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var firstStep;
    var outOpts = opts;
    var fadingElement = findFadingElement(this);

    if (fadingElement) {
      // We still have some older version that is in the process of
      // fading out, so out first step is waiting for it to finish.
      firstStep = (0, _liquidFire.finish)(fadingElement, 'fade-out');
    } else {
      if ((0, _liquidFire.isAnimating)(this.oldElement, 'fade-in')) {
        // if the previous view is partially faded in, scale its
        // fade-out duration appropriately.
        outOpts = { duration: (0, _liquidFire.timeSpent)(this.oldElement, 'fade-in') };
      }
      (0, _liquidFire.stop)(this.oldElement);
      firstStep = (0, _liquidFire.animate)(this.oldElement, { opacity: 0 }, outOpts, 'fade-out');
    }
    return firstStep.then(function () {
      return (0, _liquidFire.animate)(_this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts, 'fade-in');
    });
  }

  function findFadingElement(context) {
    for (var i = 0; i < context.older.length; i++) {
      var entry = context.older[i];
      if ((0, _liquidFire.isAnimating)(entry.element, 'fade-out')) {
        return entry.element;
      }
    }
    if ((0, _liquidFire.isAnimating)(context.oldElement, 'fade-out')) {
      return context.oldElement;
    }
  }
  // END-SNIPPET
});
// BEGIN-SNIPPET fade-definition
define('rose/transitions/flex-grow', ['exports', 'liquid-fire'], function (exports, _liquidFire) {
  exports['default'] = flexGrow;

  function flexGrow(opts) {
    (0, _liquidFire.stop)(this.oldElement);
    return _liquidFire.Promise.all([(0, _liquidFire.animate)(this.oldElement, { 'flex-grow': 0 }, opts), (0, _liquidFire.animate)(this.newElement, { 'flex-grow': [1, 0] }, opts)]);
  }
});
define('rose/transitions/fly-to', ['exports', 'liquid-fire'], function (exports, _liquidFire) {
  exports['default'] = flyTo;

  function flyTo() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if (!this.newElement) {
      return _liquidFire.Promise.resolve();
    } else if (!this.oldElement) {
      this.newElement.css({ visibility: '' });
      return _liquidFire.Promise.resolve();
    }

    var oldOffset = this.oldElement.offset();
    var newOffset = this.newElement.offset();

    if (opts.movingSide === 'new') {
      var motion = {
        translateX: [0, oldOffset.left - newOffset.left],
        translateY: [0, oldOffset.top - newOffset.top],
        outerWidth: [this.newElement.outerWidth(), this.oldElement.outerWidth()],
        outerHeight: [this.newElement.outerHeight(), this.oldElement.outerHeight()]
      };
      this.oldElement.css({ visibility: 'hidden' });
      return (0, _liquidFire.animate)(this.newElement, motion, opts);
    } else {
      var motion = {
        translateX: newOffset.left - oldOffset.left,
        translateY: newOffset.top - oldOffset.top,
        outerWidth: this.newElement.outerWidth(),
        outerHeight: this.newElement.outerHeight()
      };
      this.newElement.css({ visibility: 'hidden' });
      return (0, _liquidFire.animate)(this.oldElement, motion, opts).then(function () {
        _this.newElement.css({ visibility: '' });
      });
    }
  }
});
define('rose/transitions/move-over', ['exports', 'liquid-fire'], function (exports, _liquidFire) {
  exports['default'] = moveOver;

  function moveOver(dimension, direction, opts) {
    var _this = this;

    var oldParams = {},
        newParams = {},
        firstStep,
        property,
        measure;

    if (dimension.toLowerCase() === 'x') {
      property = 'translateX';
      measure = 'width';
    } else {
      property = 'translateY';
      measure = 'height';
    }

    if ((0, _liquidFire.isAnimating)(this.oldElement, 'moving-in')) {
      firstStep = (0, _liquidFire.finish)(this.oldElement, 'moving-in');
    } else {
      (0, _liquidFire.stop)(this.oldElement);
      firstStep = _liquidFire.Promise.resolve();
    }

    return firstStep.then(function () {
      var bigger = biggestSize(_this, measure);
      oldParams[property] = bigger * direction + 'px';
      newParams[property] = ["0px", -1 * bigger * direction + 'px'];

      return _liquidFire.Promise.all([(0, _liquidFire.animate)(_this.oldElement, oldParams, opts), (0, _liquidFire.animate)(_this.newElement, newParams, opts, 'moving-in')]);
    });
  }

  function biggestSize(context, dimension) {
    var sizes = [];
    if (context.newElement) {
      sizes.push(parseInt(context.newElement.css(dimension), 10));
      sizes.push(parseInt(context.newElement.parent().css(dimension), 10));
    }
    if (context.oldElement) {
      sizes.push(parseInt(context.oldElement.css(dimension), 10));
      sizes.push(parseInt(context.oldElement.parent().css(dimension), 10));
    }
    return Math.max.apply(null, sizes);
  }
});
define("rose/transitions/scale", ["exports", "liquid-fire"], function (exports, _liquidFire) {
  exports["default"] = scale;

  function scale() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return (0, _liquidFire.animate)(this.oldElement, { scale: [0.2, 1] }, opts).then(function () {
      return (0, _liquidFire.animate)(_this.newElement, { scale: [1, 0.2] }, opts);
    });
  }
});
define("rose/transitions/scroll-then", ["exports", "ember", "liquid-fire/is-browser"], function (exports, _ember, _liquidFireIsBrowser) {
  exports["default"] = function (nextTransitionName, options) {
    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      rest[_key - 2] = arguments[_key];
    }

    var _this = this;

    if ((0, _liquidFireIsBrowser["default"])()) {
      _ember["default"].assert("You must provide a transition name as the first argument to scrollThen. Example: this.use('scrollThen', 'toLeft')", 'string' === typeof nextTransitionName);

      var el = document.getElementsByTagName('html');
      var nextTransition = this.lookup(nextTransitionName);
      if (!options) {
        options = {};
      }

      _ember["default"].assert("The second argument to scrollThen is passed to Velocity's scroll function and must be an object", 'object' === typeof options);

      // set scroll options via: this.use('scrollThen', 'ToLeft', {easing: 'spring'})
      options = _ember["default"].merge({ duration: 500, offset: 0 }, options);

      // additional args can be passed through after the scroll options object
      // like so: this.use('scrollThen', 'moveOver', {duration: 100}, 'x', -1);

      return window.$.Velocity(el, 'scroll', options).then(function () {
        nextTransition.apply(_this, rest);
      });
    }
  };
});
define("rose/transitions/to-down", ["exports", "rose/transitions/move-over"], function (exports, _roseTransitionsMoveOver) {
  exports["default"] = function (opts) {
    return _roseTransitionsMoveOver["default"].call(this, 'y', 1, opts);
  };
});
define("rose/transitions/to-left", ["exports", "rose/transitions/move-over"], function (exports, _roseTransitionsMoveOver) {
  exports["default"] = function (opts) {
    return _roseTransitionsMoveOver["default"].call(this, 'x', -1, opts);
  };
});
define("rose/transitions/to-right", ["exports", "rose/transitions/move-over"], function (exports, _roseTransitionsMoveOver) {
  exports["default"] = function (opts) {
    return _roseTransitionsMoveOver["default"].call(this, 'x', 1, opts);
  };
});
define("rose/transitions/to-up", ["exports", "rose/transitions/move-over"], function (exports, _roseTransitionsMoveOver) {
  exports["default"] = function (opts) {
    return _roseTransitionsMoveOver["default"].call(this, 'y', -1, opts);
  };
});
define('rose/transitions/wait', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = function (ms) {
    var _this = this;

    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return new _ember['default'].RSVP.Promise(function (resolve) {
      setTimeout(function () {
        resolve(_this.lookup(opts.then || 'default').call(_this));
      }, ms);
    });
  };
});
define('rose/utils/i18n/compile-template', ['exports', 'ember-i18n/utils/i18n/compile-template'], function (exports, _emberI18nUtilsI18nCompileTemplate) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nCompileTemplate['default'];
    }
  });
});
define('rose/utils/i18n/missing-message', ['exports', 'ember-i18n/utils/i18n/missing-message'], function (exports, _emberI18nUtilsI18nMissingMessage) {
  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _emberI18nUtilsI18nMissingMessage['default'];
    }
  });
});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('rose/config/environment', ['ember'], function(Ember) {
  var prefix = 'rose';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (!runningTests) {
  require("rose/app")["default"].create({});
}

/* jshint ignore:end */
//# sourceMappingURL=rose.map