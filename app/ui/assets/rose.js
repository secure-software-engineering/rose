/* jshint ignore:start */

/* jshint ignore:end */

define('rose/adapters/application', ['exports', 'ember', 'ember-localforage-adapter/adapters/localforage'], function (exports, Ember, LFAdapter) {

  'use strict';

  exports['default'] = LFAdapter['default'].extend({
    loadData: function loadData() {
      var adapter = this;
      return new Ember['default'].RSVP.Promise(function (resolve, reject) {
        kango.invokeAsyncCallback('localforage.getItem', adapter.adapterNamespace(), function (storage) {
          var resolved = storage ? storage : {};
          resolve(resolved);
        });
      });
    },

    persistData: function persistData(type, data) {
      var adapter = this;
      var modelNamespace = this.modelNamespace(type);
      return new Ember['default'].RSVP.Promise(function (resolve, reject) {
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
        promise = new Ember['default'].RSVP.resolve(cache);
      } else {
        promise = new Ember['default'].RSVP.Promise(function (resolve, reject) {
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
define('rose/adapters/comment', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'Comments',
    modelNamespace: 'Comment'
  });

});
define('rose/adapters/extractor', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'Extractors',
    modelNamespace: 'Extractor'
  });

});
define('rose/adapters/interaction', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'Interactions',
    modelNamespace: 'Interaction'
  });

});
define('rose/adapters/kango-adapter', ['exports', 'ember', 'ember-data', 'rose/adapters/utils/queue'], function (exports, Ember, DS, LFQueue) {

  'use strict';

  exports['default'] = DS['default'].Adapter.extend({
    queue: LFQueue['default'].create(),

    createRecord: function createRecord(store, type, snapshot) {
      var collectionNamespace = this.collectionNamespace;
      var modelNamespace = this.modelNamespace;
      var id = snapshot.id;
      var serializer = store.serializerFor(snapshot.modelName);
      var recordHash = serializer.serialize(snapshot, { includeId: true });

      return this.queue.attach(function (resolve) {
        kango.invokeAsyncCallback('localforage.getItem', collectionNamespace, function (list) {
          if (Ember['default'].isEmpty(list)) {
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

    findAll: function findAll() {
      return getList(this.collectionNamespace).then(function (comments) {
        if (Ember['default'].isEmpty(comments)) {
          return [];
        }

        var promises = [];

        comments.forEach(function (id) {
          promises.push(getItem(id));
        });

        return Ember['default'].RSVP.all(promises).then(function (comments) {
          return comments.map(function (comment) {
            comment.rating = [].concat(comment.rating);
            return comment;
          });
        });
      });
    },

    find: function find(store, type, id, snapshot) {
      var adapter = this;

      return getItem(adapter.modelNamespace + '/' + id);
    },

    findQuery: function findQuery(store, type, query, recordArray) {
      return getList(this.collectionNamespace).then(function (comments) {
        if (Ember['default'].isEmpty(comments)) {
          return [];
        }

        var promises = [];

        comments.forEach(function (id) {
          promises.push(getItem(id));
        });

        return Ember['default'].RSVP.all(promises).then(function (comments) {
          return comments.filter(function (comment) {
            var result = false;

            Object.keys(query).forEach(function (key) {
              result = comment[key] == query[key];
            });

            return result;
          });
        });
      });
    },

    deleteRecord: function deleteRecord(store, type, snapshot) {
      var id = snapshot.id;
      return this.removeItem(id);
    },

    updateRecord: function updateRecord(store, type, snapshot) {
      var id = snapshot.id;
      var modelNamespace = this.modelNamespace;
      var recordHash = snapshot.serialize({ includeId: true });

      return this.queue.attach(function (resolve, reject) {
        kango.invokeAsyncCallback('localforage.setItem', modelNamespace + '/' + id, recordHash, function () {
          resolve();
        });
      });
    },

    removeItem: function removeItem(id) {
      var collectionNamespace = this.collectionNamespace;
      var modelNamespace = this.modelNamespace;

      return this.queue.attach(function (resolve, reject) {
        kango.invokeAsyncCallback('localforage.getItem', collectionNamespace, function (collection) {
          if (!Ember['default'].isEmpty(collection)) {
            var index = collection.indexOf(modelNamespace + '/' + id);

            if (index > -1) {
              collection.splice(index, 1);

              kango.invokeAsyncCallback('localforage.setItem', collectionNamespace, collection, function () {
                kango.invokeAsyncCallback('localforage.removeItem', modelNamespace + '/' + id, function () {
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
    return new Ember['default'].RSVP.Promise(function (resolve, reject) {
      kango.invokeAsyncCallback('localforage.getItem', namespace, function (list) {
        resolve(list);
      });
    });
  }

  function getItem(id) {
    return new Ember['default'].RSVP.Promise(function (resolve, reject) {
      kango.invokeAsyncCallback('localforage.getItem', id, function (item) {
        resolve(item);
      });
    });
  }

});
define('rose/adapters/network', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'Networks',
    modelNamespace: 'Network'
  });

});
define('rose/adapters/observer', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'Observers',
    modelNamespace: 'Observer'
  });

});
define('rose/adapters/system-config', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'systemConfigs',
    modelNamespace: 'systemConfig'
  });

});
define('rose/adapters/user-setting', ['exports', 'rose/adapters/kango-adapter'], function (exports, KangoAdapter) {

  'use strict';

  exports['default'] = KangoAdapter['default'].extend({
    collectionNamespace: 'userSettings',
    modelNamespace: 'userSetting'
  });

});
define('rose/adapters/utils/queue', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var Promise = Ember['default'].RSVP.Promise;

  exports['default'] = Ember['default'].Object.extend({
    queue: [Promise.resolve()],

    attach: function attach(callback) {
      var _this = this;

      var queueKey = this.queue.length;

      this.queue[queueKey] = new Ember['default'].RSVP.Promise(function (resolve, reject) {
        _this.queue[queueKey - 1].then(function () {
          _this.queue.splice(queueKey, 1);
          callback(resolve, reject);
        });
      });

      return this.queue[queueKey];
    }
  });

});
define('rose/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'rose/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('rose/components/high-charts', ['exports', 'ember-highcharts/components/high-charts'], function (exports, HighCharts) {

	'use strict';

	exports['default'] = HighCharts['default'];

});
define('rose/components/lf-outlet', ['exports', 'liquid-fire/ember-internals'], function (exports, ember_internals) {

	'use strict';

	exports['default'] = ember_internals.StaticOutlet;

});
define('rose/components/lf-overlay', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var COUNTER = '__lf-modal-open-counter';

  exports['default'] = Ember['default'].Component.extend({
    tagName: 'span',
    classNames: ['lf-overlay'],

    didInsertElement: function didInsertElement() {
      var body = Ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.addClass('lf-modal-open');
      body.data(COUNTER, counter + 1);
    },

    willDestroy: function willDestroy() {
      var body = Ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.data(COUNTER, counter - 1);
      if (counter < 2) {
        body.removeClass('lf-modal-open');
      }
    }
  });

});
define('rose/components/liquid-bind', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var LiquidBind = Ember['default'].Component.extend({
    tagName: '',
    positionalParams: ['value'] // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
  });

  LiquidBind.reopenClass({
    positionalParams: ['value']
  });

  exports['default'] = LiquidBind;

});
define('rose/components/liquid-child', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
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
define('rose/components/liquid-container', ['exports', 'ember', 'liquid-fire/growable', 'rose/components/liquid-measured'], function (exports, Ember, Growable, liquid_measured) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend(Growable['default'], {
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

    startMonitoringSize: Ember['default'].on('didInsertElement', function () {
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
        this._cachedSize = liquid_measured.measure(elt);

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
            sizes[i] = liquid_measured.measure(versions[i].view.$());
          }
        }

        // Measure ourself again to see how big the new children make
        // us.
        var want = liquid_measured.measure(elt);
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
      size = liquid_measured.measure(elt);
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
define('rose/components/liquid-if', ['exports', 'ember', 'liquid-fire/ember-internals'], function (exports, Ember, ember_internals) {

  'use strict';

  var LiquidIf = Ember['default'].Component.extend({
    positionalParams: ['predicate'], // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
    tagName: '',
    helperName: 'liquid-if',
    didReceiveAttrs: function didReceiveAttrs() {
      this._super();
      var predicate = ember_internals.shouldDisplay(this.getAttr('predicate'));
      this.set('showFirstBlock', this.inverted ? !predicate : predicate);
    }
  });

  LiquidIf.reopenClass({
    positionalParams: ['predicate']
  });

  exports['default'] = LiquidIf;

});
define('rose/components/liquid-measured', ['exports', 'liquid-fire/components/liquid-measured'], function (exports, liquid_measured) {

	'use strict';



	exports.default = liquid_measured.default;
	exports.measure = liquid_measured.measure;

});
define('rose/components/liquid-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ['liquid-modal'],
    currentContext: Ember['default'].computed('owner.modalContexts.lastObject', function () {
      var context = this.get('owner.modalContexts.lastObject');
      if (context) {
        context.view = this.innerView(context);
      }
      return context;
    }),

    owner: Ember['default'].inject.service('liquid-fire-modals'),

    innerView: function innerView(current) {
      var self = this,
          name = current.get('name'),
          container = this.get('container'),
          component = container.lookup('component-lookup:main').lookupFactory(name);
      Ember['default'].assert("Tried to render a modal using component '" + name + "', but couldn't find it.", !!component);

      var args = Ember['default'].copy(current.get('params'));

      args.registerMyself = Ember['default'].on('init', function () {
        self.set('innerViewInstance', this);
      });

      // set source so we can bind other params to it
      args._source = Ember['default'].computed(function () {
        return current.get("source");
      });

      var otherParams = current.get("options.otherParams");
      var from, to;
      for (from in otherParams) {
        to = otherParams[from];
        args[to] = Ember['default'].computed.alias("_source." + from);
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
        var source = this.get('currentContext.source'),
            proto = source.constructor.proto(),
            params = this.get('currentContext.options.withParams'),
            clearThem = {};

        for (var key in params) {
          if (proto[key] instanceof Ember['default'].ComputedProperty) {
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
define('rose/components/liquid-outlet', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var LiquidOutlet = Ember['default'].Component.extend({
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
define('rose/components/liquid-spacer', ['exports', 'liquid-fire/components/liquid-spacer'], function (exports, liquid_spacer) {

	'use strict';



	exports.default = liquid_spacer.default;

});
define('rose/components/liquid-unless', ['exports', 'rose/components/liquid-if'], function (exports, LiquidIf) {

  'use strict';

  exports['default'] = LiquidIf['default'].extend({
    helperName: 'liquid-unless',
    layoutName: 'components/liquid-if',
    inverted: true
  });

});
define('rose/components/liquid-versions', ['exports', 'ember', 'liquid-fire/ember-internals'], function (exports, Ember, ember_internals) {

  'use strict';

  var get = Ember['default'].get;
  var set = Ember['default'].set;

  exports['default'] = Ember['default'].Component.extend({
    tagName: "",
    name: 'liquid-versions',

    transitionMap: Ember['default'].inject.service('liquid-fire-transitions'),

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
        versions = Ember['default'].A();
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
        parentElement: Ember['default'].$(ember_internals.containingElement(this)),
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
define('rose/components/liquid-with', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var LiquidWith = Ember['default'].Component.extend({
    name: 'liquid-with',
    positionalParams: ['value'], // needed for Ember 1.13.[0-5] and 2.0.0-beta.[1-3] support
    tagName: '',
    iAmDeprecated: Ember['default'].on('init', function () {
      Ember['default'].deprecate("liquid-with is deprecated, use liquid-bind instead -- it accepts a block now.");
    })
  });

  LiquidWith.reopenClass({
    positionalParams: ['value']
  });

  exports['default'] = LiquidWith;

});
define('rose/components/lm-container', ['exports', 'ember', 'liquid-fire/tabbable'], function (exports, Ember) {

  'use strict';

  /*
     Parts of this file were adapted from ic-modal

     https://github.com/instructure/ic-modal
     Released under The MIT License (MIT)
     Copyright (c) 2014 Instructure, Inc.
  */

  var lastOpenedModal = null;
  Ember['default'].$(document).on('focusin', handleTabIntoBrowser);

  function handleTabIntoBrowser() {
    if (lastOpenedModal) {
      lastOpenedModal.focus();
    }
  }

  exports['default'] = Ember['default'].Component.extend({
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
define('rose/components/ui-accordion', ['exports', 'semantic-ui-ember/components/ui-accordion'], function (exports, Accordion) {

	'use strict';

	exports['default'] = Accordion['default'];

});
define('rose/components/ui-checkbox', ['exports', 'semantic-ui-ember/components/ui-checkbox'], function (exports, Checkbox) {

	'use strict';

	exports['default'] = Checkbox['default'];

});
define('rose/components/ui-dropdown-item', ['exports', 'semantic-ui-ember/components/ui-dropdown-item'], function (exports, DropdownItem) {

	'use strict';

	exports['default'] = DropdownItem['default'];

});
define('rose/components/ui-dropdown', ['exports', 'semantic-ui-ember/components/ui-dropdown'], function (exports, Dropdown) {

	'use strict';

	exports['default'] = Dropdown['default'];

});
define('rose/components/ui-embed', ['exports', 'semantic-ui-ember/components/ui-embed'], function (exports, Embed) {

	'use strict';

	exports['default'] = Embed['default'];

});
define('rose/components/ui-modal', ['exports', 'semantic-ui-ember/components/ui-modal'], function (exports, Modal) {

	'use strict';

	exports['default'] = Modal['default'];

});
define('rose/components/ui-nag', ['exports', 'semantic-ui-ember/components/ui-nag'], function (exports, Nag) {

	'use strict';

	exports['default'] = Nag['default'];

});
define('rose/components/ui-popup', ['exports', 'semantic-ui-ember/components/ui-popup'], function (exports, Popup) {

	'use strict';

	exports['default'] = Popup['default'];

});
define('rose/components/ui-progress', ['exports', 'semantic-ui-ember/components/ui-progress'], function (exports, Progress) {

	'use strict';

	exports['default'] = Progress['default'];

});
define('rose/components/ui-radio', ['exports', 'semantic-ui-ember/components/ui-radio'], function (exports, Radio) {

	'use strict';

	exports['default'] = Radio['default'];

});
define('rose/components/ui-rating', ['exports', 'semantic-ui-ember/components/ui-rating'], function (exports, Rating) {

	'use strict';

	exports['default'] = Rating['default'];

});
define('rose/components/ui-search', ['exports', 'semantic-ui-ember/components/ui-search'], function (exports, Search) {

	'use strict';

	exports['default'] = Search['default'];

});
define('rose/components/ui-shape', ['exports', 'semantic-ui-ember/components/ui-shape'], function (exports, Shape) {

	'use strict';

	exports['default'] = Shape['default'];

});
define('rose/components/ui-sidebar', ['exports', 'semantic-ui-ember/components/ui-sidebar'], function (exports, Sidebar) {

	'use strict';

	exports['default'] = Sidebar['default'];

});
define('rose/components/ui-sticky', ['exports', 'semantic-ui-ember/components/ui-sticky'], function (exports, Sticky) {

	'use strict';

	exports['default'] = Sticky['default'];

});
define('rose/controllers/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
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

        var payload = JSON.parse(data);
        payload.id = 0;

        this.store.find('system-config', { id: 0 }).then(function (configs) {
          if (!Ember['default'].isEmpty(configs)) {
            return configs.get('firstObject').destroyRecord();
          }
        }).then(function () {
          kango.dispatchMessage('LoadNetworks', payload.networks);
          delete payload.networks;
          return _this.store.createRecord('system-config', payload).save();
        }).then(function () {
          return _this.send('cancelWizard');
        });
      }
    }
  });

});
define('rose/controllers/array', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('rose/controllers/backup', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    jsonData: (function () {
      var result = {};

      var models = this.get('model');

      models.forEach(function (model) {
        result[model.type] = model.data;
      });

      result['export-date'] = new Date().toJSON();

      return JSON.stringify(result, null, 4);
    }).property('model'),

    actions: {
      openModal: function openModal(name) {
        Ember['default'].$('.ui.' + name + '.modal').modal('show');
      },

      download: function download() {
        window.saveAs(new Blob([this.get('jsonData')]), 'rose-data.txt');
      },

      approveModal: function approveModal() {
        var _this = this;

        ['comment', 'interaction', 'diary-entry'].forEach(function (type) {
          return _this.store.find(type).then(function (records) {
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
define('rose/controllers/comments', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: Ember['default'].computed.sort('model', 'listSorting')
  });

});
define('rose/controllers/diary', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: Ember['default'].computed.sort('model', 'listSorting'),

    diaryInputIsEmpty: Ember['default'].computed.empty('diaryInput'),

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
define('rose/controllers/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    clickChartOptions: {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Mouse Clicks'
      },
      xAxis: {
        ordinal: false
      },
      yAxis: {
        title: {
          text: 'Number of Clicks'
        },
        allowDecimals: false
      }
    },

    clickChartData: Ember['default'].computed('model', function () {
      var model = this.get('model');
      var data = model[0];

      if (data) {
        return [{
          data: data.map(function (record) {
            return [record.date, record.value];
          })
        }];
      }
    }),

    mouseMoveChartOptions: {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Mouse Movement'
      },
      xAxis: {
        ordinal: false
      },
      yAxis: {
        title: {
          text: 'Distance in Pixels'
        },
        allowDecimals: false
      }
    },

    mouseMoveChartData: Ember['default'].computed('model', function () {
      var model = this.get('model');
      var data = model[1];

      if (data) {
        return [{
          data: data.map(function (record) {
            return [record.date, record.value];
          })
        }];
      }
    }),

    scrollChartOptions: {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Page Scroll'
      },
      xAxis: {
        ordinal: false
      },
      yAxis: {
        title: {
          text: 'Distance in Pixels'
        },
        allowDecimals: false
      }
    },

    scrollChartData: Ember['default'].computed('model', function () {
      var model = this.get('model');
      var data = model[2];

      if (data) {
        return [{
          data: data.map(function (record) {
            return [record.date, record.value];
          })
        }];
      }
    }),

    windowChartOptions: {
      chart: {
        type: 'line',
        zoomType: 'x'
      },
      title: {
        text: 'Window Activity'
      },
      xAxis: {
        ordinal: false
      },
      yAxis: {
        title: {
          text: 'Window Status'
        },
        allowDecimals: false
      },
      navigator: {
        series: {
          type: 'column'
        }
      }
    },

    windowChartData: Ember['default'].computed('model', function () {
      var model = this.get('model');
      var data = model[3];

      if (data) {
        return [{
          step: true,
          data: data.map(function (record) {
            var status = (function (value) {
              if (value.open && value.active) return 2;else if (value.open && !value.active) return 1;else if (!value.open && !value.active) return 0;else throw new Error('window activity tracker data is corrupt');
            })(record.value);
            return [record.date, status];
          })
        }];
      }
    }),

    loginChartOptions: {
      chart: {
        type: 'line',
        zoomType: 'x'
      },
      title: {
        text: 'Login Status'
      },
      xAxis: {
        ordinal: false
      },
      yAxis: {
        title: {
          text: 'Distance in Pixels'
        },
        allowDecimals: false
      },
      navigator: {
        series: {
          type: 'column'
        }
      }
    },

    loginChartData: Ember['default'].computed('model', function () {
      var model = this.get('model');
      var data = model[4];

      if (data) {
        return [{
          step: true,
          data: data.map(function (record) {
            var status = (function (value) {
              if (!value) return 0;else return 1;
            })(record.value);
            return [record.date, status];
          })
        }];
      }
    })
  });

});
define('rose/controllers/interactions', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    listSorting: ['createdAt:desc'],
    sortedList: Ember['default'].computed.sort('model', 'listSorting')
  });

});
define('rose/controllers/object', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('rose/controllers/settings', ['exports', 'ember', 'rose/locales/languages'], function (exports, Ember, languages) {

  'use strict';

  var Promise = Ember['default'].RSVP.Promise;

  exports['default'] = Ember['default'].Controller.extend({
    availableLanguages: languages['default'],
    updateIntervals: [{ label: 'hourly', value: 3600000 }, { label: 'daily', value: 86400000 }, { label: 'weekly', value: 604800000 }, { label: 'monthly', value: 2629743830 }, { label: 'yearly', value: 31556926000 }],

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

        kango.dispatchMessage('Update');

        kango.addMessageListener('update-result', function (e) {
          _this.get('settings.system').reload().then(function () {
            kango.removeMessageListener('update-result');
          });
        });
      },

      openModal: function openModal(name) {
        Ember['default'].$('.ui.' + name + '.modal').modal('show');
      },

      approveModal: function approveModal() {
        var _this2 = this;

        return Promise.all([this.store.find('extractor').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.store.find('network').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.store.find('observer').then(function (records) {
          return records.invoke('destroyRecord');
        }), this.get('settings.user').destroyRecord(), this.get('settings.system').destroyRecord()]).then(function () {
          return _this2.get('settings').setup();
        }).then(function () {
          return _this2.transitionToRoute('index');
        });
      }
    }
  });

});
define('rose/controllers/study-creator', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    baseFileIsLoading: false,
    networks: [],

    updateIntervals: [{ label: 'hourly', value: 3600000 }, { label: 'daily', value: 86400000 }, { label: 'weekly', value: 604800000 }, { label: 'monthly', value: 2629743830 }, { label: 'yearly', value: 31556926000 }],

    getExtractors: function getExtractors(url) {
      return Ember['default'].$.getJSON(url).then(function (list) {
        return list.map(function (item) {
          return Ember['default'].Object.create(item);
        });
      });
    },

    getObservers: function getObservers(url) {
      return Ember['default'].$.getJSON(url).then(function (list) {
        return list.map(function (item) {
          return Ember['default'].Object.create(item);
        });
      });
    },

    actions: {
      saveSettings: function saveSettings() {
        this.get('model').save();
      },

      saveNetworkSettings: function saveNetworkSettings(network) {
        network.value.save();
      },

      download: function download() {
        var networks = this.get('networks').filterBy('isEnabled', true).map(function (network) {
          return JSON.parse(JSON.stringify(network));
        }).map(function (network) {
          if (network.extractors) {
            network.extractors = network.extractors.filter(function (extractor) {
              return extractor.isEnabled;
            });
          }
          if (network.observers) {
            network.observers = network.observers.filter(function (observer) {
              return observer.isEnabled;
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

        this.set('networks', []);

        var url = this.get('model.repositoryURL');
        Ember['default'].$.getJSON(url + 'base.json').then(function (baseJSON) {
          if (baseJSON.networks) {
            var networks = baseJSON.networks;
            networks.forEach(function (network) {
              Ember['default'].RSVP.Promise.all([_this.getExtractors(url + network.extractors), _this.getObservers(url + network.observers)]).then(function (results) {
                network.extractors = results[0];
                network.observers = results[1];
                _this.get('networks').pushObject(Ember['default'].Object.create(network));
              });
            });
          }
        });
      },

      enableAll: function enableAll(itemList) {
        itemList.forEach(function (item) {
          return item.set('isEnabled', true);
        });
      },

      disableAll: function disableAll(itemList) {
        itemList.forEach(function (item) {
          return item.set('isEnabled', false);
        });
      }
    }
  });

});
define('rose/defaults/study-creator', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    roseCommentsIsEnabled: true,
    roseCommentsRatingIsEnabled: true,
    salt: 'ROSE',
    hashLength: 8,
    repositoryURL: 'https://secure-software-engineering.github.io/rose/example/',
    fingerprint: '25E769C697EC2C20DA3BDDE9F188CF170FA234E8',
    autoUpdateIsEnabled: true,
    updateInterval: 86400000,
    fileName: 'rose-study-configuration.txt'
  };

});
define('rose/helpers/and', ['exports', 'ember', 'ember-truth-helpers/helpers/and'], function (exports, Ember, and) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(and.andHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(and.andHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/boolean-to-yesno', ['exports', 'ember', 'ember-i18n'], function (exports, Ember, ember_i18n) {

  'use strict';

  exports.booleanToYesno = booleanToYesno;

  function booleanToYesno(params) {
    return params[0] ? ember_i18n.translationMacro('on') : ember_i18n.translationMacro('off');
  }

  exports['default'] = Ember['default'].HTMLBars.makeBoundHelper(booleanToYesno);

});
define('rose/helpers/eq', ['exports', 'ember', 'ember-truth-helpers/helpers/equal'], function (exports, Ember, equal) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(equal.equalHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(equal.equalHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/gt', ['exports', 'ember', 'ember-truth-helpers/helpers/gt'], function (exports, Ember, gt) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(gt.gtHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(gt.gtHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/gte', ['exports', 'ember', 'ember-truth-helpers/helpers/gte'], function (exports, Ember, gte) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(gte.gteHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(gte.gteHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/is-array', ['exports', 'ember', 'ember-truth-helpers/helpers/is-array'], function (exports, Ember, is_array) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(is_array.isArrayHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(is_array.isArrayHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/lt', ['exports', 'ember', 'ember-truth-helpers/helpers/lt'], function (exports, Ember, lt) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(lt.ltHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(lt.ltHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/lte', ['exports', 'ember', 'ember-truth-helpers/helpers/lte'], function (exports, Ember, lte) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(lte.lteHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(lte.lteHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/moment-duration', ['exports', 'ember-moment/helpers/moment-duration'], function (exports, moment_duration) {

	'use strict';



	exports.default = moment_duration.default;

});
define('rose/helpers/moment-format', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-format'], function (exports, Ember, config, Helper) {

  'use strict';

  exports['default'] = Helper['default'].extend({
    globalOutputFormat: Ember['default'].get(config['default'], 'moment.outputFormat'),
    globalAllowEmpty: !!Ember['default'].get(config['default'], 'moment.allowEmpty')
  });

});
define('rose/helpers/moment-from-now', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-from-now'], function (exports, Ember, config, Helper) {

  'use strict';

  exports['default'] = Helper['default'].extend({
    globalAllowEmpty: !!Ember['default'].get(config['default'], 'moment.allowEmpty')
  });

});
define('rose/helpers/moment-to-now', ['exports', 'ember', 'rose/config/environment', 'ember-moment/helpers/moment-to-now'], function (exports, Ember, config, Helper) {

  'use strict';

  exports['default'] = Helper['default'].extend({
    globalAllowEmpty: !!Ember['default'].get(config['default'], 'moment.allowEmpty')
  });

});
define('rose/helpers/not-eq', ['exports', 'ember', 'ember-truth-helpers/helpers/not-equal'], function (exports, Ember, not_equal) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(not_equal.notEqualHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(not_equal.notEqualHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/not', ['exports', 'ember', 'ember-truth-helpers/helpers/not'], function (exports, Ember, not) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(not.notHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(not.notHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/or', ['exports', 'ember', 'ember-truth-helpers/helpers/or'], function (exports, Ember, or) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(or.orHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(or.orHelper);
  }

  exports['default'] = forExport;

});
define('rose/helpers/xor', ['exports', 'ember', 'ember-truth-helpers/helpers/xor'], function (exports, Ember, xor) {

  'use strict';

  var forExport = null;

  if (Ember['default'].Helper) {
    forExport = Ember['default'].Helper.helper(xor.xorHelper);
  } else if (Ember['default'].HTMLBars.makeBoundHelper) {
    forExport = Ember['default'].HTMLBars.makeBoundHelper(xor.xorHelper);
  }

  exports['default'] = forExport;

});
define('rose/initializers/app-version', ['exports', 'rose/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;
  var registered = false;

  exports['default'] = {
    name: 'App Version',
    initialize: function initialize(container, application) {
      if (!registered) {
        var appName = classify(application.toString());
        Ember['default'].libraries.register(appName, config['default'].APP.version);
        registered = true;
      }
    }
  };

});
define('rose/initializers/ember-i18n', ['exports', 'rose/instance-initializers/ember-i18n'], function (exports, instanceInitializer) {

  'use strict';

  exports['default'] = {
    name: instanceInitializer['default'].name,

    initialize: function initialize(registry, application) {
      if (application.instanceInitializer) {
        return;
      }

      instanceInitializer['default'].initialize(application);
    }
  };

});
define('rose/initializers/export-application-global', ['exports', 'ember', 'rose/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (config['default'].exportApplicationGlobal !== false) {
      var value = config['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember['default'].String.classify(config['default'].modulePrefix);
      }

      if (!window[globalName]) {
        window[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete window[globalName];
          }
        });
      }
    }
  }

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('rose/initializers/i18n', ['exports', 'ember-i18n-inject/initializers/i18n'], function (exports, i18n) {

	'use strict';



	exports.default = i18n.default;
	exports.initialize = i18n.initialize;

});
define('rose/initializers/kango-api', ['exports'], function (exports) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
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
define('rose/initializers/liquid-fire', ['exports', 'liquid-fire/router-dsl-ext', 'liquid-fire/ember-internals'], function (exports, __dep0__, ember_internals) {

  'use strict';

  // This initializer exists only to make sure that the following
  // imports happen before the app boots.
  ember_internals.registerKeywords();

  exports['default'] = {
    name: 'liquid-fire',
    initialize: function initialize() {}
  };

});
define('rose/initializers/settings', ['exports'], function (exports) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        application.inject('route', 'settings', 'service:settings');
        application.inject('controller', 'settings', 'service:settings');
    }

    exports['default'] = {
        name: 'settings',
        initialize: initialize
    };

});
define('rose/initializers/truth-helpers', ['exports', 'ember', 'ember-truth-helpers/utils/register-helper', 'ember-truth-helpers/helpers/and', 'ember-truth-helpers/helpers/or', 'ember-truth-helpers/helpers/equal', 'ember-truth-helpers/helpers/not', 'ember-truth-helpers/helpers/is-array', 'ember-truth-helpers/helpers/not-equal', 'ember-truth-helpers/helpers/gt', 'ember-truth-helpers/helpers/gte', 'ember-truth-helpers/helpers/lt', 'ember-truth-helpers/helpers/lte'], function (exports, Ember, register_helper, and, or, equal, not, is_array, not_equal, gt, gte, lt, lte) {

  'use strict';

  exports.initialize = initialize;

  function initialize() /* container, application */{

    // Do not register helpers from Ember 1.13 onwards, starting from 1.13 they
    // will be auto-discovered.
    if (Ember['default'].Helper) {
      return;
    }

    register_helper.registerHelper('and', and.andHelper);
    register_helper.registerHelper('or', or.orHelper);
    register_helper.registerHelper('eq', equal.equalHelper);
    register_helper.registerHelper('not', not.notHelper);
    register_helper.registerHelper('is-array', is_array.isArrayHelper);
    register_helper.registerHelper('not-eq', not_equal.notEqualHelper);
    register_helper.registerHelper('gt', gt.gtHelper);
    register_helper.registerHelper('gte', gte.gteHelper);
    register_helper.registerHelper('lt', lt.ltHelper);
    register_helper.registerHelper('lte', lte.lteHelper);
  }

  exports['default'] = {
    name: 'truth-helpers',
    initialize: initialize
  };

});
define('rose/instance-initializers/ember-i18n', ['exports', 'ember', 'ember-i18n/legacy-helper', 'ember-i18n/helper', 'rose/config/environment'], function (exports, Ember, legacyHelper, Helper, ENV) {

  'use strict';

  exports['default'] = {
    name: 'ember-i18n',

    initialize: function initialize(instance) {
      var defaultLocale = (ENV['default'].i18n || {}).defaultLocale;
      if (defaultLocale === undefined) {
        Ember['default'].warn('ember-i18n did not find a default locale; falling back to "en".');
        defaultLocale = 'en';
      }
      instance.container.lookup('service:i18n').set('locale', defaultLocale);

      if (legacyHelper['default'] != null) {
        Ember['default'].HTMLBars._registerHelper('t', legacyHelper['default']);
      }

      if (Helper['default'] != null) {
        instance.registry.register('helper:t', Helper['default']);
      }
    }
  };

});
define('rose/liquid-fire/tests/modules/liquid-fire/action.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/action.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/action.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/animate.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/animate.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/animate.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/components/liquid-measured.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire/components');
  test('modules/liquid-fire/components/liquid-measured.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/components/liquid-measured.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/components/liquid-spacer.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire/components');
  test('modules/liquid-fire/components/liquid-spacer.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/components/liquid-spacer.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/constrainables.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/constrainables.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/constrainables.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/constraint.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/constraint.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/constraint.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/constraints.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/constraints.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/constraints.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/dsl.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/dsl.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/dsl.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/ember-internals.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/ember-internals.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/ember-internals.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/growable.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/growable.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/growable.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/index.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/index.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/index.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/internal-rules.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/internal-rules.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/internal-rules.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/modal.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/modal.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/modal.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/modals.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/modals.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/modals.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/mutation-observer.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/mutation-observer.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/mutation-observer.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/promise.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/promise.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/promise.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/router-dsl-ext.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/router-dsl-ext.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/router-dsl-ext.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/rule.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/rule.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/rule.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/running-transition.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/running-transition.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/running-transition.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/tabbable.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/tabbable.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/tabbable.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/transition-map.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/transition-map.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/transition-map.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/velocity-ext.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/velocity-ext.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/velocity-ext.js should pass jshint.');
  });

});
define('rose/liquid-fire/tests/modules/liquid-fire/version-warnings.jshint', function () {

  'use strict';

  module('JSHint - modules/liquid-fire');
  test('modules/liquid-fire/version-warnings.js should pass jshint', function () {
    ok(true, 'modules/liquid-fire/version-warnings.js should pass jshint.');
  });

});
define('rose/locales/de/config', ['exports'], function (exports) {

  'use strict';

  // Ember-I18n inclues configuration for common locales. Most users
  // can safely delete this file. Use it if you need to override behavior
  // for a locale or define behavior for a locale that Ember-I18n
  // doesn't know about.
  exports['default'] = {
    // rtl: [true|FALSE],
    //
    // pluralForm: function(count) {
    //   if (count === 0) { return 'zero'; }
    //   if (count === 1) { return 'one'; }
    //   if (count === 2) { return 'two'; }
    //   if (count < 5) { return 'few'; }
    //   if (count >= 5) { return 'many'; }
    //   return 'other';
    // }
  };

});
define('rose/locales/de/translations', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    // General
    and: "and",
    yes: "Yes",
    no: "No",
    on: "On",
    off: "Off",

    action: {
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      hide: "Hide",
      unhide: "Unhide",
      "delete": "Delete",
      download: "Download",
      details: "Details"
    },

    // Sidebar Menu
    sidebarMenu: {
      diary: "Diary",
      backup: "Backup",
      settings: "Settings",
      comments: "Comments",
      interactions: "Interactions",
      privacySettings: "Privacy Settings",
      networks: "Networks",
      more: "More",
      help: "Help",
      about: "About",
      extraFeatures: "Extra Features",
      studyCreator: "Study Creator"
    },

    wizard: {
      header: "Welcome to ROSE",
      description: "In this step we first need to configure ROSE to work properly.",
      configOptions: "Choose one option to configure ROSE.",
      defaultConfig: "Take the default configuration.",
      fileConfig: "Select a configuration file...",
      fileConfigBtn: "Choose file",
      urlConfig: "Specifiy a URL to an ROSE repository..."
    },

    // Diary Page
    diary: {
      title: "Diary",
      subtitle: "Here you can make a note of everything else that attracted your attention"
    },

    // Backup Page
    backup: {
      title: "Data Backup",
      subtitle: "Here you can review, save or restore all data you supplied or which was recorded by ROSE"
    },

    // Settings Page
    settings: {
      title: "Einstellungen",
      subtitle: "Hier können Sie Ihre ROSE Einstellungen anpassen",
      language: "Language",
      languageLabel: "Choose your preferred language. ROSE can also adopt the browser language (\"auto detect\" option).",
      commentReminder: "Comment Reminder",
      commentReminderLabel: "ROSE can ocassionally display reminders to remember you to comment on your actions if that is required by the study you are participating in. You can deactivate this features if it disturbs you.",
      extraFeatures: "Extra Features",
      extraFeaturesLabel: "ROSE has additional features for field researchers and ROSE developers. These features are normally not visible, but can be activated here.",
      resetRose: "ROSE Zurücksetzen",
      resetRoseLabel: "Here you can reset ROSE's configurations. The initialization wizard will appear again asking you to load either a default configuration or a specific study configuration file."
    },

    // Comments Page
    comments: {
      title: "Comments",
      subtitle: "Have a look at all your comments",

      you: "You",
      commentedOn: "commented on"
    },

    // Interactions Page
    interactions: {
      title: "Interactions",
      subtitle: "All your recent interactions",
      actionOn: "action on"
    },

    // Privacy Settings Page
    privacySettings: {
      title: "Privacy Settings",
      subtitle: "Have a look at your privacy settings"
    },

    // Help Page
    help: {
      title: "Usage notes",
      subtitle: "Frequently asked questions about ROSE",

      issue1: {
        question: "Where does ROSE collect the data about my Facebook usage and my inserted comments?",
        answer: "<p>ROSE exclusively collects data in your web browser. ROSE can provide a pre-assembled Mail which you can use to transmit your data to the study advisor. ROSE does not transmit data to Facebook; Facebook can not detect your usage of ROSE with their computer systems. ROSE neither transmits data itself to the study advisor nor receives them.</p><p>There is a disadvantage of this privacy aware concept of ROSE, though: ROSE data can be lost in case system bugs emerge on your computer. With the deletion of ROSE from your web browser all stored data is irretrievably lost.</p>"
      },
      issue2: {
        question: "Are my ROSE study comments visible for other study participants or Facebook users?",
        answer: "<p>No, this is impossible for technical reasons. The distribution and therefore visibility for other study participants or Facebook users is impossible because ROSE does not transmit data to Facebook computer systems or to the study advisory. ROSE does not receive data either. Furthermore, Facebook can not even find out about whether you are using ROSE or not. Even though ROSE has a close integration in your web browser and the Facebook interface and therefore is much alike to the &quot;real&quot; Facebook functions this &quot;illusion of an extended Facebook&quot; completely and exclusively takes place in your web browser with ROSE.</p>"
      },
      issue3: {
        question: "Which data is being recorded by ROSE?",
        answer: "<p>ROSE records the following data:</p><ul><li><b>Date and time of interactions in Facebook</b>, e.g., the time the study participant publishes a story item on his/her Timeline.</li><li><b>Type of interaction</b>, e.g., &quot;creating a story item&quot;.</li><li><b>Unique identifiers</b>, which mark the context of interactions. Identifiers are an eight-digit combination of letters and numbers, e.g., &quot;2a2d6fc3&quot;. With commenting on a picture the identifiers correspond to the picture you commented on. Thereby the study advisory can detect if multiple study participants commented on the same picture without ever learning about the content of this picture.</li><li><b>Privacy settings concerning interactions</b>, e.g. whether a story item is visible for &quot;Friends&quot;only or for &quot;Everyone&quot;.</li><li><b>Diary entries.</b></li><li><b>ROSE study comments.</b></li><li><b>Privacy settings in general.</b></li></ul>"
      },
      issue4: {
        question: "Does ROSE collect data which I am sharing with my friends on Facebook?",
        answer: "<p>No. ROSE does not collect any data which you are sharing with your friends on Facebook. ROSE does not collect any content-related information, e.g., pictures, links, messages on Timelines, chat messages, or the names of groups you attended. ROSE only collects data about the usage of a type of action, e.g. if you are commenting on a picture. In the analysis the study advisors are only able to see that you made use of an action. The study advisors only asses that you made use of a type of action, but does not see if you are commenting on a picture of a polar bear or if you are commenting on a picture showing a friend of yours who is at a party. If you like to record information on the content of an action in order to explain why you made use of a specific action, please use the ROSE comments or your diary.</p>"
      },
      issue5: {
        question: "How do I control which interaction data ROSE collected?",
        answer: "<p>You may easily check this by using the user interface (menu item &quot;interaction tracking&quot;). Moreover you may read which data was collected by ROSE, when you are transferring your data to the study advisors. Even though it is a compact text-based data format, you may easily check that no personal data is transmitted.</p>"
      },
      issue6: {
        question: "How can I be sure that ROSE makes my data anonymous?",
        answer: "<p>ROSE data does not contain any information which refers to the Facebook user who created this data. ROSE does not save any Facebook user names or pictures’ and videos’ URLs provided by users. Thus ROSE data does not differ from ethnographically elicited and anonymised data, such as interviews. Anyways, saving content-related information would no be very sufficient as it does no allow contextual analysis</p>"
      },
      issue7: {
        question: "May I review the source code to check previous declarations?",
        answer: "<p>Yes. ROSE is a free, open-source software under GPL-license (General Public License). You may review the source code and you may change and process it on the conditions of the GPL. In favor of needing assistance, please contact the study advisors.</p>"
      },
      issue8: {
        question: "May I use ROSE for personal purposes after the study ended?",
        answer: "<p>Yes. You may continue using ROSE and process it without hesitation as it does not send any information to the study advisors automatically. Thereto please note the GPL license’s conditions. However, after the study ended we are not able to endorse you by using the software, e.g. providing ROSE updates.</p>"
      }
    },

    // About Page
    about: {
      title: "About ROSE",
      subtitle: "Information about ROSE",
      description: "ROSE is a browser extension to support empirical Field studies by recording users' interactions with the social network Facebook for a limited period of time. Please consider the help page for further information on ROSE's functioning.",
      developedBy: "is developed by",

      address: {
        name: "Fraunhofer Institute for Secure Information Technology SIT",
        street: "Rheinstrasse 75",
        country: "Germany"
      },

      forQuestions: "For questions about ROSE feel free to contact",
      licenceNotice: "This program is free software;you can redistribute it and/or modify it under the terms of the GNU General Public License version as published by the Free Software Foundation;either version 3 of the License, or (at your option) any later version."
    },

    // Study Creator Page
    studyCreator: {
      title: 'Study Creator',
      subtitle: 'LALALALALALALa',

      roseComments: "ROSE Comments",
      roseCommentsDesc: "Check if the ROSE Comments function should be available",
      roseCommentsRating: "ROSE Comments Rating",
      roseCommentsRatingDesc: "Check if the ROSE Comments rating function should be available",
      salt: "Salt",
      saltDesc: "Whats the purpose of this settings?",
      hashLength: "Hash Length",
      hashLengthDesc: "Whats the purpose of this settings?",
      repositoryUrl: "Repository URL",
      repositoryUrlDesc: "Whats the purpose of this settings?",
      autoUpdate: "Automatically Update Observers from Repository",
      autoUpdateDesc: "Whats the purpose of this settings?",
      exportConfig: "Export Configuration",
      exportConfigDesc: "Export configuration to file",
      fingerprint: "Fingerabdruck",
      fingerprintDesc: "Whats the purpose of this settings?"
    }
  };

});
define('rose/locales/en/config', ['exports'], function (exports) {

  'use strict';

  // Ember-I18n inclues configuration for common locales. Most users
  // can safely delete this file. Use it if you need to override behavior
  // for a locale or define behavior for a locale that Ember-I18n
  // doesn't know about.
  exports['default'] = {
    // rtl: [true|FALSE],
    //
    // pluralForm: function(count) {
    //   if (count === 0) { return 'zero'; }
    //   if (count === 1) { return 'one'; }
    //   if (count === 2) { return 'two'; }
    //   if (count < 5) { return 'few'; }
    //   if (count >= 5) { return 'many'; }
    //   return 'other';
    // }
  };

});
define('rose/locales/en/translations', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    // General
    and: "and",
    yes: "Yes",
    no: "No",
    on: "On",
    off: "Off",

    action: {
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      hide: "Hide",
      unhide: "Unhide",
      "delete": "Delete",
      download: "Download",
      details: "Details",
      reset: "Reset",
      update: "Update",
      confirm: "Confirm"
    },

    // Sidebar Menu
    sidebarMenu: {
      diary: "Diary",
      backup: "Data Management",
      settings: "Settings",
      comments: "Comments",
      interactions: "Interactions",
      privacySettings: "Privacy Settings",
      networks: "Networks",
      more: "More",
      help: "Help",
      about: "About",
      extraFeatures: "Researcher Features",
      studyCreator: "Study Creator"
    },

    wizard: {
      header: "Welcome to ROSE",
      description: "In this step we first need to configure ROSE to work properly.",
      configOptions: "Choose one of the following two options to configure ROSE before your first use.",
      defaultConfigHeader: "Use the default configuration",
      defaultConfigDescription: "I have no configuration file to customize ROSE.",
      defaultBtn: "Use the default configuration",
      fileConfigHeader: "Use a configuration file",
      fileConfigDescription: "I have a customized configuration file for initializing ROSE.",
      fileConfigBtn: "Load the configuration file",
      urlConfig: "Specifiy a URL to an ROSE repository..."
    },

    // Diary Page
    diary: {
      title: "Diary",
      subtitle: "Here you can take notes of everything that attracted your attention"
    },

    // Data Management aka Backup Page
    backup: {
      title: "Data Management",
      subtitle: "Clear, review, or download all data history recorded by ROSE.",
      resetData: "Clear history",
      resetDataLabel: "Remove all data collected by ROSE.",
      "export": "Export data",
      exportLabel: "Save and download the data history to a single file locally on your computer."
    },

    resetDataModal: {
      question: "Confirm removal of all collected data",
      warning: "Are you sure you want to delete all data collected? This action cannot be undone."
    },

    // Settings Page
    settings: {
      title: "Settings",
      subtitle: "Manage the configuration of ROSE.",
      language: "Language",
      languageLabel: "Choose your preferred language, or use the default language from the browser (“auto detect” option).",
      commentReminder: "Comment reminder",
      commentReminderLabel: "ROSE will occasionally display a message at the bottom of the screen to remind you to comment on your actions if the research study requires you to do so. You can deactivate this feature if it disturbs you.",
      extraFeatures: "Features for researchers and developers",
      extraFeaturesLabel: "ROSE has additional features for field researchers and ROSE developers. These features are not visible unless activated here.",
      resetRose: "Reset ROSE configuration",
      resetRoseLabel: "If you reset the configuration of ROSE, the initialization wizard will appear again. You can choose to either use the default configuration or load a specific study configuration file.",
      manualUpdate: "Manual configuration update",
      manualUpdateLabel: "Social media sites change their webpage design from time to time. ROSE requires an update to work properly when these changes occur. To trigger an update manually, press the “update” button.",
      autoUpdate: "Automatic configuration update",
      autoUpdateLabel: "For automatic updates to recent changes in social media sites, switch on the automatic update function."
    },

    resetConfigModal: {
      question: "Confirm resetting the configuration of ROSE",
      warning: "Are you sure you want to reset the configuration of ROSE. This action will bring you back to the configuration wizard. All collected data will remain unchanged."
    },

    // Comments Page
    comments: {
      title: "Comments",
      subtitle: "All comments you have entered using the comment sidebar.",

      you: "You",
      commentedOn: "commented on"
    },

    // Interactions Page
    interactions: {
      title: "Interactions",
      subtitle: "All your recent interactions on this social media site recorded by ROSE.",
      actionOn: "action on"
    },

    // Privacy Settings Page
    privacySettings: {
      title: "Privacy Settings",
      subtitle: "Your privacy settings for this social media site recorded by ROSE."
    },

    // Help Page
    help: {
      title: "Help",
      subtitle: "Frequently asked questions about ROSE",

      issue1: {
        question: "Where does ROSE collect the data about my social media sites' usage and my comments from?",
        answer: "<p>ROSE collects data from and stores data in your web browser. There is no automatic transmission of data between ROSE and the social media sites, or between ROSE and the researchers of the study. ROSE will provide a pre-assembled option through which you can send your data to the researchers.</p><p>There is a disadvantage as a result of this privacy-aware design of ROSE. Since data is stored locally with no automatic uploading, it can get lost in the case of system errors on your computer, or in the case of accidental deletion of ROSE from your web browser. Data is irretrievable once it is lost.</p>"
      },
      issue2: {
        question: "Are my ROSE study comments visible to other study participants or my social media site friends?",
        answer: "<p>No, the comments you make through ROSE are invisible to other study participants or your social media site friends. For technical reasons, ROSE does not transmit data to the server of the social media sites or to the researchers of the study. ROSE does not receive data from any other source either. Though ROSE is integrated in your web browser and the social media sites interface, thus appearing like “real” social media site functions, it completely and exclusively functions in your web browser. There is no way for the social media sites to detect whether or not you are using ROSE.</p>"
      },
      issue3: {
        question: "What types of data are recorded by ROSE?",
        answer: "<p>ROSE records the following types of data:</p><ul><li>Date and time of interactions on social media sites, i.e., the time the study participant engages in an interaction. </li><li>Type of interaction, e.g., “liking content,” “viewing a profile,” “sharing content.”</li><li>Unique identifiers, eight-digit combinations of letters and numbers (e.g., \"2a2d6fc3\") that correspond to each story item (e.g., a picture, a status update) the study participant interacted with. With the identifiers, researchers can detect when multiple study participants interact with the same story item. But the researchers will not know the content of the item.</li><li>Privacy settings concerning interactions, e.g. whether a story item is visible for “Friends” only or for the public.</li><li>Diary entries.</li><li>ROSE study comments.</li><li>Privacy settings in general.</li></ul>"
      },
      issue4: {
        question: "Does ROSE collect the actual content I share with my friends on social media sites?",
        answer: "<p>No. ROSE does not collect any content information, such as pictures, links, or messages on Timelines; chat messages; or the name of groups you attended. ROSE only collects data about the usage of a type of interaction, e.g., whether you commented on a picture, or whether you engaged in a chat with a  friend. In the analysis, researchers are only able to see whether you engaged in an interaction, the timestamp, and the type of interaction. For example, researchers can see that you commented on a picture, but they will not know whether the picture is about a polar bear or friends at a party. If you would like to report information regarding the content of an interaction in order to explain why you made use of a specific action, please use the ROSE comments function or the diary function.</p>"
      },
      issue5: {
        question: "How do I control what types of interaction ROSE collect?",
        answer: "<p>You can easily check the types of interaction recorded from the ROSE user interface (menu item “Interactions”). When you export and share your data with the researchers, you can also view all data collected in the compact text-based data format. You will see from the exported data file that there is no personal data collected.</p>"
      },
      issue6: {
        question: "How can I be sure that ROSE makes my data anonymous?",
        answer: "<p>ROSE data does not contain any information identifying the social media site user who created the data. ROSE does not save any social media site user names, pictures, or videos provided by users. Thus, ROSE data is similar to anonymized data collected through other means, such as anonymous interviews. </p>"
      },
      issue7: {
        question: "May I review the source code to check previous declarations?",
        answer: "<p>Yes. ROSE is free, open-source software under GPL-license (General Public License). You may review the source code, change, or process it under the conditions of the GPL. Should you need assistance, please contact the project advisor. </p>"
      },
      issue8: {
        question: "May I use ROSE for personal purposes after the study ends?",
        answer: "<p>Yes. You may continue using ROSE for your own records, as it does not send any information to the researchers automatically. Please note the GPL license’s conditions. However, after the completion of the study, we will not be able to provide any assistance, such as providing ROSE updates.</p>"
      }
    },

    // About Page
    about: {
      title: "About ROSE",
      subtitle: "Information about ROSE",
      description: "ROSE is a browser extension to support empirical field studies by recording users' interactions with social media sites for a limited period of time. Please refer to the Help page for further information on the functions and use of ROSE.",
      developedBy: "ROSE is developed by",

      address: {
        name: "Fraunhofer Institute for Secure Information Technology SIT",
        street: "Rheinstrasse 75",
        country: "Germany"
      },

      forQuestions: "For questions about ROSE, feel free to contact project advisor:",
      licenceNotice: "This program is free software. You can redistribute it and/or modify it under the terms of the GNU General Public License (version 3 or above) as published by the Free Software Foundation."
    },

    // Study Creator Page
    studyCreator: {
      title: 'Study Creator',
      subtitle: 'With this page you can create a tailored configuration file for your study. You can distribute this configuration file to you study participants; by loading this file into their installations of ROSE participants can adapt their ROSE instances to the specific needs of your empirical study.',

      roseComments: "In-situ comments",
      roseCommentsDesc: "Check this if ROSE's in-situ comment function should be available to participants. Currently the in-situ comment function works only for Facebook.",
      roseCommentsRating: "Add in-situ rating option",
      roseCommentsRatingDesc: "Check this if the in-situ comment function should also ask for rating content.",
      salt: "Cryptographic salt for content identifiers",
      saltDesc: "ROSE records pseudonymous identifiers for user content that allow researchers to re-identify content without a need to reveal it. These identfiers are derived from user-entered content and a cryptographic salt. As a cryptographic salt you can enter any arbitray text string, for example \"ROSE123\" or whatever else you like. However, make sure that in case you investigate a group of participants all use the same salt in their ROSE configuration. Otherwise you can not correlate identifiers among participants afterwards.",
      hashLength: "Content identifier length",
      hashLengthDesc: "Here you can specify the length of the pseudonymous identifiers created by ROSE. You need to balance participants' privacy and the uniqueness of identifiers: the shorter the identifier the more secure they are; the longer the identifiers the more unique they are. Every digit adds a factor of 16 to the space of possible identifiers for your study. For example, setting the option to 4 allows for 16*16*16*16=65536 unique identifiers for your study. 5 is a good value if you are unsure how to use this option.",
      repositoryUrl: "URL of pattern repository",
      repositoryUrlDesc: "ROSE gets its patterns to match user interactions to specific interaction types from a pattern repository. Here you can enter the URL of this repository.",
      autoUpdate: "Automatically update patterns during study",
      autoUpdateDesc: "While the patterns are usually only pushed to ROSE when the configuration file is loaded into participants' instances of ROSE, it is also possible to continously update them while the study is running. This might be necessary for long-term studies, if the user interface of the investigated social media site changes.",
      exportConfig: "Export configuration file",
      exportConfigDesc: "Here you can export a configuration file with all the settings entered on this page. Your participants can load this file into their installations of ROSE.",
      fingerprint: "Pattern repository signing key fingerprint",
      fingerprintDesc: "For reasons of security, the patterns stored in the pattern repository need to be signed with a RSA private key. This signature is validated before ROSE loads any patterns. Please enter the fingerprint of the public key ROSE shall use to verify the digital signature."
    }
  };

});
define('rose/locales/languages', ['exports'], function (exports) {

	'use strict';

	exports['default'] = [{ name: "Auto detect", code: "auto" }, { name: "English", code: "en" }, { name: "Deutsch", code: "de" }];

});
define('rose/models/comment', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  var model = DS['default'].Model.extend({
    text: DS['default'].attr('string'),
    createdAt: DS['default'].attr('string', { defaultValue: function defaultValue() {
        return new Date().toJSON();
      } }),
    checkbox: DS['default'].attr('array'),
    updatedAt: DS['default'].attr(),
    isPrivate: DS['default'].attr('boolean'),
    rating: DS['default'].attr('array'),
    contentId: DS['default'].attr('string'),
    type: DS['default'].attr('string'),
    network: DS['default'].attr()
  });

  exports['default'] = model;

});
define('rose/models/diary-entry', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  var model = DS['default'].Model.extend({
    text: DS['default'].attr('string'),
    createdAt: DS['default'].attr('string', { defaultValue: function defaultValue() {
        return new Date().toJSON();
      } }),
    updatedAt: DS['default'].attr(),
    isPrivate: DS['default'].attr('boolean', { defaultValue: false })
  });

  exports['default'] = model;

});
define('rose/models/extractor', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    network: DS['default'].attr()
  });

});
define('rose/models/interaction', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    createdAt: DS['default'].attr('string'),
    origin: DS['default'].attr(),
    sharerId: DS['default'].attr('string'),
    isPrivate: DS['default'].attr('boolean')
  });

});
define('rose/models/network', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    name: DS['default'].attr('string'),
    descriptiveName: DS['default'].attr('string'),
    identifier: DS['default'].attr('string'),
    isEnabled: DS['default'].attr('boolean')
  });

});
define('rose/models/observer', ['exports', 'ember-data'], function (exports, DS) {

	'use strict';

	exports['default'] = DS['default'].Model.extend({});

});
define('rose/models/study-creator-setting', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    roseCommentsIsEnabled: DS['default'].attr('boolean'),
    roseCommentsRatingIsEnabled: DS['default'].attr('boolean'),
    salt: DS['default'].attr('string'),
    hashLength: DS['default'].attr('number', { defaultValue: 8 }),
    repositoryURL: DS['default'].attr('string'),
    autoUpdateIsEnabled: DS['default'].attr('boolean'),
    fileName: DS['default'].attr('string', { defaultValue: 'rose-study-configuration.txt' }),
    networks: DS['default'].hasMany('network', { async: true }),
    fingerprint: DS['default'].attr('string'),
    updateInterval: DS['default'].attr('number')
  });

});
define('rose/models/system-config', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    autoUpdateIsEnabled: DS['default'].attr('boolean'),
    roseCommentsIsEnabled: DS['default'].attr('boolean'),
    roseCommentsRatingIsEnabled: DS['default'].attr('boolean'),
    salt: DS['default'].attr('string'),
    hashLength: DS['default'].attr('number'),
    repositoryURL: DS['default'].attr('string'),
    updateInterval: DS['default'].attr('number'),
    fingerprint: DS['default'].attr('string'),
    fileName: DS['default'].attr('string'),
    timestamp: DS['default'].attr('number')
  });

});
define('rose/models/user-setting', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    commentReminderIsEnabled: DS['default'].attr('boolean'),
    developerModeIsEnabled: DS['default'].attr('boolean'),
    currentLanguage: DS['default'].attr('string', { defaultValue: 'en' }),
    firstRun: DS['default'].attr('boolean', { defaultValue: 'true' })
  });

});
define('rose/pods/components/diary-entry/component', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
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
        this.set('model.updatedAt', new Date().toJSON());
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
define('rose/pods/components/diary-entry/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","ui form");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          return morphs;
        },
        statements: [
          ["inline","textarea",[],["value",["subexpr","@mut",[["get","model.text",["loc",[null,[11,23],[11,33]]]]],[],[]]],["loc",[null,[11,6],[11,35]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["content","model.text",["loc",[null,[14,4],[14,18]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child2 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[1] = dom.createMorphAt(element3,1,1);
          morphs[2] = dom.createElementMorph(element4);
          morphs[3] = dom.createMorphAt(element4,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["save"],[],["loc",[null,[19,7],[19,24]]]],
          ["inline","t",["action.save"],[],["loc",[null,[20,6],[20,25]]]],
          ["element","action",["cancel"],[],["loc",[null,[22,7],[22,26]]]],
          ["inline","t",["action.cancel"],[],["loc",[null,[23,6],[23,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child3 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[1] = dom.createMorphAt(element2,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["edit"],[],["loc",[null,[26,7],[26,24]]]],
          ["inline","t",["action.edit"],[],["loc",[null,[27,6],[27,25]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child4 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[1] = dom.createMorphAt(element1,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["unhide"],[],["loc",[null,[31,7],[31,26]]]],
          ["inline","t",["action.unhide"],[],["loc",[null,[32,6],[32,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child5 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[1] = dom.createMorphAt(element0,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["hide"],[],["loc",[null,[35,7],[35,24]]]],
          ["inline","t",["action.hide"],[],["loc",[null,[36,6],[36,25]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"class","avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","circular file text outline icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","text disabled");
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
        dom.setAttribute(el2,"class","actions");
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
        morphs[0] = dom.createMorphAt(dom.childAt(element5, [1, 1]),0,0);
        morphs[1] = dom.createMorphAt(dom.childAt(element5, [3]),1,1);
        morphs[2] = dom.createMorphAt(element6,1,1);
        morphs[3] = dom.createMorphAt(element6,2,2);
        morphs[4] = dom.createElementMorph(element7);
        morphs[5] = dom.createMorphAt(element7,1,1);
        return morphs;
      },
      statements: [
        ["inline","moment-format",[["get","model.createdAt",["loc",[null,[6,39],[6,54]]]]],[],["loc",[null,[6,23],[6,56]]]],
        ["block","liquid-if",[["get","isEditable",["loc",[null,[9,15],[9,25]]]]],[],0,1,["loc",[null,[9,2],[15,16]]]],
        ["block","if",[["get","isEditable",["loc",[null,[18,8],[18,18]]]]],[],2,3,["loc",[null,[18,2],[29,9]]]],
        ["block","if",[["get","model.isPrivate",["loc",[null,[30,8],[30,23]]]]],[],4,5,["loc",[null,[30,2],[38,9]]]],
        ["element","action",["delete"],[],["loc",[null,[39,7],[39,26]]]],
        ["inline","t",["action.delete"],[],["loc",[null,[40,6],[40,27]]]]
      ],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5]
    };
  }()));

});
define('rose/pods/components/file-input-button/component', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    actions: {
      openFileChooser: function openFileChooser() {
        this.$('input').click();
      },

      onread: function onread(data) {
        this.sendAction('onread', data);
      }
    }
  });

});
define('rose/pods/components/file-input-button/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        "moduleName": "rose/pods/components/file-input-button/template.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("button");
        dom.setAttribute(el1,"class","ui primary bottom attached button");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
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
        var element0 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createElementMorph(element0);
        morphs[1] = dom.createMorphAt(element0,1,1);
        morphs[2] = dom.createMorphAt(fragment,2,2,contextualElement);
        return morphs;
      },
      statements: [
        ["element","action",["openFileChooser"],[],["loc",[null,[1,50],[1,78]]]],
        ["content","yield",["loc",[null,[2,2],[2,11]]]],
        ["inline","file-input",[],["class","hidden","onread","onread"],["loc",[null,[4,0],[4,45]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/pods/components/file-input/component', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].TextField.extend({
    type: 'file',

    change: function change() {
      var _this = this;

      var input = event.target;
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var data = e.target.result;
          _this.sendAction('onread', data);
        };
        reader.readAsText(input.files[0]);
      }
    }
  });

});
define('rose/pods/components/file-input/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/file-input/template.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["content","yield",["loc",[null,[1,0],[1,9]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/pods/components/installation-wizard/component', ['exports', 'ember', 'ic-ajax'], function (exports, Ember, ic_ajax) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    actions: {
      cancel: function cancel() {
        this.sendAction('cancel');
      },

      saveConfig: function saveConfig(data) {
        this.sendAction('onsuccess', data);
      },

      openFileChooser: function openFileChooser() {
        this.$('input.hidden').click();
      },

      onread: function onread(data) {
        this.sendAction('onsuccess', data);
      },

      selectDefaultConfig: function selectDefaultConfig() {
        var _this = this;

        var src = kango.io.getResourceUrl('res/defaults/rose-configuration.json');
        ic_ajax.request(src).then(function (json) {
          _this.sendAction('onsuccess', json);
        });
      }
    }
  });

});
define('rose/pods/components/installation-wizard/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 43,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/installation-wizard/template.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","ui two column centered grid");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","column");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","ui segment form");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h2");
        dom.setAttribute(el4,"class","ui dividing header");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("i");
        dom.setAttribute(el5,"class","download icon");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5,"class","content");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6,"class","sub header");
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
        var el4 = dom.createElement("div");
        dom.setAttribute(el4,"class","ui two cards");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5,"class","card");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6,"class","content");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7,"class","header");
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7,"class","description");
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
        var el6 = dom.createElement("button");
        dom.setAttribute(el6,"class","ui primary bottom attached button");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5,"class","card");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6,"class","content");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7,"class","header");
        var el8 = dom.createComment("");
        dom.appendChild(el7, el8);
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("div");
        dom.setAttribute(el7,"class","description");
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
        var el6 = dom.createElement("button");
        dom.setAttribute(el6,"class","ui primary bottom attached button");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("i");
        dom.setAttribute(el7,"class","add icon");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
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
        var element0 = dom.childAt(fragment, [0, 1, 1]);
        var element1 = dom.childAt(element0, [1, 3]);
        var element2 = dom.childAt(element0, [3]);
        var element3 = dom.childAt(element2, [1]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [3]);
        var element6 = dom.childAt(element2, [3]);
        var element7 = dom.childAt(element6, [1]);
        var element8 = dom.childAt(element6, [3]);
        var morphs = new Array(11);
        morphs[0] = dom.createMorphAt(element1,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element4, [1]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element4, [3]),1,1);
        morphs[4] = dom.createElementMorph(element5);
        morphs[5] = dom.createMorphAt(element5,1,1);
        morphs[6] = dom.createMorphAt(dom.childAt(element7, [1]),0,0);
        morphs[7] = dom.createMorphAt(dom.childAt(element7, [3]),1,1);
        morphs[8] = dom.createElementMorph(element8);
        morphs[9] = dom.createMorphAt(element8,3,3);
        morphs[10] = dom.createMorphAt(element6,5,5);
        return morphs;
      },
      statements: [
        ["inline","t",["wizard.header"],[],["loc",[null,[7,10],[7,31]]]],
        ["inline","t",["wizard.description"],[],["loc",[null,[8,34],[8,60]]]],
        ["inline","t",["wizard.defaultConfigHeader"],[],["loc",[null,[15,32],[15,66]]]],
        ["inline","t",["wizard.defaultConfigDescription"],[],["loc",[null,[17,14],[17,53]]]],
        ["element","action",["selectDefaultConfig"],[],["loc",[null,[21,18],[21,50]]]],
        ["inline","t",["wizard.defaultBtn"],[],["loc",[null,[22,12],[22,37]]]],
        ["inline","t",["wizard.fileConfigHeader"],[],["loc",[null,[27,32],[27,63]]]],
        ["inline","t",["wizard.fileConfigDescription"],[],["loc",[null,[29,14],[29,50]]]],
        ["element","action",["openFileChooser"],[],["loc",[null,[33,18],[33,46]]]],
        ["inline","t",["wizard.fileConfigBtn"],[],["loc",[null,[35,12],[35,40]]]],
        ["inline","file-input",[],["class","hidden","onread","onread"],["loc",[null,[37,10],[37,55]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/pods/components/rose-comment/component', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    isEditable: false,
    classNames: ['comment'],

    viewport: Ember['default'].computed('model.checkbox', function () {
      debugger;
      var boxes = this.get('model.checkbox') || [];

      if (boxes.length) {
        if (boxes[0]) return 'Newsfeed';
        if (boxes[1]) return 'Personal profile';
        if (boxes[2]) return 'Public page';
      }

      return 'Unkown';
    }),

    interested: Ember['default'].computed('model.checkbox', function () {
      var boxes = this.get('model.checkbox') || [];

      if (boxes.length) {
        if (boxes[3]) return 'Yes';
        if (boxes[4]) return 'No';
      }

      return 'Unkown';
    }),

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
        this.set('model.updatedAt', new Date().toJSON());
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
define('rose/pods/components/rose-comment/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("strong");
          var el2 = dom.createTextNode("posting: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          return morphs;
        },
        statements: [
          ["content","model.contentId",["loc",[null,[7,23],[7,42]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 4
            },
            "end": {
              "line": 10,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
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
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          return morphs;
        },
        statements: [
          ["content","model.type",["loc",[null,[9,14],[9,28]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child2 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 4
            },
            "end": {
              "line": 18,
              "column": 4
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","rating");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("i");
          dom.setAttribute(el2,"class","star icon");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),3,3);
          return morphs;
        },
        statements: [
          ["content","value",["loc",[null,[16,6],[16,15]]]]
        ],
        locals: ["value"],
        templates: []
      };
    }());
    var child3 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 21,
              "column": 2
            },
            "end": {
              "line": 25,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","ui form");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          return morphs;
        },
        statements: [
          ["inline","textarea",[],["value",["subexpr","@mut",[["get","model.text",["loc",[null,[23,23],[23,33]]]]],[],[]]],["loc",[null,[23,6],[23,35]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child4 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 26,
                "column": 4
              },
              "end": {
                "line": 28,
                "column": 4
              }
            },
            "moduleName": "rose/pods/components/rose-comment/template.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","ui segment");
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
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 0]),0,0);
            return morphs;
          },
          statements: [
            ["content","model.text",["loc",[null,[27,33],[27,47]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","if",[["get","model.text",["loc",[null,[26,10],[26,20]]]]],[],0,null,["loc",[null,[26,4],[28,11]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child5 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 30,
              "column": 2
            },
            "end": {
              "line": 32,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  Viewport: ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("strong");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(" - Interested: ");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
          return morphs;
        },
        statements: [
          ["content","viewport",["loc",[null,[31,20],[31,32]]]],
          ["content","interested",["loc",[null,[31,64],[31,78]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child6 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 35,
              "column": 2
            },
            "end": {
              "line": 42,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element3,1,1);
          morphs[2] = dom.createElementMorph(element4);
          morphs[3] = dom.createMorphAt(element4,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["save"],[],["loc",[null,[36,7],[36,24]]]],
          ["inline","t",["action.save"],[],["loc",[null,[37,6],[37,25]]]],
          ["element","action",["cancel"],[],["loc",[null,[39,7],[39,26]]]],
          ["inline","t",["action.cancel"],[],["loc",[null,[40,6],[40,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child7 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 42,
              "column": 2
            },
            "end": {
              "line": 46,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element2,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["edit"],[],["loc",[null,[43,7],[43,24]]]],
          ["inline","t",["action.edit"],[],["loc",[null,[44,6],[44,25]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child8 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 47,
              "column": 2
            },
            "end": {
              "line": 51,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element1,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["unhide"],[],["loc",[null,[48,7],[48,26]]]],
          ["inline","t",["action.unhide"],[],["loc",[null,[49,6],[49,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child9 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 51,
              "column": 2
            },
            "end": {
              "line": 55,
              "column": 2
            }
          },
          "moduleName": "rose/pods/components/rose-comment/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element0,1,1);
          return morphs;
        },
        statements: [
          ["element","action",["hide"],[],["loc",[null,[52,7],[52,24]]]],
          ["inline","t",["action.hide"],[],["loc",[null,[53,6],[53,25]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 61,
            "column": 0
          }
        },
        "moduleName": "rose/pods/components/rose-comment/template.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"class","avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","circular comment icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"class","author");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","date");
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
        dom.setAttribute(el2,"class","text");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","actions");
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
        var element7 = dom.childAt(element5, [9]);
        var element8 = dom.childAt(element5, [11]);
        var element9 = dom.childAt(element8, [4]);
        var morphs = new Array(11);
        morphs[0] = dom.createMorphAt(dom.childAt(element5, [1]),0,0);
        morphs[1] = dom.createMorphAt(element5,3,3);
        morphs[2] = dom.createMorphAt(element5,5,5);
        morphs[3] = dom.createMorphAt(dom.childAt(element6, [1]),0,0);
        morphs[4] = dom.createMorphAt(element6,3,3);
        morphs[5] = dom.createMorphAt(element7,1,1);
        morphs[6] = dom.createMorphAt(element7,2,2);
        morphs[7] = dom.createMorphAt(element8,1,1);
        morphs[8] = dom.createMorphAt(element8,2,2);
        morphs[9] = dom.createElementMorph(element9);
        morphs[10] = dom.createMorphAt(element9,1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["comments.you"],[],["loc",[null,[5,20],[5,40]]]],
        ["inline","t",["comments.commentedOn"],[],["loc",[null,[5,45],[5,73]]]],
        ["block","if",[["subexpr","eq",[["get","model.type",["loc",[null,[6,14],[6,24]]]],"post"],[],["loc",[null,[6,10],[6,32]]]]],[],0,1,["loc",[null,[6,4],[10,11]]]],
        ["inline","moment-format",[["get","model.createdAt",["loc",[null,[12,39],[12,54]]]]],[],["loc",[null,[12,23],[12,56]]]],
        ["block","each",[["get","model.rating",["loc",[null,[13,12],[13,24]]]]],[],2,null,["loc",[null,[13,4],[18,13]]]],
        ["block","liquid-if",[["get","isEditable",["loc",[null,[21,15],[21,25]]]]],[],3,4,["loc",[null,[21,2],[29,16]]]],
        ["block","if",[["subexpr","gt",[["get","model.checkbox.length",["loc",[null,[30,12],[30,33]]]],0],[],["loc",[null,[30,8],[30,36]]]]],[],5,null,["loc",[null,[30,2],[32,9]]]],
        ["block","if",[["get","isEditable",["loc",[null,[35,8],[35,18]]]]],[],6,7,["loc",[null,[35,2],[46,9]]]],
        ["block","if",[["get","model.isPrivate",["loc",[null,[47,8],[47,23]]]]],[],8,9,["loc",[null,[47,2],[55,9]]]],
        ["element","action",["delete"],[],["loc",[null,[56,7],[56,26]]]],
        ["inline","t",["action.delete"],[],["loc",[null,[57,6],[57,27]]]]
      ],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8, child9]
    };
  }()));

});
define('rose/pods/components/rose-interaction/component', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
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
define('rose/pods/components/rose-interaction/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","ui segment");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1, 0]),0,0);
          return morphs;
        },
        statements: [
          ["content","jsonData",["loc",[null,[12,15],[12,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element1,0,0);
          return morphs;
        },
        statements: [
          ["element","action",["unhide"],[],["loc",[null,[19,7],[19,26]]]],
          ["inline","t",["action.unhide"],[],["loc",[null,[19,27],[19,48]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child2 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/pods/components/rose-interaction/template.hbs"
        },
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
          morphs[1] = dom.createMorphAt(element0,0,0);
          return morphs;
        },
        statements: [
          ["element","action",["hide"],[],["loc",[null,[21,7],[21,24]]]],
          ["inline","t",["action.hide"],[],["loc",[null,[21,25],[21,44]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        "moduleName": "rose/pods/components/rose-interaction/template.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"class","avatar");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","circular pointing right icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","content");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"class","author");
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
        dom.setAttribute(el2,"class","metadata");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","date");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","text");
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
        dom.setAttribute(el2,"class","actions");
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
        var element3 = dom.childAt(element2, [11]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [5]);
        var morphs = new Array(10);
        morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
        morphs[1] = dom.createMorphAt(element2,3,3);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [5]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [7, 1]),0,0);
        morphs[4] = dom.createMorphAt(dom.childAt(element2, [9]),1,1);
        morphs[5] = dom.createElementMorph(element4);
        morphs[6] = dom.createMorphAt(element4,0,0);
        morphs[7] = dom.createMorphAt(element3,3,3);
        morphs[8] = dom.createElementMorph(element5);
        morphs[9] = dom.createMorphAt(element5,0,0);
        return morphs;
      },
      statements: [
        ["content","model.origin.observer",["loc",[null,[5,20],[5,45]]]],
        ["inline","t",["interactions.actionOn"],[],["loc",[null,[5,50],[5,79]]]],
        ["content","model.contentId",["loc",[null,[5,88],[5,107]]]],
        ["inline","moment-format",[["get","model.createdAt",["loc",[null,[7,39],[7,54]]]]],[],["loc",[null,[7,23],[7,56]]]],
        ["block","liquid-if",[["get","showDetails",["loc",[null,[10,15],[10,26]]]]],[],0,null,["loc",[null,[10,2],[14,16]]]],
        ["element","action",["toggleDetails"],[],["loc",[null,[17,7],[17,33]]]],
        ["inline","t",["action.details"],[],["loc",[null,[17,34],[17,56]]]],
        ["block","if",[["get","model.isPrivate",["loc",[null,[18,8],[18,23]]]]],[],1,2,["loc",[null,[18,2],[22,9]]]],
        ["element","action",["delete"],[],["loc",[null,[23,7],[23,26]]]],
        ["inline","t",["action.delete"],[],["loc",[null,[23,27],[23,48]]]]
      ],
      locals: [],
      templates: [child0, child1, child2]
    };
  }()));

});
define('rose/router', ['exports', 'ember', 'rose/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  exports['default'] = Router.map(function () {
    this.route('about');
    this.route('help');
    this.route('diary');
    this.route('backup');
    this.route('settings');
    this.route('comments', { path: '/:network_name/comments' });
    this.route('interactions', { path: '/:network_name/interactions' });
    this.route('privacysettings', { path: '/:network_name/privacysettings' });
    this.route('study-creator');
    this.route('debug-log', {});
  });

});
define('rose/routes/about', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('rose/routes/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var Promise = Ember['default'].RSVP.Promise;

  exports['default'] = Ember['default'].Route.extend({
    beforeModel: function beforeModel() {
      var settings = this.get('settings');
      return Promise.all([settings.setup()]);
    },

    afterModel: function afterModel() {
      this.set('i18n.locale', this.get('settings.user.currentLanguage'));
    },

    setupController: function setupController(controller, model) {
      this._super(controller, model);

      return this.store.find('network').then(function (networks) {
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
      }
    }
  });

});
define('rose/routes/backup', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var getItem = function getItem(key) {
    return new Ember['default'].RSVP.Promise(function (resolve) {
      kango.invokeAsyncCallback('localforage.getItem', key, function (data) {
        resolve({
          type: key,
          data: data
        });
      });
    });
  };

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      var promises = [this.store.find('comment').then(function (records) {
        return { type: 'comment', data: records.invoke('serialize') };
      }), this.store.find('interaction').then(function (records) {
        return { type: 'interaction', data: records.invoke('serialize') };
      }), this.store.find('diary-entry').then(function (records) {
        return { type: 'diary-entry', data: records.invoke('serialize') };
      }), this.store.find('user-setting').then(function (records) {
        return { type: 'user-setting', data: records.invoke('serialize') };
      }), this.store.find('system-config').then(function (records) {
        return { type: 'system-config', data: records.invoke('serialize') };
      }), getItem('click-activity-records'), getItem('mousemove-activity-records'), getItem('window-activity-records'), getItem('scroll-activity-records'), getItem('fb-login-activity-records'), getItem('install-date'), getItem('rose-data-version')];

      return Ember['default'].RSVP.all(promises);
    }
  });

});
define('rose/routes/comments', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(params) {
      return this.store.find('comment', { network: params.network_name });
    }
  });

});
define('rose/routes/debug-log', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({
		model: function model() {
			return new Promise(function (resolve, reject) {
				kango.invokeAsyncCallback('localforage.getItem', 'application-log', function (log) {
					resolve(log);
				});
			});
		}
	});

});
define('rose/routes/diary', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return this.store.find('diary-entry');
    }
  });

});
define('rose/routes/help', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('rose/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var getItem = function getItem(key) {
    return new Ember['default'].RSVP.Promise(function (resolve) {
      kango.invokeAsyncCallback('localforage.getItem', key, function (data) {
        resolve(data);
      });
    });
  };

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      var promises = [getItem('click-activity-records'), getItem('mousemove-activity-records'), getItem('scroll-activity-records'), getItem('window-activity-records'), getItem('fb-login-activity-records')];

      return Ember['default'].RSVP.all(promises);
    }
  });

});
define('rose/routes/interactions', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(params) {
      return this.store.find('interaction').then(function (records) {
        return records.filterBy('origin.network', params.network_name);
      });
    }
  });

});
define('rose/routes/privacysettings', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('rose/routes/settings', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('rose/routes/study-creator', ['exports', 'ember', 'rose/defaults/study-creator'], function (exports, Ember, studyCreatorDefaults) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      var _this = this;

      return this.store.find('study-creator-setting').then(function (settings) {
        if (Ember['default'].isEmpty(settings)) {
          return _this.store.createRecord('study-creator-setting', studyCreatorDefaults['default']);
        }

        return settings.get('firstObject');
      });
    }
  });

});
define('rose/services/i18n', ['exports', 'ember-i18n/service'], function (exports, Service) {

	'use strict';

	exports['default'] = Service['default'];

});
define('rose/services/liquid-fire-modals', ['exports', 'liquid-fire/modals'], function (exports, Modals) {

	'use strict';

	exports['default'] = Modals['default'];

});
define('rose/services/liquid-fire-transitions', ['exports', 'liquid-fire/transition-map'], function (exports, TransitionMap) {

	'use strict';

	exports['default'] = TransitionMap['default'];

});
define('rose/services/moment', ['exports', 'ember', 'moment'], function (exports, Ember, _moment) {

  'use strict';

  var computed = Ember['default'].computed;

  exports['default'] = Ember['default'].Service.extend({
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
        if (_moment['default'].tz) {
          this.set('_timeZone', timeZone);
          return timeZone;
        } else {
          Ember['default'].Logger.warn('[ember-moment] attempted to set timezone, but moment-timezone unavailable.');
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
      var time = _moment['default'].apply(undefined, arguments);
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
define('rose/services/settings', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    var isEmpty = Ember['default'].isEmpty;
    var service = Ember['default'].inject.service;
    var Promise = Ember['default'].RSVP.Promise;

    exports['default'] = Ember['default'].Service.extend({
        store: service(),

        setup: function setup() {
            var _this = this;

            var store = this.get('store');

            var userSettings = store.find('user-setting', { id: 0 }).then(function (settings) {
                if (!isEmpty(settings)) {
                    return settings.get('firstObject');
                }

                return store.createRecord('user-setting', { id: 0 }).save();
            }).then(function (setting) {
                _this.set('user', setting);
            });

            var systemSettings = store.find('system-config', { id: 0 }).then(function (settings) {
                if (!isEmpty(settings)) {
                    return settings.get('firstObject');
                }

                return store.createRecord('system-config', { id: 0 }).save();
            }).then(function (setting) {
                _this.set('system', setting);
            });

            return Promise.all([userSettings, systemSettings]);
        }
    });

});
define('rose/templates/about', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","info icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\nROSE ");
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
        dom.setAttribute(el1,"class","ui basic segment");
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
        dom.setAttribute(el2,"href","mailto: andreas.poller@ sit.fraunhofer.de");
        var el3 = dom.createTextNode("Andreas Poller, andreas.poller@sit.fraunhofer.de");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","ui divider");
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
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        morphs[3] = dom.createMorphAt(fragment,6,6,contextualElement);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [8]),1,1);
        morphs[5] = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
        morphs[6] = dom.createMorphAt(element1,4,4);
        morphs[7] = dom.createMorphAt(element1,9,9);
        morphs[8] = dom.createMorphAt(dom.childAt(fragment, [12]),1,1);
        morphs[9] = dom.createMorphAt(dom.childAt(fragment, [16]),1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["about.title"],[],["loc",[null,[4,4],[4,23]]]],
        ["inline","t",["about.subtitle"],[],["loc",[null,[5,28],[5,50]]]],
        ["inline","t",["about.description"],[],["loc",[null,[10,2],[10,27]]]],
        ["inline","t",["about.developedBy"],[],["loc",[null,[15,5],[15,30]]]],
        ["inline","t",["and"],[],["loc",[null,[17,39],[17,50]]]],
        ["inline","t",["about.address.name"],[],["loc",[null,[21,12],[21,38]]]],
        ["inline","t",["about.address.street"],[],["loc",[null,[22,4],[22,32]]]],
        ["inline","t",["about.address.country"],[],["loc",[null,[24,4],[24,33]]]],
        ["inline","t",["about.forQuestions"],[],["loc",[null,[28,2],[28,28]]]],
        ["inline","t",["about.licenceNotice"],[],["loc",[null,[34,2],[34,29]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","installation-wizard",[],["cancel","cancelWizard","onsuccess","saveConfig"],["loc",[null,[3,0],[3,68]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","ui page grid");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","four wide column");
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
          dom.setAttribute(el2,"class","twelve wide column");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3,"class","ui segment");
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
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3, 1]),1,1);
          return morphs;
        },
        statements: [
          ["inline","partial",["sidebar-menu"],[],["loc",[null,[9,4],[9,30]]]],
          ["content","outlet",["loc",[null,[14,6],[14,16]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","settings.user.firstRun",["loc",[null,[1,6],[1,28]]]]],[],0,1,["loc",[null,[1,0],[19,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/templates/backup', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","download icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el3,"class","ui primary button");
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
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","ui primary button");
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
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element2, [3]),0,0);
        morphs[4] = dom.createElementMorph(element3);
        morphs[5] = dom.createMorphAt(element3,1,1);
        morphs[6] = dom.createMorphAt(dom.childAt(element4, [1]),0,0);
        morphs[7] = dom.createMorphAt(dom.childAt(element4, [3]),0,0);
        morphs[8] = dom.createMorphAt(element4,5,5);
        morphs[9] = dom.createElementMorph(element5);
        morphs[10] = dom.createMorphAt(element5,1,1);
        morphs[11] = dom.createMorphAt(fragment,4,4,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","t",["backup.title"],[],["loc",[null,[4,4],[4,24]]]],
        ["inline","t",["backup.subtitle"],[],["loc",[null,[5,28],[5,51]]]],
        ["inline","t",["backup.resetData"],[],["loc",[null,[11,11],[11,35]]]],
        ["inline","t",["backup.resetDataLabel"],[],["loc",[null,[12,7],[12,36]]]],
        ["element","action",["openModal","reset-data"],[],["loc",[null,[14,38],[14,73]]]],
        ["inline","t",["action.reset"],[],["loc",[null,[15,6],[15,26]]]],
        ["inline","t",["backup.export"],[],["loc",[null,[20,11],[20,32]]]],
        ["inline","t",["backup.exportLabel"],[],["loc",[null,[21,7],[21,33]]]],
        ["inline","textarea",[],["readonly",true,"value",["subexpr","@mut",[["get","jsonData",["loc",[null,[22,35],[22,43]]]]],[],[]]],["loc",[null,[22,4],[22,45]]]],
        ["element","action",["download"],[],["loc",[null,[26,36],[26,57]]]],
        ["inline","t",["action.download"],[],["loc",[null,[27,4],[27,27]]]],
        ["inline","partial",["modal/reset-data"],[],["loc",[null,[31,0],[31,30]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/comments', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/templates/comments.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","rose-comment",[],["model",["subexpr","@mut",[["get","comment",["loc",[null,[11,25],[11,32]]]]],[],[]]],["loc",[null,[11,4],[11,34]]]]
        ],
        locals: ["comment"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 14,
            "column": 0
          }
        },
        "moduleName": "rose/templates/comments.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui comments");
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
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["comments.title"],[],["loc",[null,[4,4],[4,26]]]],
        ["inline","t",["comments.subtitle"],[],["loc",[null,[5,28],[5,53]]]],
        ["block","each",[["get","sortedList",["loc",[null,[10,10],[10,20]]]]],[],0,null,["loc",[null,[10,2],[12,11]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/components/high-charts', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/high-charts.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["content","yield",["loc",[null,[1,0],[1,9]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/components/liquid-bind', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","yield",[["get","version",["loc",[null,[6,15],[6,22]]]]],[],["loc",[null,[6,6],[6,26]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        var child1 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["content","version",["loc",[null,[8,6],[8,20]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","if",[["get","hasBlock",["loc",[null,[5,11],[5,19]]]]],[],0,1,["loc",[null,[5,4],[9,12]]]]
          ],
          locals: ["version"],
          templates: [child0, child1]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[2,28],[2,39]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[2,44],[2,47]]]]],[],[]],"outletName",["subexpr","@mut",[["get","attrs.outletName",["loc",[null,[3,32],[3,48]]]]],[],[]],"name","liquid-bind","renderWhenFalse",true,"class",["subexpr","@mut",[["get","class",["loc",[null,[4,67],[4,72]]]]],[],[]]],0,null,["loc",[null,[2,2],[11,22]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.11",
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
                morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [
                ["inline","yield",[["get","version",["loc",[null,[26,17],[26,24]]]]],[],["loc",[null,[26,8],[26,28]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          var child1 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.11",
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
                morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
                dom.insertBoundary(fragment, 0);
                dom.insertBoundary(fragment, null);
                return morphs;
              },
              statements: [
                ["content","version",["loc",[null,[28,8],[28,22]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["block","if",[["get","hasBlock",["loc",[null,[25,13],[25,21]]]]],[],0,1,["loc",[null,[25,6],[29,14]]]]
            ],
            locals: ["version"],
            templates: [child0, child1]
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[21,30],[21,41]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[21,49],[21,58]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[21,63],[21,66]]]]],[],[]],"outletName",["subexpr","@mut",[["get","attrs.outletName",["loc",[null,[22,34],[22,50]]]]],[],[]],"name","liquid-bind","renderWhenFalse",true],0,null,["loc",[null,[21,4],[31,26]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[14,9],[14,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[15,12],[15,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[16,19],[16,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[17,26],[17,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[18,17],[18,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[19,19],[19,31]]]]],[],[]]],0,null,["loc",[null,[13,2],[32,25]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[33,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/templates/components/liquid-container', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["inline","yield",[["get","this",["loc",[null,[1,8],[1,12]]]]],[],["loc",[null,[1,0],[1,14]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/components/liquid-if', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
              return morphs;
            },
            statements: [
              ["content","yield",["loc",[null,[5,6],[5,15]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        var child1 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
              return morphs;
            },
            statements: [
              ["inline","yield",[],["to","inverse"],["loc",[null,[7,6],[7,28]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","if",[["get","valueVersion",["loc",[null,[4,10],[4,22]]]]],[],0,1,["loc",[null,[4,4],[8,11]]]]
          ],
          locals: ["valueVersion"],
          templates: [child0, child1]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","showFirstBlock",["loc",[null,[2,27],[2,41]]]]],[],[]],"name",["subexpr","@mut",[["get","helperName",["loc",[null,[2,47],[2,57]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[3,27],[3,30]]]]],[],[]],"renderWhenFalse",["subexpr","hasBlock",["inverse"],[],["loc",[null,[3,47],[3,67]]]],"class",["subexpr","@mut",[["get","class",["loc",[null,[3,74],[3,79]]]]],[],[]]],0,null,["loc",[null,[2,2],[9,22]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.11",
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
                morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
                return morphs;
              },
              statements: [
                ["content","yield",["loc",[null,[22,8],[22,17]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          var child1 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.11",
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
                morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
                return morphs;
              },
              statements: [
                ["inline","yield",[],["to","inverse"],["loc",[null,[24,8],[24,30]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["block","if",[["get","valueVersion",["loc",[null,[21,12],[21,24]]]]],[],0,1,["loc",[null,[21,6],[25,13]]]]
            ],
            locals: ["valueVersion"],
            templates: [child0, child1]
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","showFirstBlock",["loc",[null,[19,29],[19,43]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[19,51],[19,60]]]]],[],[]],"name",["subexpr","@mut",[["get","helperName",["loc",[null,[19,66],[19,76]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[20,8],[20,11]]]]],[],[]],"renderWhenFalse",["subexpr","hasBlock",["inverse"],[],["loc",[null,[20,28],[20,48]]]]],0,null,["loc",[null,[19,4],[26,24]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[12,9],[12,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[13,12],[13,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[14,19],[14,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[15,26],[15,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[16,17],[16,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[17,19],[17,31]]]]],[],[]]],0,null,["loc",[null,[11,2],[27,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[28,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/templates/components/liquid-modal', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"role","dialog");
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
            morphs[3] = dom.createMorphAt(element0,1,1);
            return morphs;
          },
          statements: [
            ["attribute","class",["concat",["lf-dialog ",["get","cc.options.dialogClass",["loc",[null,[3,28],[3,50]]]]]]],
            ["attribute","aria-labelledby",["get","cc.options.ariaLabelledBy",["loc",[null,[3,86],[3,111]]]]],
            ["attribute","aria-label",["get","cc.options.ariaLabel",["loc",[null,[3,127],[3,147]]]]],
            ["inline","lf-vue",[["get","cc.view",["loc",[null,[4,15],[4,22]]]]],["dismiss","dismiss"],["loc",[null,[4,6],[4,42]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          morphs[1] = dom.createMorphAt(fragment,2,2,contextualElement);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [
          ["block","lm-container",[],["action","escape","clickAway","outsideClick"],0,null,["loc",[null,[2,2],[6,19]]]],
          ["content","lf-overlay",["loc",[null,[7,2],[7,16]]]]
        ],
        locals: ["cc"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","liquid-versions",[],["name","liquid-modal","value",["subexpr","@mut",[["get","currentContext",["loc",[null,[1,45],[1,59]]]]],[],[]],"renderWhenFalse",false],0,null,["loc",[null,[1,0],[8,20]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/components/liquid-outlet', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","outlet",[["get","outletName",["loc",[null,[16,17],[16,27]]]]],[],["loc",[null,[16,8],[16,29]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","set-outlet-state",[["get","outletName",["loc",[null,[15,26],[15,36]]]],["get","version.outletState",["loc",[null,[15,37],[15,56]]]]],[],0,null,["loc",[null,[15,6],[17,28]]]]
          ],
          locals: ["version"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-bind",[["get","outletState",["loc",[null,[2,17],[2,28]]]]],["id",["subexpr","@mut",[["get","id",["loc",[null,[3,9],[3,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[4,12],[4,17]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[5,10],[5,13]]]]],[],[]],"name","liquid-outlet","outletName",["subexpr","@mut",[["get","outletName",["loc",[null,[7,17],[7,27]]]]],[],[]],"containerless",["subexpr","@mut",[["get","containerless",["loc",[null,[8,20],[8,33]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[9,19],[9,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[10,26],[10,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[11,17],[11,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[12,19],[12,31]]]]],[],[]]],0,null,["loc",[null,[2,2],[19,20]]]]
        ],
        locals: ["outletState"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","get-outlet-state",[["get","outletName",["loc",[null,[1,21],[1,31]]]]],[],0,null,["loc",[null,[1,0],[20,21]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/components/liquid-versions', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","yield",[["get","version.value",["loc",[null,[4,14],[4,27]]]]],[],["loc",[null,[4,6],[4,31]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-child",[],["version",["subexpr","@mut",[["get","version",["loc",[null,[3,28],[3,35]]]]],[],[]],"liquidChildDidRender","childDidRender","class",["subexpr","@mut",[["get","class",["loc",[null,[3,80],[3,85]]]]],[],[]]],0,null,["loc",[null,[3,4],[5,21]]]]
          ],
          locals: [],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","if",[["get","version.shouldRender",["loc",[null,[2,8],[2,28]]]]],[],0,null,["loc",[null,[2,2],[6,9]]]]
        ],
        locals: ["version"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","each",[["get","versions",["loc",[null,[1,8],[1,16]]]]],["key","@identity"],0,null,["loc",[null,[1,0],[7,9]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/components/liquid-with', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["inline","yield",[["get","version",["loc",[null,[3,13],[3,20]]]]],[],["loc",[null,[3,4],[3,24]]]]
          ],
          locals: ["version"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[2,28],[2,39]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[2,44],[2,47]]]]],[],[]],"name",["subexpr","@mut",[["get","name",["loc",[null,[2,53],[2,57]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[2,64],[2,69]]]]],[],[]]],0,null,["loc",[null,[2,2],[4,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
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
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","yield",[["get","version",["loc",[null,[15,15],[15,22]]]]],[],["loc",[null,[15,6],[15,26]]]]
            ],
            locals: ["version"],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[14,30],[14,41]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[14,49],[14,58]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[14,63],[14,66]]]]],[],[]],"name",["subexpr","@mut",[["get","name",["loc",[null,[14,72],[14,76]]]]],[],[]]],0,null,["loc",[null,[14,4],[16,25]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[7,9],[7,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[8,12],[8,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[9,19],[9,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[10,26],[10,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[11,17],[11,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[12,19],[12,31]]]]],[],[]]],0,null,["loc",[null,[6,2],[17,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[18,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/templates/components/ui-checkbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        if (this.cachedFragment) { dom.repairClonedNode(element0,[],true); }
        var morphs = new Array(6);
        morphs[0] = dom.createAttrMorph(element0, 'type');
        morphs[1] = dom.createAttrMorph(element0, 'name');
        morphs[2] = dom.createAttrMorph(element0, 'checked');
        morphs[3] = dom.createAttrMorph(element0, 'disabled');
        morphs[4] = dom.createAttrMorph(element0, 'data-id');
        morphs[5] = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        return morphs;
      },
      statements: [
        ["attribute","type",["get","type",["loc",[null,[1,14],[1,18]]]]],
        ["attribute","name",["get","name",["loc",[null,[1,28],[1,32]]]]],
        ["attribute","checked",["get","checked",["loc",[null,[1,45],[1,52]]]]],
        ["attribute","disabled",["get","readonly",["loc",[null,[1,66],[1,74]]]]],
        ["attribute","data-id",["get","data-id",["loc",[null,[1,87],[1,94]]]]],
        ["content","label",["loc",[null,[2,7],[2,16]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/components/ui-dropdown', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/ui-dropdown.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["content","yield",["loc",[null,[1,0],[1,9]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/components/ui-modal', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "rose/templates/components/ui-modal.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["content","yield",["loc",[null,[1,0],[1,9]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/components/ui-radio', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        if (this.cachedFragment) { dom.repairClonedNode(element0,[],true); }
        var morphs = new Array(6);
        morphs[0] = dom.createAttrMorph(element0, 'type');
        morphs[1] = dom.createAttrMorph(element0, 'name');
        morphs[2] = dom.createAttrMorph(element0, 'checked');
        morphs[3] = dom.createAttrMorph(element0, 'disabled');
        morphs[4] = dom.createAttrMorph(element0, 'data-id');
        morphs[5] = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        return morphs;
      },
      statements: [
        ["attribute","type",["get","type",["loc",[null,[1,14],[1,18]]]]],
        ["attribute","name",["get","name",["loc",[null,[1,28],[1,32]]]]],
        ["attribute","checked",["get","checked",["loc",[null,[1,45],[1,52]]]]],
        ["attribute","disabled",["get","readonly",["loc",[null,[1,66],[1,74]]]]],
        ["attribute","data-id",["get","data-id",["loc",[null,[1,87],[1,94]]]]],
        ["content","label",["loc",[null,[2,7],[2,16]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/debug-log', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 18,
              "column": 3
            },
            "end": {
              "line": 24,
              "column": 4
            }
          },
          "moduleName": "rose/templates/debug-log.hbs"
        },
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
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
          morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [5]),0,0);
          return morphs;
        },
        statements: [
          ["inline","moment-format",[["get","log.date",["loc",[null,[20,26],[20,34]]]],"LLL"],[],["loc",[null,[20,10],[20,42]]]],
          ["content","log.message",["loc",[null,[21,10],[21,25]]]],
          ["content","log.module",["loc",[null,[22,10],[22,24]]]]
        ],
        locals: ["log"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 27,
            "column": 0
          }
        },
        "moduleName": "rose/templates/debug-log.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        var el1 = dom.createElement("table");
        dom.setAttribute(el1,"class","ui celled table");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("thead");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("tr");
        var el4 = dom.createTextNode("\n	    ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n	    ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n	    ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("th");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n  	");
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
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0, 3]);
        var element2 = dom.childAt(fragment, [2]);
        var element3 = dom.childAt(element2, [1, 1]);
        var morphs = new Array(6);
        morphs[0] = dom.createMorphAt(element1,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element3, [1]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element3, [3]),0,0);
        morphs[4] = dom.createMorphAt(dom.childAt(element3, [5]),0,0);
        morphs[5] = dom.createMorphAt(dom.childAt(element2, [3]),1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["debugLog.title"],[],["loc",[null,[4,4],[4,26]]]],
        ["inline","t",["debugLog.subtitle"],[],["loc",[null,[5,28],[5,53]]]],
        ["inline","t",["debugLog.date"],[],["loc",[null,[12,9],[12,30]]]],
        ["inline","t",["debugLog.message"],[],["loc",[null,[13,9],[13,33]]]],
        ["inline","t",["debugLog.module"],[],["loc",[null,[14,9],[14,32]]]],
        ["block","each",[["get","model",["loc",[null,[18,11],[18,16]]]]],[],0,null,["loc",[null,[18,3],[24,13]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/diary', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/templates/diary.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","diary-entry",[],["model",["subexpr","@mut",[["get","entry",["loc",[null,[26,24],[26,29]]]]],[],[]]],["loc",[null,[26,4],[26,31]]]]
        ],
        locals: ["entry"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        "moduleName": "rose/templates/diary.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","book icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","ui button");
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
        dom.setAttribute(el1,"class","ui divider");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","ui comments");
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
        var morphs = new Array(9);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        morphs[3] = dom.createAttrMorph(element2, 'class');
        morphs[4] = dom.createElementMorph(element2);
        morphs[5] = dom.createMorphAt(element2,1,1);
        morphs[6] = dom.createElementMorph(element3);
        morphs[7] = dom.createMorphAt(element3,1,1);
        morphs[8] = dom.createMorphAt(dom.childAt(fragment, [6]),1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["diary.title"],[],["loc",[null,[4,4],[4,23]]]],
        ["inline","t",["diary.subtitle"],[],["loc",[null,[5,28],[5,50]]]],
        ["inline","textarea",[],["value",["subexpr","@mut",[["get","diaryInput",["loc",[null,[11,21],[11,31]]]]],[],[]]],["loc",[null,[11,4],[11,33]]]],
        ["attribute","class",["concat",["ui primary button ",["subexpr","if",[["get","diaryInputIsEmpty",["loc",[null,[14,40],[14,57]]]],"disabled"],[],["loc",[null,[14,35],[14,70]]]]]]],
        ["element","action",["save"],[],["loc",[null,[14,72],[14,89]]]],
        ["inline","t",["action.save"],[],["loc",[null,[15,4],[15,23]]]],
        ["element","action",["cancel"],[],["loc",[null,[17,28],[17,47]]]],
        ["inline","t",["action.cancel"],[],["loc",[null,[18,4],[18,25]]]],
        ["block","each",[["get","sortedList",["loc",[null,[25,10],[25,20]]]]],[],0,null,["loc",[null,[25,2],[27,11]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/help', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        "moduleName": "rose/templates/help.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","question icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
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
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(18);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]),0,0);
        morphs[3] = dom.createUnsafeMorphAt(fragment,4,4,contextualElement);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [6]),0,0);
        morphs[5] = dom.createUnsafeMorphAt(fragment,8,8,contextualElement);
        morphs[6] = dom.createMorphAt(dom.childAt(fragment, [10]),0,0);
        morphs[7] = dom.createUnsafeMorphAt(fragment,12,12,contextualElement);
        morphs[8] = dom.createMorphAt(dom.childAt(fragment, [14]),0,0);
        morphs[9] = dom.createUnsafeMorphAt(fragment,16,16,contextualElement);
        morphs[10] = dom.createMorphAt(dom.childAt(fragment, [18]),0,0);
        morphs[11] = dom.createUnsafeMorphAt(fragment,20,20,contextualElement);
        morphs[12] = dom.createMorphAt(dom.childAt(fragment, [22]),0,0);
        morphs[13] = dom.createUnsafeMorphAt(fragment,24,24,contextualElement);
        morphs[14] = dom.createMorphAt(dom.childAt(fragment, [26]),0,0);
        morphs[15] = dom.createUnsafeMorphAt(fragment,28,28,contextualElement);
        morphs[16] = dom.createMorphAt(dom.childAt(fragment, [30]),0,0);
        morphs[17] = dom.createUnsafeMorphAt(fragment,32,32,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","t",["help.title"],[],["loc",[null,[4,4],[4,22]]]],
        ["inline","t",["help.subtitle"],[],["loc",[null,[5,28],[5,49]]]],
        ["inline","t",["help.issue1.question"],[],["loc",[null,[9,4],[9,32]]]],
        ["inline","t",["help.issue1.answer"],[],["loc",[null,[10,0],[10,28]]]],
        ["inline","t",["help.issue2.question"],[],["loc",[null,[12,4],[12,32]]]],
        ["inline","t",["help.issue2.answer"],[],["loc",[null,[13,0],[13,28]]]],
        ["inline","t",["help.issue3.question"],[],["loc",[null,[15,4],[15,32]]]],
        ["inline","t",["help.issue3.answer"],[],["loc",[null,[16,0],[16,28]]]],
        ["inline","t",["help.issue4.question"],[],["loc",[null,[18,4],[18,32]]]],
        ["inline","t",["help.issue4.answer"],[],["loc",[null,[19,0],[19,28]]]],
        ["inline","t",["help.issue5.question"],[],["loc",[null,[21,4],[21,32]]]],
        ["inline","t",["help.issue5.answer"],[],["loc",[null,[22,0],[22,28]]]],
        ["inline","t",["help.issue6.question"],[],["loc",[null,[24,4],[24,32]]]],
        ["inline","t",["help.issue6.answer"],[],["loc",[null,[25,0],[25,28]]]],
        ["inline","t",["help.issue7.question"],[],["loc",[null,[27,4],[27,32]]]],
        ["inline","t",["help.issue7.answer"],[],["loc",[null,[28,0],[28,28]]]],
        ["inline","t",["help.issue8.question"],[],["loc",[null,[30,4],[30,32]]]],
        ["inline","t",["help.issue8.answer"],[],["loc",[null,[31,0],[31,28]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 0
          }
        },
        "moduleName": "rose/templates/index.hbs"
      },
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
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        morphs[1] = dom.createMorphAt(fragment,2,2,contextualElement);
        morphs[2] = dom.createMorphAt(fragment,4,4,contextualElement);
        morphs[3] = dom.createMorphAt(fragment,6,6,contextualElement);
        morphs[4] = dom.createMorphAt(fragment,8,8,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["inline","high-charts",[],["mode","StockChart","content",["subexpr","@mut",[["get","clickChartData",["loc",[null,[1,40],[1,54]]]]],[],[]],"chartOptions",["subexpr","@mut",[["get","clickChartOptions",["loc",[null,[1,68],[1,85]]]]],[],[]]],["loc",[null,[1,0],[1,87]]]],
        ["inline","high-charts",[],["mode","StockChart","content",["subexpr","@mut",[["get","mouseMoveChartData",["loc",[null,[2,40],[2,58]]]]],[],[]],"chartOptions",["subexpr","@mut",[["get","mouseMoveChartOptions",["loc",[null,[2,72],[2,93]]]]],[],[]]],["loc",[null,[2,0],[2,95]]]],
        ["inline","high-charts",[],["mode","StockChart","content",["subexpr","@mut",[["get","scrollChartData",["loc",[null,[3,40],[3,55]]]]],[],[]],"chartOptions",["subexpr","@mut",[["get","scrollChartOptions",["loc",[null,[3,69],[3,87]]]]],[],[]]],["loc",[null,[3,0],[3,89]]]],
        ["inline","high-charts",[],["mode","StockChart","content",["subexpr","@mut",[["get","windowChartData",["loc",[null,[4,40],[4,55]]]]],[],[]],"chartOptions",["subexpr","@mut",[["get","windowChartOptions",["loc",[null,[4,69],[4,87]]]]],[],[]]],["loc",[null,[4,0],[4,89]]]],
        ["inline","high-charts",[],["mode","StockChart","content",["subexpr","@mut",[["get","loginChartData",["loc",[null,[5,40],[5,54]]]]],[],[]],"chartOptions",["subexpr","@mut",[["get","loginChartOptions",["loc",[null,[5,68],[5,85]]]]],[],[]]],["loc",[null,[5,0],[5,87]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/interactions', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 4
              },
              "end": {
                "line": 13,
                "column": 4
              }
            },
            "moduleName": "rose/templates/interactions.hbs"
          },
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
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","rose-interaction",[],["model",["subexpr","@mut",[["get","interaction",["loc",[null,[12,29],[12,40]]]]],[],[]]],["loc",[null,[12,4],[12,42]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/templates/interactions.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","unless",[["get","interaction.isDeleted",["loc",[null,[11,14],[11,35]]]]],[],0,null,["loc",[null,[11,4],[13,15]]]]
        ],
        locals: ["interaction"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 16,
            "column": 0
          }
        },
        "moduleName": "rose/templates/interactions.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui comments");
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
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["interactions.title"],[],["loc",[null,[4,4],[4,30]]]],
        ["inline","t",["interactions.subtitle"],[],["loc",[null,[5,28],[5,57]]]],
        ["block","each",[["get","sortedList",["loc",[null,[10,10],[10,20]]]]],[],0,null,["loc",[null,[10,2],[14,11]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/modal/reset-config', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1,"class","close icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","header");
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
          dom.setAttribute(el1,"class","content");
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
          dom.setAttribute(el1,"class","actions");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","ui black cancel button");
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
          dom.setAttribute(el2,"class","ui positive right labeled icon button");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.setAttribute(el3,"class","checkmark icon");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [4, 1]),0,0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
          return morphs;
        },
        statements: [
          ["inline","t",["resetConfigModal.question"],[],["loc",[null,[4,2],[4,35]]]],
          ["inline","t",["resetConfigModal.warning"],[],["loc",[null,[7,5],[7,37]]]],
          ["inline","t",["action.cancel"],[],["loc",[null,[11,4],[11,25]]]],
          ["inline","t",["action.confirm"],[],["loc",[null,[14,4],[14,26]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","ui-modal",[],["class","reset-config","onApprove",["subexpr","action",["approveModal"],[],["loc",[null,[1,43],[1,66]]]]],0,null,["loc",[null,[1,0],[18,13]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/modal/reset-data', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.setAttribute(el1,"class","close icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","header");
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
          dom.setAttribute(el1,"class","content");
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
          dom.setAttribute(el1,"class","actions");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","ui black button");
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
          dom.setAttribute(el2,"class","ui positive button");
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
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [4]),1,1);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
          morphs[3] = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
          return morphs;
        },
        statements: [
          ["inline","t",["resetDataModal.question"],[],["loc",[null,[4,2],[4,33]]]],
          ["inline","t",["resetDataModal.warning"],[],["loc",[null,[7,2],[7,32]]]],
          ["inline","t",["action.cancel"],[],["loc",[null,[11,4],[11,25]]]],
          ["inline","t",["action.confirm"],[],["loc",[null,[14,4],[14,26]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","ui-modal",[],["class","reset-data","onApprove",["subexpr","action",["approveModal"],[],["loc",[null,[1,41],[1,64]]]]],0,null,["loc",[null,[1,0],[17,13]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('rose/templates/privacysettings', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.11",
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
        "moduleName": "rose/templates/privacysettings.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        var element0 = dom.childAt(fragment, [0, 3]);
        var morphs = new Array(2);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
        return morphs;
      },
      statements: [
        ["inline","t",["privacySettings.title"],[],["loc",[null,[4,4],[4,33]]]],
        ["inline","t",["privacySettings.subtitle"],[],["loc",[null,[5,28],[5,60]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('rose/templates/settings', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
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
            "moduleName": "rose/templates/settings.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","item");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element2 = dom.childAt(fragment, [1]);
            var morphs = new Array(2);
            morphs[0] = dom.createAttrMorph(element2, 'data-value');
            morphs[1] = dom.createMorphAt(element2,1,1);
            return morphs;
          },
          statements: [
            ["attribute","data-value",["get","language.code",["loc",[null,[20,39],[20,52]]]]],
            ["content","language.name",["loc",[null,[21,10],[21,27]]]]
          ],
          locals: ["language"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 13,
              "column": 4
            },
            "end": {
              "line": 25,
              "column": 4
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","default text");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1,"class","dropdown icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","menu");
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
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          morphs[1] = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
          return morphs;
        },
        statements: [
          ["inline","t",["settings.language"],[],["loc",[null,[16,32],[16,57]]]],
          ["block","each",[["get","availableLanguages",["loc",[null,[19,14],[19,32]]]]],[],0,null,["loc",[null,[19,6],[23,15]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
              "loc": {
                "source": null,
                "start": {
                  "line": 73,
                  "column": 8
                },
                "end": {
                  "line": 77,
                  "column": 8
                }
              },
              "moduleName": "rose/templates/settings.hbs"
            },
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","item");
              var el2 = dom.createTextNode("\n          ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n        ");
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
              morphs[1] = dom.createMorphAt(element0,1,1);
              return morphs;
            },
            statements: [
              ["attribute","data-value",["get","interval.value",["loc",[null,[74,39],[74,53]]]]],
              ["inline","t",[["get","interval.label",["loc",[null,[75,14],[75,28]]]]],[],["loc",[null,[75,10],[75,30]]]]
            ],
            locals: ["interval"],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 67,
                "column": 4
              },
              "end": {
                "line": 79,
                "column": 4
              }
            },
            "moduleName": "rose/templates/settings.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","default text");
            var el2 = dom.createTextNode("Select Interval");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1,"class","dropdown icon");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n      ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","menu");
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
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
            return morphs;
          },
          statements: [
            ["block","each",[["get","updateIntervals",["loc",[null,[73,16],[73,31]]]]],[],0,null,["loc",[null,[73,8],[77,17]]]]
          ],
          locals: [],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 62,
              "column": 2
            },
            "end": {
              "line": 81,
              "column": 2
            }
          },
          "moduleName": "rose/templates/settings.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","field");
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
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
          morphs[2] = dom.createMorphAt(element1,5,5);
          return morphs;
        },
        statements: [
          ["inline","t",["settings.autoUpdateInterval"],[],["loc",[null,[64,11],[64,46]]]],
          ["inline","t",["settings.autoUpdateIntervalLabel"],[],["loc",[null,[65,7],[65,47]]]],
          ["block","ui-dropdown",[],["class","selection","value",["subexpr","@mut",[["get","settings.system.updateInterval",["loc",[null,[68,26],[68,56]]]]],[],[]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[69,29],[69,52]]]]],0,null,["loc",[null,[67,4],[79,20]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 93,
            "column": 0
          }
        },
        "moduleName": "rose/templates/settings.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","settings icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","field");
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
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el3,"class","ui button");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    Last Update: ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el3,"class","ui red button");
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
        var element3 = dom.childAt(fragment, [0, 3]);
        var element4 = dom.childAt(fragment, [2]);
        var element5 = dom.childAt(element4, [1]);
        var element6 = dom.childAt(element4, [3]);
        var element7 = dom.childAt(element4, [5]);
        var element8 = dom.childAt(element4, [7]);
        var element9 = dom.childAt(element8, [5]);
        var element10 = dom.childAt(element4, [9]);
        var element11 = dom.childAt(element4, [13]);
        var element12 = dom.childAt(element11, [5]);
        var morphs = new Array(25);
        morphs[0] = dom.createMorphAt(element3,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element3, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element5, [1]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element5, [3]),0,0);
        morphs[4] = dom.createMorphAt(element5,5,5);
        morphs[5] = dom.createMorphAt(dom.childAt(element6, [1]),0,0);
        morphs[6] = dom.createMorphAt(dom.childAt(element6, [3]),0,0);
        morphs[7] = dom.createMorphAt(element6,5,5);
        morphs[8] = dom.createMorphAt(dom.childAt(element7, [1]),0,0);
        morphs[9] = dom.createMorphAt(dom.childAt(element7, [3]),0,0);
        morphs[10] = dom.createMorphAt(element7,5,5);
        morphs[11] = dom.createMorphAt(dom.childAt(element8, [1]),0,0);
        morphs[12] = dom.createMorphAt(dom.childAt(element8, [3]),0,0);
        morphs[13] = dom.createElementMorph(element9);
        morphs[14] = dom.createMorphAt(element9,0,0);
        morphs[15] = dom.createMorphAt(element8,7,7);
        morphs[16] = dom.createMorphAt(dom.childAt(element10, [1]),0,0);
        morphs[17] = dom.createMorphAt(dom.childAt(element10, [3]),0,0);
        morphs[18] = dom.createMorphAt(element10,5,5);
        morphs[19] = dom.createMorphAt(element4,11,11);
        morphs[20] = dom.createMorphAt(dom.childAt(element11, [1]),0,0);
        morphs[21] = dom.createMorphAt(dom.childAt(element11, [3]),0,0);
        morphs[22] = dom.createElementMorph(element12);
        morphs[23] = dom.createMorphAt(element12,1,1);
        morphs[24] = dom.createMorphAt(fragment,4,4,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","t",["settings.title"],[],["loc",[null,[4,4],[4,26]]]],
        ["inline","t",["settings.subtitle"],[],["loc",[null,[5,28],[5,53]]]],
        ["inline","t",["settings.language"],[],["loc",[null,[11,11],[11,36]]]],
        ["inline","t",["settings.languageLabel"],[],["loc",[null,[12,7],[12,37]]]],
        ["block","ui-dropdown",[],["class","selection","value",["subexpr","@mut",[["get","settings.user.currentLanguage",["loc",[null,[14,26],[14,55]]]]],[],[]],"onChange",["subexpr","action",["changeI18nLanguage"],[],["loc",[null,[15,29],[15,58]]]]],0,null,["loc",[null,[13,4],[25,20]]]],
        ["inline","t",["settings.commentReminder"],[],["loc",[null,[29,11],[29,43]]]],
        ["inline","t",["settings.commentReminderLabel"],[],["loc",[null,[30,7],[30,44]]]],
        ["inline","ui-checkbox",[],["class","toggle","checked",["subexpr","@mut",[["get","settings.user.commentReminderIsEnabled",["loc",[null,[32,26],[32,64]]]]],[],[]],"label",["subexpr","boolean-to-yesno",[["get","settings.user.commentReminderIsEnabled",["loc",[null,[33,42],[33,80]]]]],[],["loc",[null,[33,24],[33,81]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[34,27],[34,50]]]]],["loc",[null,[31,4],[34,52]]]],
        ["inline","t",["settings.extraFeatures"],[],["loc",[null,[38,11],[38,41]]]],
        ["inline","t",["settings.extraFeaturesLabel"],[],["loc",[null,[39,7],[39,42]]]],
        ["inline","ui-checkbox",[],["class","toggle","checked",["subexpr","@mut",[["get","settings.user.developerModeIsEnabled",["loc",[null,[41,26],[41,62]]]]],[],[]],"label",["subexpr","boolean-to-yesno",[["get","settings.user.developerModeIsEnabled",["loc",[null,[42,42],[42,78]]]]],[],["loc",[null,[42,24],[42,79]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[43,27],[43,50]]]]],["loc",[null,[40,4],[43,52]]]],
        ["inline","t",["settings.manualUpdate"],[],["loc",[null,[47,11],[47,40]]]],
        ["inline","t",["settings.manualUpdateLabel"],[],["loc",[null,[48,7],[48,41]]]],
        ["element","action",["manualUpdate"],[],["loc",[null,[49,30],[49,55]]]],
        ["inline","t",["action.update"],[],["loc",[null,[49,56],[49,77]]]],
        ["inline","moment-format",[["get","settings.system.timestamp",["loc",[null,[50,33],[50,58]]]]],[],["loc",[null,[50,17],[50,60]]]],
        ["inline","t",["settings.autoUpdate"],[],["loc",[null,[54,11],[54,38]]]],
        ["inline","t",["settings.autoUpdateLabel"],[],["loc",[null,[55,7],[55,39]]]],
        ["inline","ui-checkbox",[],["class","toggle","checked",["subexpr","@mut",[["get","settings.system.autoUpdateIsEnabled",["loc",[null,[57,26],[57,61]]]]],[],[]],"label",["subexpr","boolean-to-yesno",[["get","settings.system.autoUpdateIsEnabled",["loc",[null,[58,42],[58,77]]]]],[],["loc",[null,[58,24],[58,78]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[59,27],[59,50]]]]],["loc",[null,[56,4],[59,52]]]],
        ["block","if",[["get","settings.system.autoUpdateIsEnabled",["loc",[null,[62,8],[62,43]]]]],[],1,null,["loc",[null,[62,2],[81,9]]]],
        ["inline","t",["settings.resetRose"],[],["loc",[null,[84,11],[84,37]]]],
        ["inline","t",["settings.resetRoseLabel"],[],["loc",[null,[85,7],[85,38]]]],
        ["element","action",["openModal","reset-config"],[],["loc",[null,[86,34],[86,71]]]],
        ["inline","t",["action.reset"],[],["loc",[null,[87,6],[87,26]]]],
        ["inline","partial",["modal/reset-config"],[],["loc",[null,[92,0],[92,32]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/templates/sidebar-menu', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ROSE\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() { return []; },
        statements: [

        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 2
            },
            "end": {
              "line": 7,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.diary"],[],["loc",[null,[6,4],[6,29]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child2 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
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
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.backup"],[],["loc",[null,[9,4],[9,30]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child3 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 11,
              "column": 2
            },
            "end": {
              "line": 13,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.settings"],[],["loc",[null,[12,4],[12,32]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child4 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 23,
                "column": 8
              },
              "end": {
                "line": 25,
                "column": 8
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","t",["sidebarMenu.comments"],[],["loc",[null,[24,10],[24,38]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      var child1 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 26,
                "column": 8
              },
              "end": {
                "line": 28,
                "column": 8
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","t",["sidebarMenu.interactions"],[],["loc",[null,[27,10],[27,42]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      var child2 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 29,
                "column": 8
              },
              "end": {
                "line": 31,
                "column": 8
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","t",["sidebarMenu.privacySettings"],[],["loc",[null,[30,10],[30,45]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 19,
              "column": 2
            },
            "end": {
              "line": 34,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","item");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","menu");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("      ");
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
          var element2 = dom.childAt(fragment, [1]);
          var element3 = dom.childAt(element2, [3]);
          var morphs = new Array(4);
          morphs[0] = dom.createMorphAt(element2,1,1);
          morphs[1] = dom.createMorphAt(element3,1,1);
          morphs[2] = dom.createMorphAt(element3,2,2);
          morphs[3] = dom.createMorphAt(element3,3,3);
          return morphs;
        },
        statements: [
          ["content","network.descriptiveName",["loc",[null,[21,6],[21,33]]]],
          ["block","link-to",["comments",["get","network.name",["loc",[null,[23,30],[23,42]]]]],["class","item"],0,null,["loc",[null,[23,8],[25,20]]]],
          ["block","link-to",["interactions",["get","network.name",["loc",[null,[26,34],[26,46]]]]],["class","item"],1,null,["loc",[null,[26,8],[28,20]]]],
          ["block","link-to",["privacysettings",["get","network.name",["loc",[null,[29,37],[29,49]]]]],["class","item"],2,null,["loc",[null,[29,8],[31,20]]]]
        ],
        locals: ["network"],
        templates: [child0, child1, child2]
      };
    }());
    var child5 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 43,
                "column": 8
              },
              "end": {
                "line": 45,
                "column": 8
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","t",["sidebarMenu.studyCreator"],[],["loc",[null,[44,10],[44,42]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      var child1 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 46,
                "column": 8
              },
              "end": {
                "line": 48,
                "column": 8
              }
            },
            "moduleName": "rose/templates/sidebar-menu.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("          ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
            return morphs;
          },
          statements: [
            ["inline","t",["sidebarMenu.debugLog"],[],["loc",[null,[47,10],[47,38]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 39,
              "column": 2
            },
            "end": {
              "line": 51,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","item");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","menu");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("      ");
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
          var element1 = dom.childAt(element0, [3]);
          var morphs = new Array(3);
          morphs[0] = dom.createMorphAt(element0,1,1);
          morphs[1] = dom.createMorphAt(element1,1,1);
          morphs[2] = dom.createMorphAt(element1,2,2);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.extraFeatures"],[],["loc",[null,[41,6],[41,39]]]],
          ["block","link-to",["study-creator"],["class","item"],0,null,["loc",[null,[43,8],[45,20]]]],
          ["block","link-to",["debug-log"],["class","item"],1,null,["loc",[null,[46,8],[48,20]]]]
        ],
        locals: [],
        templates: [child0, child1]
      };
    }());
    var child6 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 52,
              "column": 2
            },
            "end": {
              "line": 54,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.help"],[],["loc",[null,[53,4],[53,28]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child7 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 55,
              "column": 2
            },
            "end": {
              "line": 57,
              "column": 2
            }
          },
          "moduleName": "rose/templates/sidebar-menu.hbs"
        },
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
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","t",["sidebarMenu.about"],[],["loc",[null,[56,4],[56,29]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 59,
            "column": 0
          }
        },
        "moduleName": "rose/templates/sidebar-menu.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","ui vertical menu");
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
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","header item");
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
        dom.setAttribute(el2,"class","header item");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
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
        var element4 = dom.childAt(fragment, [0]);
        var morphs = new Array(10);
        morphs[0] = dom.createMorphAt(element4,1,1);
        morphs[1] = dom.createMorphAt(element4,2,2);
        morphs[2] = dom.createMorphAt(element4,3,3);
        morphs[3] = dom.createMorphAt(element4,4,4);
        morphs[4] = dom.createMorphAt(dom.childAt(element4, [6]),1,1);
        morphs[5] = dom.createMorphAt(element4,8,8);
        morphs[6] = dom.createMorphAt(dom.childAt(element4, [10]),1,1);
        morphs[7] = dom.createMorphAt(element4,12,12);
        morphs[8] = dom.createMorphAt(element4,13,13);
        morphs[9] = dom.createMorphAt(element4,14,14);
        return morphs;
      },
      statements: [
        ["block","link-to",["index"],["class","header item"],0,null,["loc",[null,[2,2],[4,14]]]],
        ["block","link-to",["diary"],["class","item"],1,null,["loc",[null,[5,2],[7,14]]]],
        ["block","link-to",["backup"],["class","item"],2,null,["loc",[null,[8,2],[10,14]]]],
        ["block","link-to",["settings"],["class","item"],3,null,["loc",[null,[11,2],[13,14]]]],
        ["inline","t",["sidebarMenu.networks"],[],["loc",[null,[16,4],[16,32]]]],
        ["block","each",[["get","networks",["loc",[null,[19,10],[19,18]]]]],[],4,null,["loc",[null,[19,2],[34,11]]]],
        ["inline","t",["sidebarMenu.more"],[],["loc",[null,[37,4],[37,28]]]],
        ["block","liquid-if",[["get","settings.user.developerModeIsEnabled",["loc",[null,[39,15],[39,51]]]]],[],5,null,["loc",[null,[39,2],[51,16]]]],
        ["block","link-to",["help"],["class","item"],6,null,["loc",[null,[52,2],[54,14]]]],
        ["block","link-to",["about"],["class","item"],7,null,["loc",[null,[55,2],[57,14]]]]
      ],
      locals: [],
      templates: [child0, child1, child2, child3, child4, child5, child6, child7]
    };
  }()));

});
define('rose/templates/study-creator', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
              "loc": {
                "source": null,
                "start": {
                  "line": 102,
                  "column": 12
                },
                "end": {
                  "line": 110,
                  "column": 12
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
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
              dom.setAttribute(el2,"class","collapsing");
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
              var morphs = new Array(3);
              morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]),1,1);
              morphs[1] = dom.createMorphAt(dom.childAt(element2, [3]),0,0);
              morphs[2] = dom.createMorphAt(dom.childAt(element2, [5]),0,0);
              return morphs;
            },
            statements: [
              ["inline","ui-checkbox",[],["class","fitted toggle","checked",["subexpr","@mut",[["get","extractor.isEnabled",["loc",[null,[105,62],[105,81]]]]],[],[]]],["loc",[null,[105,18],[105,83]]]],
              ["content","extractor.name",["loc",[null,[107,20],[107,38]]]],
              ["content","extractor.version",["loc",[null,[108,20],[108,41]]]]
            ],
            locals: ["extractor"],
            templates: []
          };
        }());
        var child1 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
              "loc": {
                "source": null,
                "start": {
                  "line": 125,
                  "column": 12
                },
                "end": {
                  "line": 127,
                  "column": 12
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","ui green small horizontal label");
              dom.setAttribute(el1,"style","margin-left: 20px;");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
              return morphs;
            },
            statements: [
              ["inline","t",["studyCreator.secure"],[],["loc",[null,[126,84],[126,111]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        var child2 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
              "loc": {
                "source": null,
                "start": {
                  "line": 127,
                  "column": 12
                },
                "end": {
                  "line": 129,
                  "column": 12
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","ui small horizontal label");
              dom.setAttribute(el1,"style","margin-left: 20px;");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
              return morphs;
            },
            statements: [
              ["inline","t",["studyCreator.unknown"],[],["loc",[null,[128,78],[128,106]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        var child3 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.11",
              "loc": {
                "source": null,
                "start": {
                  "line": 142,
                  "column": 12
                },
                "end": {
                  "line": 152,
                  "column": 12
                }
              },
              "moduleName": "rose/templates/study-creator.hbs"
            },
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
              dom.setAttribute(el2,"class","collapsing");
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
              var element1 = dom.childAt(fragment, [1]);
              var morphs = new Array(5);
              morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
              morphs[1] = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
              morphs[2] = dom.createMorphAt(dom.childAt(element1, [5]),0,0);
              morphs[3] = dom.createMorphAt(dom.childAt(element1, [7]),0,0);
              morphs[4] = dom.createMorphAt(dom.childAt(element1, [9]),0,0);
              return morphs;
            },
            statements: [
              ["inline","ui-checkbox",[],["class","fitted toggle","checked",["subexpr","@mut",[["get","observer.isEnabled",["loc",[null,[145,62],[145,80]]]]],[],[]]],["loc",[null,[145,18],[145,82]]]],
              ["content","observer.name",["loc",[null,[147,20],[147,37]]]],
              ["content","observer.type",["loc",[null,[148,20],[148,37]]]],
              ["content","observer.priority",["loc",[null,[149,20],[149,41]]]],
              ["content","observer.version",["loc",[null,[150,20],[150,40]]]]
            ],
            locals: ["observer"],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 87,
                "column": 8
              },
              "end": {
                "line": 164,
                "column": 6
              }
            },
            "moduleName": "rose/templates/study-creator.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","ui field");
            dom.setAttribute(el1,"style","padding-top: 15px;");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("div");
            dom.setAttribute(el3,"class","ui green small horizontal label");
            dom.setAttribute(el3,"style","margin-left: 20px;");
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("table");
            dom.setAttribute(el2,"class","ui small compact table");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("thead");
            dom.setAttribute(el3,"class","full-width");
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
            var el4 = dom.createTextNode("            ");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("tfoot");
            dom.setAttribute(el3,"class","full-width");
            var el4 = dom.createTextNode("\n              ");
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("tr");
            var el5 = dom.createTextNode("\n                ");
            dom.appendChild(el4, el5);
            var el5 = dom.createElement("th");
            dom.setAttribute(el5,"colspan","3");
            var el6 = dom.createTextNode("\n                  ");
            dom.appendChild(el5, el6);
            var el6 = dom.createElement("button");
            dom.setAttribute(el6,"class","ui small green button");
            var el7 = dom.createComment("");
            dom.appendChild(el6, el7);
            dom.appendChild(el5, el6);
            var el6 = dom.createTextNode("\n                  ");
            dom.appendChild(el5, el6);
            var el6 = dom.createElement("button");
            dom.setAttribute(el6,"class","ui small basic button");
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
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","ui field");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("label");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("          ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("table");
            dom.setAttribute(el2,"class","ui small compact table");
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("thead");
            dom.setAttribute(el3,"class","full-width");
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
            var el4 = dom.createTextNode("            ");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("tfoot");
            dom.setAttribute(el3,"class","full-width");
            var el4 = dom.createTextNode("\n              ");
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("tr");
            var el5 = dom.createTextNode("\n                ");
            dom.appendChild(el4, el5);
            var el5 = dom.createElement("th");
            dom.setAttribute(el5,"colspan","5");
            var el6 = dom.createTextNode("\n                  ");
            dom.appendChild(el5, el6);
            var el6 = dom.createElement("button");
            dom.setAttribute(el6,"class","ui small green button");
            var el7 = dom.createComment("");
            dom.appendChild(el6, el7);
            dom.appendChild(el5, el6);
            var el6 = dom.createTextNode("\n                  ");
            dom.appendChild(el5, el6);
            var el6 = dom.createElement("button");
            dom.setAttribute(el6,"class","ui small basic button");
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
            var element3 = dom.childAt(fragment, [1]);
            var element4 = dom.childAt(element3, [1]);
            var element5 = dom.childAt(element3, [3]);
            var element6 = dom.childAt(element5, [1, 1]);
            var element7 = dom.childAt(element5, [5, 1, 1]);
            var element8 = dom.childAt(element7, [1]);
            var element9 = dom.childAt(element7, [3]);
            var element10 = dom.childAt(fragment, [3]);
            var element11 = dom.childAt(element10, [1]);
            var element12 = dom.childAt(element10, [3]);
            var element13 = dom.childAt(element12, [1, 1]);
            var element14 = dom.childAt(element12, [5, 1, 1]);
            var element15 = dom.childAt(element14, [1]);
            var element16 = dom.childAt(element14, [3]);
            var morphs = new Array(22);
            morphs[0] = dom.createMorphAt(element4,1,1);
            morphs[1] = dom.createMorphAt(dom.childAt(element4, [3]),0,0);
            morphs[2] = dom.createMorphAt(dom.childAt(element6, [1]),0,0);
            morphs[3] = dom.createMorphAt(dom.childAt(element6, [3]),0,0);
            morphs[4] = dom.createMorphAt(dom.childAt(element6, [5]),0,0);
            morphs[5] = dom.createMorphAt(dom.childAt(element5, [3]),1,1);
            morphs[6] = dom.createElementMorph(element8);
            morphs[7] = dom.createMorphAt(element8,0,0);
            morphs[8] = dom.createElementMorph(element9);
            morphs[9] = dom.createMorphAt(element9,0,0);
            morphs[10] = dom.createMorphAt(element11,1,1);
            morphs[11] = dom.createMorphAt(element11,3,3);
            morphs[12] = dom.createMorphAt(dom.childAt(element13, [1]),0,0);
            morphs[13] = dom.createMorphAt(dom.childAt(element13, [3]),0,0);
            morphs[14] = dom.createMorphAt(dom.childAt(element13, [5]),0,0);
            morphs[15] = dom.createMorphAt(dom.childAt(element13, [7]),0,0);
            morphs[16] = dom.createMorphAt(dom.childAt(element13, [9]),0,0);
            morphs[17] = dom.createMorphAt(dom.childAt(element12, [3]),1,1);
            morphs[18] = dom.createElementMorph(element15);
            morphs[19] = dom.createMorphAt(element15,0,0);
            morphs[20] = dom.createElementMorph(element16);
            morphs[21] = dom.createMorphAt(element16,0,0);
            return morphs;
          },
          statements: [
            ["inline","t",["studyCreator.extractors"],[],["loc",[null,[90,12],[90,43]]]],
            ["inline","t",["studyCreator.secure"],[],["loc",[null,[91,84],[91,111]]]],
            ["inline","t",["studyCreator.table.enabled"],[],["loc",[null,[96,20],[96,54]]]],
            ["inline","t",["studyCreator.table.name"],[],["loc",[null,[97,20],[97,51]]]],
            ["inline","t",["studyCreator.table.version"],[],["loc",[null,[98,20],[98,54]]]],
            ["block","each",[["get","network.extractors",["loc",[null,[102,20],[102,38]]]]],[],0,null,["loc",[null,[102,12],[110,21]]]],
            ["element","action",["enableAll",["get","network.extractors",["loc",[null,[115,77],[115,95]]]]],[],["loc",[null,[115,56],[115,97]]]],
            ["inline","t",["studyCreator.enableAll"],[],["loc",[null,[115,98],[115,128]]]],
            ["element","action",["disableAll",["get","network.extractors",["loc",[null,[116,78],[116,96]]]]],[],["loc",[null,[116,56],[116,98]]]],
            ["inline","t",["studyCreator.disableAll"],[],["loc",[null,[116,99],[116,130]]]],
            ["inline","t",["studyCreator.observers"],[],["loc",[null,[124,12],[124,42]]]],
            ["block","if",[["get","model.fingerprint",["loc",[null,[125,18],[125,35]]]]],[],1,2,["loc",[null,[125,12],[129,19]]]],
            ["inline","t",["studyCreator.table.enabled"],[],["loc",[null,[134,20],[134,54]]]],
            ["inline","t",["studyCreator.table.name"],[],["loc",[null,[135,20],[135,51]]]],
            ["inline","t",["studyCreator.table.type"],[],["loc",[null,[136,20],[136,51]]]],
            ["inline","t",["studyCreator.table.priority"],[],["loc",[null,[137,20],[137,55]]]],
            ["inline","t",["studyCreator.table.version"],[],["loc",[null,[138,20],[138,54]]]],
            ["block","each",[["get","network.observers",["loc",[null,[142,20],[142,37]]]]],[],3,null,["loc",[null,[142,12],[152,21]]]],
            ["element","action",["enableAll",["get","network.observers",["loc",[null,[157,77],[157,94]]]]],[],["loc",[null,[157,56],[157,96]]]],
            ["inline","t",["studyCreator.enableAll"],[],["loc",[null,[157,97],[157,127]]]],
            ["element","action",["disableAll",["get","network.observers",["loc",[null,[158,78],[158,95]]]]],[],["loc",[null,[158,56],[158,97]]]],
            ["inline","t",["studyCreator.disableAll"],[],["loc",[null,[158,98],[158,129]]]]
          ],
          locals: [],
          templates: [child0, child1, child2, child3]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 81,
              "column": 4
            },
            "end": {
              "line": 166,
              "column": 4
            }
          },
          "moduleName": "rose/templates/study-creator.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","field");
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
          var element17 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(element17,1,1);
          morphs[1] = dom.createMorphAt(element17,3,3);
          return morphs;
        },
        statements: [
          ["inline","ui-checkbox",[],["checked",["subexpr","@mut",[["get","network.isEnabled",["loc",[null,[83,30],[83,47]]]]],[],[]],"class","toggle","label",["subexpr","@mut",[["get","network.descriptiveName",["loc",[null,[85,28],[85,51]]]]],[],[]],"value",["subexpr","@mut",[["get","network",["loc",[null,[86,28],[86,35]]]]],[],[]]],["loc",[null,[83,8],[86,37]]]],
          ["block","if",[["get","network.isEnabled",["loc",[null,[87,14],[87,31]]]]],[],0,null,["loc",[null,[87,8],[164,13]]]]
        ],
        locals: ["network"],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.11",
            "loc": {
              "source": null,
              "start": {
                "line": 188,
                "column": 8
              },
              "end": {
                "line": 192,
                "column": 8
              }
            },
            "moduleName": "rose/templates/study-creator.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","item");
            var el2 = dom.createTextNode("\n          ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
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
            morphs[1] = dom.createMorphAt(element0,1,1);
            return morphs;
          },
          statements: [
            ["attribute","data-value",["get","interval.value",["loc",[null,[189,39],[189,53]]]]],
            ["inline","t",[["get","interval.label",["loc",[null,[190,14],[190,28]]]]],[],["loc",[null,[190,10],[190,30]]]]
          ],
          locals: ["interval"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.11",
          "loc": {
            "source": null,
            "start": {
              "line": 182,
              "column": 4
            },
            "end": {
              "line": 194,
              "column": 4
            }
          },
          "moduleName": "rose/templates/study-creator.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","default text");
          var el2 = dom.createTextNode("Select Interval");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.setAttribute(el1,"class","dropdown icon");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","menu");
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
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
          return morphs;
        },
        statements: [
          ["block","each",[["get","updateIntervals",["loc",[null,[188,16],[188,31]]]]],[],0,null,["loc",[null,[188,8],[192,17]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.11",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 210,
            "column": 0
          }
        },
        "moduleName": "rose/templates/study-creator.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1,"class","ui dividing header");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.setAttribute(el2,"class","lab icon");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","content");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","sub header");
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
        dom.setAttribute(el1,"class","ui form");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el3,"class","ui action input");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("button");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("i");
        dom.setAttribute(el5,"class","search icon");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
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
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el3,"class","ui input");
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
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","field");
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
        dom.setAttribute(el2,"class","field");
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
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","ui primary button");
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
        var element18 = dom.childAt(fragment, [0, 3]);
        var element19 = dom.childAt(fragment, [2]);
        var element20 = dom.childAt(element19, [1]);
        var element21 = dom.childAt(element19, [3]);
        var element22 = dom.childAt(element19, [5]);
        var element23 = dom.childAt(element19, [7]);
        var element24 = dom.childAt(element19, [9]);
        var element25 = dom.childAt(element24, [5]);
        var element26 = dom.childAt(element25, [3]);
        var element27 = dom.childAt(element19, [11]);
        var element28 = dom.childAt(element19, [13]);
        var element29 = dom.childAt(element19, [15]);
        var element30 = dom.childAt(element19, [17]);
        var element31 = dom.childAt(element19, [19]);
        var element32 = dom.childAt(element19, [21]);
        var morphs = new Array(36);
        morphs[0] = dom.createMorphAt(element18,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element18, [3]),0,0);
        morphs[2] = dom.createMorphAt(dom.childAt(element20, [1]),0,0);
        morphs[3] = dom.createMorphAt(dom.childAt(element20, [3]),0,0);
        morphs[4] = dom.createMorphAt(element20,5,5);
        morphs[5] = dom.createMorphAt(dom.childAt(element21, [1]),0,0);
        morphs[6] = dom.createMorphAt(dom.childAt(element21, [3]),0,0);
        morphs[7] = dom.createMorphAt(element21,5,5);
        morphs[8] = dom.createMorphAt(dom.childAt(element22, [1]),0,0);
        morphs[9] = dom.createMorphAt(dom.childAt(element22, [3]),0,0);
        morphs[10] = dom.createMorphAt(element22,5,5);
        morphs[11] = dom.createMorphAt(dom.childAt(element23, [1]),0,0);
        morphs[12] = dom.createMorphAt(dom.childAt(element23, [3]),0,0);
        morphs[13] = dom.createMorphAt(element23,5,5);
        morphs[14] = dom.createMorphAt(dom.childAt(element24, [1]),0,0);
        morphs[15] = dom.createMorphAt(dom.childAt(element24, [3]),0,0);
        morphs[16] = dom.createMorphAt(element25,1,1);
        morphs[17] = dom.createAttrMorph(element26, 'class');
        morphs[18] = dom.createElementMorph(element26);
        morphs[19] = dom.createMorphAt(dom.childAt(element27, [1]),0,0);
        morphs[20] = dom.createMorphAt(dom.childAt(element27, [3]),0,0);
        morphs[21] = dom.createMorphAt(dom.childAt(element27, [5]),1,1);
        morphs[22] = dom.createMorphAt(dom.childAt(element28, [1]),0,0);
        morphs[23] = dom.createMorphAt(dom.childAt(element28, [3]),0,0);
        morphs[24] = dom.createMorphAt(element28,5,5);
        morphs[25] = dom.createMorphAt(dom.childAt(element29, [1]),0,0);
        morphs[26] = dom.createMorphAt(dom.childAt(element29, [3]),0,0);
        morphs[27] = dom.createMorphAt(element29,5,5);
        morphs[28] = dom.createMorphAt(dom.childAt(element30, [1]),0,0);
        morphs[29] = dom.createMorphAt(dom.childAt(element30, [3]),0,0);
        morphs[30] = dom.createMorphAt(element30,5,5);
        morphs[31] = dom.createMorphAt(dom.childAt(element31, [1]),0,0);
        morphs[32] = dom.createMorphAt(dom.childAt(element31, [3]),0,0);
        morphs[33] = dom.createMorphAt(element31,5,5);
        morphs[34] = dom.createElementMorph(element32);
        morphs[35] = dom.createMorphAt(element32,1,1);
        return morphs;
      },
      statements: [
        ["inline","t",["studyCreator.title"],[],["loc",[null,[4,4],[4,30]]]],
        ["inline","t",["studyCreator.subtitle"],[],["loc",[null,[5,28],[5,57]]]],
        ["inline","t",["studyCreator.roseComments"],[],["loc",[null,[11,11],[11,44]]]],
        ["inline","t",["studyCreator.roseCommentsDesc"],[],["loc",[null,[12,7],[12,44]]]],
        ["inline","ui-checkbox",[],["checked",["subexpr","@mut",[["get","model.roseCommentsIsEnabled",["loc",[null,[14,26],[14,53]]]]],[],[]],"class","toggle","label",["subexpr","boolean-to-yesno",[["get","model.roseCommentsIsEnabled",["loc",[null,[16,42],[16,69]]]]],[],["loc",[null,[16,24],[16,70]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[17,27],[17,50]]]]],["loc",[null,[14,4],[17,52]]]],
        ["inline","t",["studyCreator.roseCommentsRating"],[],["loc",[null,[21,11],[21,50]]]],
        ["inline","t",["studyCreator.roseCommentsRatingDesc"],[],["loc",[null,[22,7],[22,50]]]],
        ["inline","ui-checkbox",[],["checked",["subexpr","@mut",[["get","model.roseCommentsRatingIsEnabled",["loc",[null,[24,26],[24,59]]]]],[],[]],"class","toggle","label",["subexpr","boolean-to-yesno",[["get","model.roseCommentsRatingIsEnabled",["loc",[null,[26,42],[26,75]]]]],[],["loc",[null,[26,24],[26,76]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[27,27],[27,50]]]]],["loc",[null,[24,4],[27,52]]]],
        ["inline","t",["studyCreator.salt"],[],["loc",[null,[31,11],[31,36]]]],
        ["inline","t",["studyCreator.saltDesc"],[],["loc",[null,[32,7],[32,36]]]],
        ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.salt",["loc",[null,[35,18],[35,28]]]]],[],[]],"insert-newline","saveSettings","focus-out","saveSettings"],["loc",[null,[34,4],[37,38]]]],
        ["inline","t",["studyCreator.hashLength"],[],["loc",[null,[41,11],[41,42]]]],
        ["inline","t",["studyCreator.hashLengthDesc"],[],["loc",[null,[42,7],[42,42]]]],
        ["inline","input",[],["type","number","value",["subexpr","@mut",[["get","model.hashLength",["loc",[null,[45,18],[45,34]]]]],[],[]],"insert-newline","saveSettings","focus-out","saveSettings"],["loc",[null,[44,4],[47,38]]]],
        ["inline","t",["studyCreator.repositoryUrl"],[],["loc",[null,[51,11],[51,45]]]],
        ["inline","t",["studyCreator.repositoryUrlDesc"],[],["loc",[null,[52,7],[52,45]]]],
        ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.repositoryURL",["loc",[null,[56,20],[56,39]]]]],[],[]],"insert-newline","fetchBaseFile"],["loc",[null,[55,6],[57,46]]]],
        ["attribute","class",["concat",["ui icon button ",["subexpr","if",[["get","baseFileIsLoading",["loc",[null,[59,41],[59,58]]]],"loading"],[],["loc",[null,[59,36],[59,70]]]]]]],
        ["element","action",["fetchBaseFile"],[],["loc",[null,[59,72],[59,98]]]],
        ["inline","t",["studyCreator.fingerprint"],[],["loc",[null,[66,11],[66,43]]]],
        ["inline","t",["studyCreator.fingerprintDesc"],[],["loc",[null,[67,7],[67,43]]]],
        ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.fingerprint",["loc",[null,[71,20],[71,37]]]]],[],[]],"insert-newline","saveSettings","focus-out","saveSettings"],["loc",[null,[70,6],[73,40]]]],
        ["inline","t",["studyCreator.networks"],[],["loc",[null,[78,11],[78,40]]]],
        ["inline","t",["studyCreator.networksDesc"],[],["loc",[null,[79,7],[79,40]]]],
        ["block","each",[["get","networks",["loc",[null,[81,12],[81,20]]]]],[],0,null,["loc",[null,[81,4],[166,13]]]],
        ["inline","t",["studyCreator.autoUpdate"],[],["loc",[null,[170,11],[170,42]]]],
        ["inline","t",["studyCreator.autoUpdateDesc"],[],["loc",[null,[171,7],[171,42]]]],
        ["inline","ui-checkbox",[],["checked",["subexpr","@mut",[["get","model.autoUpdateIsEnabled",["loc",[null,[173,26],[173,51]]]]],[],[]],"class","toggle","label",["subexpr","boolean-to-yesno",[["get","model.autoUpdateIsEnabled",["loc",[null,[175,42],[175,67]]]]],[],["loc",[null,[175,24],[175,68]]]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[176,27],[176,50]]]]],["loc",[null,[173,4],[176,52]]]],
        ["inline","t",["studyCreator.updateInterval"],[],["loc",[null,[180,11],[180,46]]]],
        ["inline","t",["studyCreator.updateIntervalLabel"],[],["loc",[null,[181,7],[181,47]]]],
        ["block","ui-dropdown",[],["class","selection","value",["subexpr","@mut",[["get","settings.system.updateInterval",["loc",[null,[183,26],[183,56]]]]],[],[]],"onChange",["subexpr","action",["saveSettings"],[],["loc",[null,[184,29],[184,52]]]]],1,null,["loc",[null,[182,4],[194,20]]]],
        ["inline","t",["studyCreator.exportConfig"],[],["loc",[null,[198,11],[198,44]]]],
        ["inline","t",["studyCreator.exportConfigDesc"],[],["loc",[null,[199,7],[199,44]]]],
        ["inline","input",[],["value",["subexpr","@mut",[["get","model.fileName",["loc",[null,[201,18],[201,32]]]]],[],[]],"insert-newline","saveSettings","focus-out","saveSettings"],["loc",[null,[201,4],[203,38]]]],
        ["element","action",["download"],[],["loc",[null,[206,36],[206,57]]]],
        ["inline","t",["action.download"],[],["loc",[null,[207,4],[207,27]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('rose/tests/adapters/application.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/application.js should pass jshint', function() { 
    ok(false, 'adapters/application.js should pass jshint.\nadapters/application.js: line 7, col 53, \'reject\' is defined but never used.\nadapters/application.js: line 18, col 53, \'reject\' is defined but never used.\nadapters/application.js: line 47, col 58, \'reject\' is defined but never used.\n\n3 errors'); 
  });

});
define('rose/tests/adapters/comment.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/comment.js should pass jshint', function() { 
    ok(true, 'adapters/comment.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/extractor.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/extractor.js should pass jshint', function() { 
    ok(true, 'adapters/extractor.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/interaction.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/interaction.js should pass jshint', function() { 
    ok(true, 'adapters/interaction.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/kango-adapter.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/kango-adapter.js should pass jshint', function() { 
    ok(false, 'adapters/kango-adapter.js should pass jshint.\nadapters/kango-adapter.js: line 80, col 39, Expected \'===\' and instead saw \'==\'.\nadapters/kango-adapter.js: line 56, col 35, \'snapshot\' is defined but never used.\nadapters/kango-adapter.js: line 62, col 43, \'recordArray\' is defined but never used.\nadapters/kango-adapter.js: line 99, col 48, \'reject\' is defined but never used.\nadapters/kango-adapter.js: line 110, col 48, \'reject\' is defined but never used.\nadapters/kango-adapter.js: line 131, col 51, \'reject\' is defined but never used.\nadapters/kango-adapter.js: line 139, col 51, \'reject\' is defined but never used.\n\n7 errors'); 
  });

});
define('rose/tests/adapters/network.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/network.js should pass jshint', function() { 
    ok(true, 'adapters/network.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/observer.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/observer.js should pass jshint', function() { 
    ok(true, 'adapters/observer.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/system-config.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/system-config.js should pass jshint', function() { 
    ok(true, 'adapters/system-config.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/user-setting.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/user-setting.js should pass jshint', function() { 
    ok(true, 'adapters/user-setting.js should pass jshint.'); 
  });

});
define('rose/tests/adapters/utils/queue.jshint', function () {

  'use strict';

  module('JSHint - adapters/utils');
  test('adapters/utils/queue.js should pass jshint', function() { 
    ok(true, 'adapters/utils/queue.js should pass jshint.'); 
  });

});
define('rose/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/backup.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/backup.js should pass jshint', function() { 
    ok(true, 'controllers/backup.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/comments.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/comments.js should pass jshint', function() { 
    ok(true, 'controllers/comments.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/diary.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/diary.js should pass jshint', function() { 
    ok(true, 'controllers/diary.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/index.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/index.js should pass jshint', function() { 
    ok(false, 'controllers/index.js should pass jshint.\ncontrollers/index.js: line 131, col 15, Expected \'{\' and instead saw \'return\'.\ncontrollers/index.js: line 133, col 15, Expected \'{\' and instead saw \'return\'.\ncontrollers/index.js: line 135, col 15, Expected \'{\' and instead saw \'return\'.\ncontrollers/index.js: line 137, col 15, Expected \'{\' and instead saw \'throw\'.\ncontrollers/index.js: line 179, col 15, Expected \'{\' and instead saw \'return\'.\ncontrollers/index.js: line 181, col 15, Expected \'{\' and instead saw \'return\'.\n\n6 errors'); 
  });

});
define('rose/tests/controllers/interactions.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/interactions.js should pass jshint', function() { 
    ok(true, 'controllers/interactions.js should pass jshint.'); 
  });

});
define('rose/tests/controllers/settings.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/settings.js should pass jshint', function() { 
    ok(false, 'controllers/settings.js should pass jshint.\ncontrollers/settings.js: line 30, col 50, \'e\' is defined but never used.\n\n1 error'); 
  });

});
define('rose/tests/controllers/study-creator.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/study-creator.js should pass jshint', function() { 
    ok(true, 'controllers/study-creator.js should pass jshint.'); 
  });

});
define('rose/tests/defaults/study-creator.jshint', function () {

  'use strict';

  module('JSHint - defaults');
  test('defaults/study-creator.js should pass jshint', function() { 
    ok(true, 'defaults/study-creator.js should pass jshint.'); 
  });

});
define('rose/tests/helpers/boolean-to-yesno.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/boolean-to-yesno.js should pass jshint', function() { 
    ok(true, 'helpers/boolean-to-yesno.js should pass jshint.'); 
  });

});
define('rose/tests/helpers/resolver', ['exports', 'ember/resolver', 'rose/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('rose/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('rose/tests/helpers/start-app', ['exports', 'ember', 'rose/app', 'rose/router', 'rose/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('rose/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('rose/tests/initializers/kango-api.jshint', function () {

  'use strict';

  module('JSHint - initializers');
  test('initializers/kango-api.js should pass jshint', function() { 
    ok(true, 'initializers/kango-api.js should pass jshint.'); 
  });

});
define('rose/tests/initializers/settings.jshint', function () {

  'use strict';

  module('JSHint - initializers');
  test('initializers/settings.js should pass jshint', function() { 
    ok(true, 'initializers/settings.js should pass jshint.'); 
  });

});
define('rose/tests/locales/de/config.jshint', function () {

  'use strict';

  module('JSHint - locales/de');
  test('locales/de/config.js should pass jshint', function() { 
    ok(true, 'locales/de/config.js should pass jshint.'); 
  });

});
define('rose/tests/locales/de/translations.jshint', function () {

  'use strict';

  module('JSHint - locales/de');
  test('locales/de/translations.js should pass jshint', function() { 
    ok(true, 'locales/de/translations.js should pass jshint.'); 
  });

});
define('rose/tests/locales/en/config.jshint', function () {

  'use strict';

  module('JSHint - locales/en');
  test('locales/en/config.js should pass jshint', function() { 
    ok(true, 'locales/en/config.js should pass jshint.'); 
  });

});
define('rose/tests/locales/en/translations.jshint', function () {

  'use strict';

  module('JSHint - locales/en');
  test('locales/en/translations.js should pass jshint', function() { 
    ok(true, 'locales/en/translations.js should pass jshint.'); 
  });

});
define('rose/tests/locales/languages.jshint', function () {

  'use strict';

  module('JSHint - locales');
  test('locales/languages.js should pass jshint', function() { 
    ok(true, 'locales/languages.js should pass jshint.'); 
  });

});
define('rose/tests/models/comment.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/comment.js should pass jshint', function() { 
    ok(true, 'models/comment.js should pass jshint.'); 
  });

});
define('rose/tests/models/diary-entry.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/diary-entry.js should pass jshint', function() { 
    ok(true, 'models/diary-entry.js should pass jshint.'); 
  });

});
define('rose/tests/models/extractor.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/extractor.js should pass jshint', function() { 
    ok(true, 'models/extractor.js should pass jshint.'); 
  });

});
define('rose/tests/models/interaction.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/interaction.js should pass jshint', function() { 
    ok(true, 'models/interaction.js should pass jshint.'); 
  });

});
define('rose/tests/models/network.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/network.js should pass jshint', function() { 
    ok(true, 'models/network.js should pass jshint.'); 
  });

});
define('rose/tests/models/observer.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/observer.js should pass jshint', function() { 
    ok(true, 'models/observer.js should pass jshint.'); 
  });

});
define('rose/tests/models/study-creator-setting.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/study-creator-setting.js should pass jshint', function() { 
    ok(true, 'models/study-creator-setting.js should pass jshint.'); 
  });

});
define('rose/tests/models/system-config.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/system-config.js should pass jshint', function() { 
    ok(true, 'models/system-config.js should pass jshint.'); 
  });

});
define('rose/tests/models/user-setting.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/user-setting.js should pass jshint', function() { 
    ok(true, 'models/user-setting.js should pass jshint.'); 
  });

});
define('rose/tests/pods/components/diary-entry/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/diary-entry');
  test('pods/components/diary-entry/component.js should pass jshint', function() { 
    ok(true, 'pods/components/diary-entry/component.js should pass jshint.'); 
  });

});
define('rose/tests/pods/components/file-input-button/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/file-input-button');
  test('pods/components/file-input-button/component.js should pass jshint', function() { 
    ok(true, 'pods/components/file-input-button/component.js should pass jshint.'); 
  });

});
define('rose/tests/pods/components/file-input/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/file-input');
  test('pods/components/file-input/component.js should pass jshint', function() { 
    ok(true, 'pods/components/file-input/component.js should pass jshint.'); 
  });

});
define('rose/tests/pods/components/installation-wizard/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/installation-wizard');
  test('pods/components/installation-wizard/component.js should pass jshint', function() { 
    ok(true, 'pods/components/installation-wizard/component.js should pass jshint.'); 
  });

});
define('rose/tests/pods/components/rose-comment/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/rose-comment');
  test('pods/components/rose-comment/component.js should pass jshint', function() { 
    ok(false, 'pods/components/rose-comment/component.js should pass jshint.\npods/components/rose-comment/component.js: line 8, col 5, Forgotten \'debugger\' statement?\npods/components/rose-comment/component.js: line 12, col 21, Expected \'{\' and instead saw \'return\'.\npods/components/rose-comment/component.js: line 13, col 21, Expected \'{\' and instead saw \'return\'.\npods/components/rose-comment/component.js: line 14, col 21, Expected \'{\' and instead saw \'return\'.\npods/components/rose-comment/component.js: line 24, col 21, Expected \'{\' and instead saw \'return\'.\npods/components/rose-comment/component.js: line 25, col 21, Expected \'{\' and instead saw \'return\'.\n\n6 errors'); 
  });

});
define('rose/tests/pods/components/rose-interaction/component.jshint', function () {

  'use strict';

  module('JSHint - pods/components/rose-interaction');
  test('pods/components/rose-interaction/component.js should pass jshint', function() { 
    ok(true, 'pods/components/rose-interaction/component.js should pass jshint.'); 
  });

});
define('rose/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('rose/tests/routes/about.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/about.js should pass jshint', function() { 
    ok(true, 'routes/about.js should pass jshint.'); 
  });

});
define('rose/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('rose/tests/routes/backup.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/backup.js should pass jshint', function() { 
    ok(true, 'routes/backup.js should pass jshint.'); 
  });

});
define('rose/tests/routes/comments.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/comments.js should pass jshint', function() { 
    ok(true, 'routes/comments.js should pass jshint.'); 
  });

});
define('rose/tests/routes/debug-log.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/debug-log.js should pass jshint', function() { 
    ok(false, 'routes/debug-log.js should pass jshint.\nroutes/debug-log.js: line 5, col 20, \'Promise\' is not defined.\nroutes/debug-log.js: line 5, col 38, \'reject\' is defined but never used.\n\n2 errors'); 
  });

});
define('rose/tests/routes/diary.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/diary.js should pass jshint', function() { 
    ok(true, 'routes/diary.js should pass jshint.'); 
  });

});
define('rose/tests/routes/help.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/help.js should pass jshint', function() { 
    ok(true, 'routes/help.js should pass jshint.'); 
  });

});
define('rose/tests/routes/index.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/index.js should pass jshint', function() { 
    ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('rose/tests/routes/interactions.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/interactions.js should pass jshint', function() { 
    ok(true, 'routes/interactions.js should pass jshint.'); 
  });

});
define('rose/tests/routes/privacysettings.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/privacysettings.js should pass jshint', function() { 
    ok(true, 'routes/privacysettings.js should pass jshint.'); 
  });

});
define('rose/tests/routes/settings.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/settings.js should pass jshint', function() { 
    ok(true, 'routes/settings.js should pass jshint.'); 
  });

});
define('rose/tests/routes/study-creator.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/study-creator.js should pass jshint', function() { 
    ok(true, 'routes/study-creator.js should pass jshint.'); 
  });

});
define('rose/tests/services/settings.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/settings.js should pass jshint', function() { 
    ok(true, 'services/settings.js should pass jshint.'); 
  });

});
define('rose/tests/test-helper', ['rose/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('rose/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('rose/tests/transforms/array.jshint', function () {

  'use strict';

  module('JSHint - transforms');
  test('transforms/array.js should pass jshint', function() { 
    ok(false, 'transforms/array.js should pass jshint.\ntransforms/array.js: line 6, col 40, Expected \'===\' and instead saw \'==\'.\ntransforms/array.js: line 11, col 16, Expected \'===\' and instead saw \'==\'.\ntransforms/array.js: line 13, col 23, Expected \'===\' and instead saw \'==\'.\n\n3 errors'); 
  });

});
define('rose/tests/unit/adapters/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:application', 'ApplicationAdapter', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/application-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/application-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/comment-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:comment', 'CommentAdapter', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/comment-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/comment-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/comment-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/extractor-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:extractor', 'Unit | Adapter | extractor', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/extractor-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/extractor-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/extractor-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/interaction-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:interaction', 'InteractionAdapter', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/interaction-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/interaction-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/interaction-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/kango-adapter-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:kango-adapter', 'KangoAdapterAdapter', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/kango-adapter-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/kango-adapter-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/kango-adapter-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/observer-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:observer', 'Unit | Adapter | observer', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/observer-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/observer-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/observer-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/system-config-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:system-config', 'Unit | Adapter | system config', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/system-config-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/system-config-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/system-config-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/adapters/user-setting-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:user-setting', 'UserSettingAdapter', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('rose/tests/unit/adapters/user-setting-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/user-setting-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/user-setting-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:application', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/application-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/application-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/backup-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:backup', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/backup-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/backup-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/backup-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/comments-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:comments', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/comments-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/comments-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/comments-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/diary-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:diary', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/diary-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/diary-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/diary-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:index', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/index-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/index-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/interactions-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:interactions', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/interactions-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/interactions-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/interactions-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/modal/confirm-reset-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:modal/confirm-reset', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/modal/confirm-reset-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers/modal');
  test('unit/controllers/modal/confirm-reset-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/modal/confirm-reset-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/settings-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:settings', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/settings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/settings-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/settings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/controllers/study-creator-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:study-creator', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('rose/tests/unit/controllers/study-creator-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/study-creator-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/study-creator-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/helpers/boolean-to-yesno-test', ['rose/helpers/boolean-to-yesno', 'qunit'], function (boolean_to_yesno, qunit) {

  'use strict';

  qunit.module('Unit | Helper | boolean to yesno');

  // Replace this with your real tests.
  qunit.test('it works', function (assert) {
    var result = boolean_to_yesno.booleanToYesno(42);
    assert.ok(result);
  });

});
define('rose/tests/unit/helpers/boolean-to-yesno-test.jshint', function () {

  'use strict';

  module('JSHint - unit/helpers');
  test('unit/helpers/boolean-to-yesno-test.js should pass jshint', function() { 
    ok(true, 'unit/helpers/boolean-to-yesno-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/initializers/kango-api-test', ['ember', 'rose/initializers/kango-api', 'qunit'], function (Ember, kango_api, qunit) {

  'use strict';

  var container, application;

  qunit.module('KangoApiInitializer', {
    beforeEach: function beforeEach() {
      Ember['default'].run(function () {
        application = Ember['default'].Application.create();
        container = application.__container__;
        application.deferReadiness();
      });
    }
  });

  // Replace this with your real tests.
  qunit.test('it works', function (assert) {
    kango_api.initialize(container, application);

    // you would normally confirm the results of the initializer here
    assert.ok(true);
  });

});
define('rose/tests/unit/initializers/kango-api-test.jshint', function () {

  'use strict';

  module('JSHint - unit/initializers');
  test('unit/initializers/kango-api-test.js should pass jshint', function() { 
    ok(true, 'unit/initializers/kango-api-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/initializers/settings-test', ['ember', 'rose/initializers/settings', 'qunit'], function (Ember, settings, qunit) {

  'use strict';

  var registry, application;

  qunit.module('Unit | Initializer | settings', {
    beforeEach: function beforeEach() {
      Ember['default'].run(function () {
        application = Ember['default'].Application.create();
        registry = application.registry;
        application.deferReadiness();
      });
    }
  });

  // Replace this with your real tests.
  qunit.test('it works', function (assert) {
    settings.initialize(registry, application);

    // you would normally confirm the results of the initializer here
    assert.ok(true);
  });

});
define('rose/tests/unit/initializers/settings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/initializers');
  test('unit/initializers/settings-test.js should pass jshint', function() { 
    ok(true, 'unit/initializers/settings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/initializers/user-settings-test', ['ember', 'rose/initializers/user-settings', 'qunit'], function (Ember, user_settings, qunit) {

  'use strict';

  var container, application;

  qunit.module('UserSettingsInitializer', {
    beforeEach: function beforeEach() {
      Ember['default'].run(function () {
        application = Ember['default'].Application.create();
        container = application.__container__;
        application.deferReadiness();
      });
    }
  });

  // Replace this with your real tests.
  qunit.test('it works', function (assert) {
    user_settings.initialize(container, application);

    // you would normally confirm the results of the initializer here
    assert.ok(true);
  });

});
define('rose/tests/unit/initializers/user-settings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/initializers');
  test('unit/initializers/user-settings-test.js should pass jshint', function() { 
    ok(true, 'unit/initializers/user-settings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/comment-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('comment', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/comment-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/comment-test.js should pass jshint', function() { 
    ok(true, 'unit/models/comment-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/diary-entry-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('diary-entry', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/diary-entry-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/diary-entry-test.js should pass jshint', function() { 
    ok(true, 'unit/models/diary-entry-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/extractor-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('extractor', 'Unit | Model | extractor', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/extractor-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/extractor-test.js should pass jshint', function() { 
    ok(true, 'unit/models/extractor-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/interaction-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('interaction', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/interaction-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/interaction-test.js should pass jshint', function() { 
    ok(true, 'unit/models/interaction-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/network-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('network', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/network-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/network-test.js should pass jshint', function() { 
    ok(true, 'unit/models/network-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/observer-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('observer', 'Unit | Model | observer', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/observer-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/observer-test.js should pass jshint', function() { 
    ok(true, 'unit/models/observer-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/study-creator-setting-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('study-creator-setting', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/study-creator-setting-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/study-creator-setting-test.js should pass jshint', function() { 
    ok(true, 'unit/models/study-creator-setting-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/system-config-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('system-config', 'Unit | Model | system config', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/system-config-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/system-config-test.js should pass jshint', function() { 
    ok(true, 'unit/models/system-config-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/models/user-setting-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('user-setting', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('rose/tests/unit/models/user-setting-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/user-setting-test.js should pass jshint', function() { 
    ok(true, 'unit/models/user-setting-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/diary-entry/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('diary-entry', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar']
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/diary-entry/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/diary-entry');
  test('unit/pods/components/diary-entry/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/diary-entry/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/file-input-button/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('file-input-button', 'Unit | Component | file input button', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar'],
    unit: true
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/file-input-button/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/file-input-button');
  test('unit/pods/components/file-input-button/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/file-input-button/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/file-input/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('file-input', 'Unit | Component | file input', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar'],
    unit: true
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/file-input/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/file-input');
  test('unit/pods/components/file-input/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/file-input/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/high-chart/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('high-chart', 'Unit | Component | high chart', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar'],
    unit: true
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/high-chart/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/high-chart');
  test('unit/pods/components/high-chart/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/high-chart/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/installation-wizard/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('installation-wizard', 'Unit | Component | installation wizard', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar'],
    unit: true
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/installation-wizard/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/installation-wizard');
  test('unit/pods/components/installation-wizard/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/installation-wizard/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/rose-comment/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('rose-comment', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar']
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/rose-comment/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/rose-comment');
  test('unit/pods/components/rose-comment/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/rose-comment/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/pods/components/rose-interaction/component-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('rose-interaction', {
    // Specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar']
  });

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

});
define('rose/tests/unit/pods/components/rose-interaction/component-test.jshint', function () {

  'use strict';

  module('JSHint - unit/pods/components/rose-interaction');
  test('unit/pods/components/rose-interaction/component-test.js should pass jshint', function() { 
    ok(true, 'unit/pods/components/rose-interaction/component-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/about-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:about', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/about-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/about-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/about-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:application', 'Unit | Route | application', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/application-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/application-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/backup-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:backup', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/backup-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/backup-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/backup-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/comments-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:comments', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/comments-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/comments-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/comments-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/debug-log-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:debug-log', 'Unit | Route | debug log', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/debug-log-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/debug-log-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/debug-log-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/diary-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:diary', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/diary-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/diary-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/diary-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/help-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:help', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/help-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/help-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/help-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:index', 'Unit | Route | index', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/index-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/index-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/interactions-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:interactions', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/interactions-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/interactions-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/interactions-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/privacysettings-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:privacysettings', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/privacysettings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/privacysettings-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/privacysettings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/settings-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:settings', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/settings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/settings-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/settings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/routes/study-creator-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:study-creator', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('rose/tests/unit/routes/study-creator-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/study-creator-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/study-creator-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/services/settings-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:settings', 'Unit | Service | settings', {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

});
define('rose/tests/unit/services/settings-test.jshint', function () {

  'use strict';

  module('JSHint - unit/services');
  test('unit/services/settings-test.js should pass jshint', function() { 
    ok(true, 'unit/services/settings-test.js should pass jshint.'); 
  });

});
define('rose/tests/unit/transforms/array-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('transform:array', 'Unit | Transform | array', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var transform = this.subject();
    assert.ok(transform);
  });

});
define('rose/tests/unit/transforms/array-test.jshint', function () {

  'use strict';

  module('JSHint - unit/transforms');
  test('unit/transforms/array-test.js should pass jshint', function() { 
    ok(true, 'unit/transforms/array-test.js should pass jshint.'); 
  });

});
define('rose/transforms/array', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  exports['default'] = DS['default'].Transform.extend({
    deserialize: function deserialize(serialized) {
      return Ember['default'].typeOf(serialized) == "array" ? serialized : [];
    },

    serialize: function serialize(deserialized) {
      var type = Ember['default'].typeOf(deserialized);
      if (type == 'array') {
        return deserialized;
      } else if (type == 'string') {
        return deserialized.split(',').map(function (item) {
          return Ember['default'].$.trim(item);
        });
      } else {
        return [];
      }
    }
  });

});
define('rose/transitions/cross-fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = crossFade;
  // BEGIN-SNIPPET cross-fade-definition
  function crossFade() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    liquid_fire.stop(this.oldElement);
    return liquid_fire.Promise.all([liquid_fire.animate(this.oldElement, { opacity: 0 }, opts), liquid_fire.animate(this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts)]);
  }

  // END-SNIPPET

});
define('rose/transitions/default', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = defaultTransition;
  function defaultTransition() {
    if (this.newElement) {
      this.newElement.css({ visibility: '' });
    }
    return liquid_fire.Promise.resolve();
  }

});
define('rose/transitions/explode', ['exports', 'ember', 'liquid-fire'], function (exports, Ember, liquid_fire) {

  'use strict';



  exports['default'] = explode;

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
    return liquid_fire.Promise.all(promises);
  }

  function explodePiece(context, piece, seen) {
    var childContext = Ember['default'].copy(context);
    var selectors = [piece.pickOld || piece.pick, piece.pickNew || piece.pick];
    var cleanupOld, cleanupNew;

    if (selectors[0] || selectors[1]) {
      cleanupOld = _explodePart(context, 'oldElement', childContext, selectors[0], seen);
      cleanupNew = _explodePart(context, 'newElement', childContext, selectors[1], seen);
      if (!cleanupOld && !cleanupNew) {
        return liquid_fire.Promise.resolve();
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
        var guid = Ember['default'].guidFor(this);
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
    if (Ember['default'].isArray(piece.use)) {
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
      return liquid_fire.Promise.resolve(func.apply(this, args));
    };
  }

  function runAnimation(context, piece) {
    return new liquid_fire.Promise(function (resolve, reject) {
      animationFor(context, piece).apply(context).then(resolve, reject);
    });
  }

  function matchAndExplode(context, piece, seen) {
    if (!context.oldElement || !context.newElement) {
      return liquid_fire.Promise.resolve();
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

    var hits = Ember['default'].A(context.oldElement.find("[" + piece.matchBy + "]").toArray());
    return liquid_fire.Promise.all(hits.map(function (elt) {
      var attrValue = Ember['default'].$(elt).attr(piece.matchBy);

      // if there is no match for a particular item just skip it
      if (attrValue === "" || context.newElement.find(selector(attrValue)).length === 0) {
        return liquid_fire.Promise.resolve();
      }

      return explodePiece(context, {
        pick: selector(attrValue),
        use: piece.use
      }, seen);
    }));
  }

});
define('rose/transitions/fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = fade;

  // BEGIN-SNIPPET fade-definition
  function fade() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var firstStep;
    var outOpts = opts;
    var fadingElement = findFadingElement(this);

    if (fadingElement) {
      // We still have some older version that is in the process of
      // fading out, so out first step is waiting for it to finish.
      firstStep = liquid_fire.finish(fadingElement, 'fade-out');
    } else {
      if (liquid_fire.isAnimating(this.oldElement, 'fade-in')) {
        // if the previous view is partially faded in, scale its
        // fade-out duration appropriately.
        outOpts = { duration: liquid_fire.timeSpent(this.oldElement, 'fade-in') };
      }
      liquid_fire.stop(this.oldElement);
      firstStep = liquid_fire.animate(this.oldElement, { opacity: 0 }, outOpts, 'fade-out');
    }
    return firstStep.then(function () {
      return liquid_fire.animate(_this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts, 'fade-in');
    });
  }

  function findFadingElement(context) {
    for (var i = 0; i < context.older.length; i++) {
      var entry = context.older[i];
      if (liquid_fire.isAnimating(entry.element, 'fade-out')) {
        return entry.element;
      }
    }
    if (liquid_fire.isAnimating(context.oldElement, 'fade-out')) {
      return context.oldElement;
    }
  }
  // END-SNIPPET

});
define('rose/transitions/flex-grow', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = flexGrow;
  function flexGrow(opts) {
    liquid_fire.stop(this.oldElement);
    return liquid_fire.Promise.all([liquid_fire.animate(this.oldElement, { 'flex-grow': 0 }, opts), liquid_fire.animate(this.newElement, { 'flex-grow': [1, 0] }, opts)]);
  }

});
define('rose/transitions/fly-to', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = flyTo;
  function flyTo() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if (!this.newElement) {
      return liquid_fire.Promise.resolve();
    } else if (!this.oldElement) {
      this.newElement.css({ visibility: '' });
      return liquid_fire.Promise.resolve();
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
      return liquid_fire.animate(this.newElement, motion, opts);
    } else {
      var motion = {
        translateX: newOffset.left - oldOffset.left,
        translateY: newOffset.top - oldOffset.top,
        outerWidth: this.newElement.outerWidth(),
        outerHeight: this.newElement.outerHeight()
      };
      this.newElement.css({ visibility: 'hidden' });
      return liquid_fire.animate(this.oldElement, motion, opts).then(function () {
        _this.newElement.css({ visibility: '' });
      });
    }
  }

});
define('rose/transitions/move-over', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



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

    if (liquid_fire.isAnimating(this.oldElement, 'moving-in')) {
      firstStep = liquid_fire.finish(this.oldElement, 'moving-in');
    } else {
      liquid_fire.stop(this.oldElement);
      firstStep = liquid_fire.Promise.resolve();
    }

    return firstStep.then(function () {
      var bigger = biggestSize(_this, measure);
      oldParams[property] = bigger * direction + 'px';
      newParams[property] = ["0px", -1 * bigger * direction + 'px'];

      return liquid_fire.Promise.all([liquid_fire.animate(_this.oldElement, oldParams, opts), liquid_fire.animate(_this.newElement, newParams, opts, 'moving-in')]);
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
define('rose/transitions/scale', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = scale;
  function scale() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return liquid_fire.animate(this.oldElement, { scale: [0.2, 1] }, opts).then(function () {
      return liquid_fire.animate(_this.newElement, { scale: [1, 0.2] }, opts);
    });
  }

});
define('rose/transitions/scroll-then', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function (nextTransitionName, options) {
    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      rest[_key - 2] = arguments[_key];
    }

    var _this = this;

    Ember['default'].assert("You must provide a transition name as the first argument to scrollThen. Example: this.use('scrollThen', 'toLeft')", 'string' === typeof nextTransitionName);

    var el = document.getElementsByTagName('html');
    var nextTransition = this.lookup(nextTransitionName);
    if (!options) {
      options = {};
    }

    Ember['default'].assert("The second argument to scrollThen is passed to Velocity's scroll function and must be an object", 'object' === typeof options);

    // set scroll options via: this.use('scrollThen', 'ToLeft', {easing: 'spring'})
    options = Ember['default'].merge({ duration: 500, offset: 0 }, options);

    // additional args can be passed through after the scroll options object
    // like so: this.use('scrollThen', 'moveOver', {duration: 100}, 'x', -1);

    return window.$.Velocity(el, 'scroll', options).then(function () {
      nextTransition.apply(_this, rest);
    });
  }

});
define('rose/transitions/to-down', ['exports', 'rose/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, 'y', 1, opts);
  }

});
define('rose/transitions/to-left', ['exports', 'rose/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, 'x', -1, opts);
  }

});
define('rose/transitions/to-right', ['exports', 'rose/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, 'x', 1, opts);
  }

});
define('rose/transitions/to-up', ['exports', 'rose/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, 'y', -1, opts);
  }

});
define('rose/utils/i18n/compile-template', ['exports', 'ember-i18n/compile-template'], function (exports, compileTemplate) {

	'use strict';

	exports['default'] = compileTemplate['default'];

});
define('rose/utils/i18n/missing-message', ['exports', 'ember-i18n/missing-message'], function (exports, missingMessage) {

	'use strict';

	exports['default'] = missingMessage['default'];

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

if (runningTests) {
  require("rose/tests/test-helper");
} else {
  require("rose/app")["default"].create({"name":"rose","version":"3.0.0yiran8"});
}

/* jshint ignore:end */
//# sourceMappingURL=rose.map