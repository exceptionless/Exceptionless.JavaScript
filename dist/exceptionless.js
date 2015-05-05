/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.1.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    function lib$es6$promise$asap$$asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        lib$es6$promise$asap$$scheduleFlush();
      }
    }

    var lib$es6$promise$asap$$default = lib$es6$promise$asap$$asap;

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$default(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$default(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$default(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('stackframe', [], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.StackFrame = factory();
    }
}(this, function () {
    'use strict';
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function StackFrame(functionName, args, fileName, lineNumber, columnNumber) {
        if (functionName !== undefined) {
            this.setFunctionName(functionName);
        }
        if (args !== undefined) {
            this.setArgs(args);
        }
        if (fileName !== undefined) {
            this.setFileName(fileName);
        }
        if (lineNumber !== undefined) {
            this.setLineNumber(lineNumber);
        }
        if (columnNumber !== undefined) {
            this.setColumnNumber(columnNumber);
        }
    }

    StackFrame.prototype = {
        getFunctionName: function () {
            return this.functionName;
        },
        setFunctionName: function (v) {
            this.functionName = String(v);
        },

        getArgs: function () {
            return this.args;
        },
        setArgs: function (v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
        getFileName: function () {
            return this.fileName;
        },
        setFileName: function (v) {
            this.fileName = String(v);
        },

        getLineNumber: function () {
            return this.lineNumber;
        },
        setLineNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Line Number must be a Number');
            }
            this.lineNumber = Number(v);
        },

        getColumnNumber: function () {
            return this.columnNumber;
        },
        setColumnNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Column Number must be a Number');
            }
            this.columnNumber = Number(v);
        },

        toString: function() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }
    };

    return StackFrame;
}));

(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('error-stack-parser', ['stackframe'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('stackframe'));
    } else {
        root.ErrorStackParser = factory(root.StackFrame);
    }
}(this, function ErrorStackParser(StackFrame) {
    'use strict';

    var FIREFOX_SAFARI_STACK_REGEXP = /\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /\s+at /;

    return {
        /**
         * Given an Error object, extract the most information from it.
         * @param error {Error}
         * @return Array[StackFrame]
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
                return this.parseFFOrSafari(error);
            } else {
                throw new Error('Cannot parse given Error object');
            }
        },

        /**
         * Separate line and column numbers from a URL-like string.
         * @param urlLike String
         * @return Array[String]
         */
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            var locationParts = urlLike.split(':');
            var lastNumber = locationParts.pop();
            var possibleNumber = locationParts[locationParts.length - 1];
            if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
                var lineNumber = locationParts.pop();
                return [locationParts.join(':'), lineNumber, lastNumber];
            } else {
                return [locationParts.join(':'), lastNumber, undefined];
            }
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
            return error.stack.split('\n').slice(1).map(function (line) {
                var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, ''));
                var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.shift() || undefined;
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(undefined, undefined, match[2], match[1]));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1]));
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
                    !line.match(/^Error created at/);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        }
    };
}));


(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('stack-generator', ['stackframe'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('stackframe'));
    } else {
        root.StackGenerator = factory(root.StackFrame);
    }
}(this, function (StackFrame) {
    return {
        backtrace: function StackGenerator$$backtrace(opts) {
            var stack = [];
            var maxStackSize = 10;

            if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
                maxStackSize = opts.maxStackSize;
            }

            var curr = arguments.callee;
            while (curr && stack.length < maxStackSize) {
                var args = [].slice.call(curr['arguments']);
                if (/function(?:\s+([\w$]+))?\s*\(/.test(curr.toString())) {
                    stack.push(new StackFrame(RegExp.$1 || undefined, args));
                } else {
                    stack.push(new StackFrame(undefined, args));
                }

                try {
                    curr = curr.caller;
                } catch (e) {
                    break;
                }
            }
            return stack;
        }
    };
}));

(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('stacktrace-gps', ['source-map', 'es6-promise', 'stackframe'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(null, require('es6-promise'), require('stackframe'));
    } else {
        root.StackTraceGPS = factory(root.SourceMap, root.ES6Promise, root.StackFrame);
    }
}(this, function (SourceMap, ES6Promise) {
    'use strict';
    ES6Promise.polyfill();
    var Promise = ES6Promise.Promise;

    /**
     * Create XHR or equivalent object for this environment.
     * @returns XMLHttpRequest, XDomainRequest or ActiveXObject
     * @private
     */
    function _createXMLHTTPObject() {
        var xmlhttp;
        var XMLHttpFactories = [
            function () {
                return new XMLHttpRequest();
            }, function () {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                _createXMLHTTPObject = XMLHttpFactories[i]; // jshint ignore:line
                return xmlhttp;
            } catch (e) {
            }
        }
    }

    /**
     * Make a X-Domain request to url and callback.
     *
     * @param url [String]
     * @param callback [Function] to callback on completion
     * @param errback [Function] to callback on error
     */
    function _xdr(url, callback, errback) {
        var req = _createXMLHTTPObject();
        req.open('get', url);
        req.onerror = errback;
        req.onreadystatechange = function onreadystatechange() {
            if (req.readyState === 4) {
                if (req.status >= 200 && req.status < 400) {
                    return callback(req.responseText);
                } else {
                    errback(new Error('Unable to retrieve ' + url));
                }
            }
        };
        req.send();
    }

    function _findFunctionName(source, lineNumber, columnNumber) {
        // function {name}({args}) m[1]=name m[2]=args
        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
        // {name} = function ({args}) TODO args capture
        var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
        // {name} = eval()
        var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
        var lines = source.split("\n");

        // Walk backwards in the source lines until we find the line which matches one of the patterns above
        var code = '', line, maxLines = Math.min(lineNumber, 20), m, commentPos;
        for (var i = 0; i < maxLines; ++i) {
            // lineNo is 1-based, source[] is 0-based
            line = lines[lineNumber - i - 1];
            commentPos = line.indexOf('//');
            if (commentPos >= 0) {
                line = line.substr(0, commentPos);
            }

            if (line) {
                code = line + code;
                m = reFunctionExpression.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
                m = reFunctionDeclaration.exec(code);
                if (m && m[1]) {
                    //return m[1] + "(" + (m[2] || "") + ")";
                    return m[1];
                }
                m = reFunctionEvaluation.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return undefined;
    }

    function _ensureSupportedEnvironment() {
        if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
            throw new Error('Unable to consume source maps in older browsers');
        }
    }

    function _ensureStackFrameIsLegit(stackframe) {
        if (typeof stackframe !== 'object') {
            throw new TypeError('Given StackFrame is not an object');
        } else if (typeof stackframe.fileName !== 'string') {
            throw new TypeError('Given file name is not a String');
        } else if (typeof stackframe.lineNumber !== 'number' || stackframe.lineNumber % 1 !== 0 || stackframe.lineNumber < 1) {
            throw new TypeError('Given line number must be a positive integer');
        } else if (typeof stackframe.columnNumber !== 'number' || stackframe.columnNumber % 1 !== 0 || stackframe.columnNumber < 0) {
            throw new TypeError('Given column number must be a non-negative integer');
        }
        return true;
    }

    function _findSourceMappingURL(source) {
        var m = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)$/.exec(source);
        if (m && m[1]) {
            return m[1];
        } else {
            throw new Error('sourceMappingURL not found');
        }
    }

    function _newLocationInfoFromSourceMap(rawSourceMap, args, lineNumber, columnNumber) {
        var loc = new SourceMap.SourceMapConsumer(rawSourceMap)
            .originalPositionFor({line: lineNumber, column: columnNumber});
        return new StackFrame(loc.name, args, loc.source, loc.line, loc.column);
    }

    /**
     * @param opts: [Object] options.
     *      opts.sourceCache = {url: "Source String"} => preload source cache
     *      opts.offline = True to prevent network requests.
     *              Best effort without sources or source maps.
     */
    return function StackTraceGPS(opts) {
        if (!(this instanceof StackTraceGPS)) {
            return new StackTraceGPS(opts);
        }
        opts = opts || {};

        this.sourceCache = opts.sourceCache || {};

        this._get = function _get(location) {
            return new Promise(function (resolve, reject) {
                if (this.sourceCache[location]) {
                    resolve(this.sourceCache[location]);
                } else if (opts.offline) {
                    reject(new Error('Cannot make network requests in offline mode'));
                } else {
                    _xdr(location, function (source) {
                        this.sourceCache[location] = source;
                        resolve(source);
                    }.bind(this), reject);
                }
            }.bind(this));
        };

        /**
         * Given a StackFrame, enhance function name and use source maps for a
         * better StackFrame.
         *
         * @param stackframe - {StackFrame}-like object
         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
         * @return StackFrame with source-mapped location
         */
        this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
            return this.getMappedLocation(stackframe)
                .then(this.findFunctionName.bind(this));
        };

        /**
         * Given a StackFrame, guess function name from location information.
         *
         * @param stackframe - {StackFrame}-like object
         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
         * @return StackFrame with guessed function name
         */
        this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
            return new Promise(function (resolve, reject) {
                _ensureStackFrameIsLegit(stackframe);
                this._get(stackframe.fileName).then(function getSourceCallback(source) {
                    var guessedFunctionName = _findFunctionName(source, stackframe.lineNumber, stackframe.columnNumber);
                    resolve(new StackFrame(guessedFunctionName, stackframe.args, stackframe.fileName, stackframe.lineNumber, stackframe.columnNumber));
                }, reject);
            }.bind(this));
        };

        /**
         * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
         *
         * @param stackframe - {StackFrame}-like object
         *      {fileName: 'path/to/file.js', lineNumber: 100, columnNumber: 5}
         * @return StackFrame with source-mapped location
         */
        this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
            return new Promise(function (resolve, reject) {
                _ensureSupportedEnvironment();
                _ensureStackFrameIsLegit(stackframe);

                this._get(stackframe.fileName).then(function (source) {
                    this._get(_findSourceMappingURL(source)).then(function (map) {
                        var lineNumber = stackframe.lineNumber;
                        var columnNumber = stackframe.columnNumber;
                        resolve(_newLocationInfoFromSourceMap(map, stackframe.args, lineNumber, columnNumber));
                    }, reject)['catch'](reject);
                }.bind(this), reject)['catch'](reject);
            }.bind(this));
        };
    };
}));

(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('stacktrace', ['error-stack-parser', 'stack-generator', 'stacktrace-gps', 'es6-promise'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('error-stack-parser'), require('stack-generator'), require('stacktrace-gps'), require('es6-promise'));
    } else {
        root.StackTrace = factory(root.ErrorStackParser, root.StackGenerator, root.StackTraceGPS, root.ES6Promise);
    }
}(this, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS, ES6Promise) {
    ES6Promise.polyfill();
    var Promise = ES6Promise.Promise;

    var _options = {
        filter: function (stackframe) {
            // Filter out stackframes for this library by default
            return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
                (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
                (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
        }
    };

    /**
     * Merge 2 given Objects. If a conflict occurs the second object wins.
     * Does not do deep merges.
     * @param first Object
     * @param second Object
     * @returns new Object merged first and second
     * @private
     */
    function _merge(first, second) {
        var target = {};

        [first, second].forEach(function (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    target[prop] = obj[prop];
                }
            }
            return target;
        });

        return target;
    }

    function _isShapedLikeParsableError(err) {
        return err.stack || err['opera#sourceloc'];
    }

    return {
        /**
         * Get a backtrace from invocation point.
         * @param opts Options Object
         * @return Array[StackFrame]
         */
        get: function StackTrace$$get(opts) {
            try {
                // Error must be thrown to get stack in IE
                throw new Error();
            } catch (err) {
                if (_isShapedLikeParsableError(err)) {
                    return this.fromError(err, opts);
                } else {
                    return this.generateArtificially(opts);
                }
            }
        },

        /**
         * Given an error object, parse it.
         * @param error Error object
         * @param opts Object for options
         * @return Array[StackFrame]
         */
        fromError: function StackTrace$$fromError(error, opts) {
            opts = _merge(_options, opts);
            return new Promise(function (resolve) {
                var stackframes = ErrorStackParser.parse(error);
                if (typeof opts.filter === 'function') {
                    stackframes = stackframes.filter(opts.filter);
                }
                resolve(Promise.all(stackframes.map(function (sf) {
                    return new Promise(function (resolve) {
                        function resolveOriginal(_) {
                            resolve(sf);
                        }

                        new StackTraceGPS(opts).pinpoint(sf)
                            .then(resolve, resolveOriginal)['catch'](resolveOriginal);
                    });
                })));
            }.bind(this));
        },

        /**
         * Use StackGenerator to generate a backtrace.
         * @param opts Object options
         * @returns Array[StackFrame]
         */
        generateArtificially: function StackTrace$$generateArtificially(opts) {
            opts = _merge(_options, opts);
            var stackFrames = StackGenerator.backtrace(opts);
            if (typeof opts.filter === 'function') {
                stackFrames = stackFrames.filter(opts.filter);
            }
            return Promise.resolve(stackFrames);
        },

        /**
         * Given a function, wrap it such that invocations trigger a callback that
         * is called with a stack trace.
         *
         * @param {Function} fn to be instrumented
         * @param {Function} callback function to call with a stack trace on invocation
         * @param {Function} errback optional function to call with error if unable to get stack trace.
         * @param {Object} thisArg optional context object (e.g. window)
         */
        instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                // Already instrumented, return given Function
                return fn;
            }

            var instrumented = function StackTrace$$instrumented() {
                try {
                    this.get().then(callback, errback)['catch'](errback);
                    fn.apply(thisArg || this, arguments);
                } catch (e) {
                    if (_isShapedLikeParsableError(e)) {
                        this.fromError(e).then(callback, errback)['catch'](errback);
                    }
                    throw e;
                }
            }.bind(this);
            instrumented.__stacktraceOriginalFn = fn;

            return instrumented;
        },

        /**
         * Given a function that has been instrumented,
         * revert the function to it's original (non-instrumented) state.
         *
         * @param fn {Function}
         */
        deinstrument: function StackTrace$$deinstrument(fn) {
            if (typeof fn !== 'function') {
                throw new Error('Cannot de-instrument non-function object');
            } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                return fn.__stacktraceOriginalFn;
            } else {
                // Function not instrumented, return original
                return fn;
            }
        }
    };
}));


(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.Exceptionless = factory();
  }
}(this, function(require, exports, module) {
if (!exports) {
	var exports = {};
}
if (!require) {
	var require = function(){};
}


var ContextData = (function () {
    function ContextData() {
    }
    ContextData.prototype.setException = function (exception) {
        this['@@_Exception'] = exception;
    };
    Object.defineProperty(ContextData.prototype, "hasException", {
        get: function () {
            return !!this['@@_Exception'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.getException = function () {
        if (!this.hasException) {
            return null;
        }
        return this['@@_Exception'];
    };
    ContextData.prototype.markAsUnhandledError = function () {
        this['@@_IsUnhandledError'] = true;
    };
    Object.defineProperty(ContextData.prototype, "isUnhandledError", {
        get: function () {
            return !!this['@@_IsUnhandledError'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.setSubmissionMethod = function (method) {
        if (method && method.length > 0) {
            this['@@_SubmissionMethod'] = method;
        }
    };
    ContextData.prototype.getSubmissionMethod = function () {
        if (!!this['@@_SubmissionMethod']) {
            return null;
        }
        return this['@@_SubmissionMethod'];
    };
    return ContextData;
})();
exports.ContextData = ContextData;
var InMemoryLastReferenceIdManager = (function () {
    function InMemoryLastReferenceIdManager() {
        this._lastReferenceId = null;
    }
    InMemoryLastReferenceIdManager.prototype.getLast = function () {
        return this._lastReferenceId;
    };
    InMemoryLastReferenceIdManager.prototype.clearLast = function () {
        this._lastReferenceId = null;
    };
    InMemoryLastReferenceIdManager.prototype.setLast = function (eventId) {
        this._lastReferenceId = eventId;
    };
    return InMemoryLastReferenceIdManager;
})();
exports.InMemoryLastReferenceIdManager = InMemoryLastReferenceIdManager;
var ConsoleLog = (function () {
    function ConsoleLog() {
    }
    ConsoleLog.prototype.info = function (message) {
        if (console && console.info) {
            console.info("[INFO] Exceptionless:" + message);
        }
    };
    ConsoleLog.prototype.warn = function (message) {
        if (console && console.warn) {
            console.warn("[Warn] Exceptionless:" + message);
        }
    };
    ConsoleLog.prototype.error = function (message) {
        if (console && console.error) {
            console.error("[Error] Exceptionless:" + message);
        }
    };
    return ConsoleLog;
})();
exports.ConsoleLog = ConsoleLog;
var NullLog = (function () {
    function NullLog() {
    }
    NullLog.prototype.info = function (message) { };
    NullLog.prototype.warn = function (message) { };
    NullLog.prototype.error = function (message) { };
    return NullLog;
})();
exports.NullLog = NullLog;
var EventPluginContext = (function () {
    function EventPluginContext(client, event, contextData) {
        this.cancel = false;
        this.client = client;
        this.event = event;
        this.contextData = contextData ? contextData : new ContextData();
    }
    Object.defineProperty(EventPluginContext.prototype, "log", {
        get: function () {
            return this.client.config.log;
        },
        enumerable: true,
        configurable: true
    });
    return EventPluginContext;
})();
exports.EventPluginContext = EventPluginContext;
var EventPluginManager = (function () {
    function EventPluginManager() {
    }
    EventPluginManager.run = function (context) {
        return context.client.config.plugins.reduce(function (promise, plugin) {
            return promise.then(function () {
                return plugin.run(context);
            });
        }, Promise.resolve());
    };
    EventPluginManager.addDefaultPlugins = function (config) {
        config.addPlugin(new ConfigurationDefaultsPlugin());
        config.addPlugin(new ErrorPlugin());
        config.addPlugin(new DuplicateCheckerPlugin());
        config.addPlugin(new ModuleInfoPlugin());
        config.addPlugin(new RequestInfoPlugin());
        config.addPlugin(new EnvironmentInfoPlugin());
        config.addPlugin(new SubmissionMethodPlugin());
    };
    return EventPluginManager;
})();
exports.EventPluginManager = EventPluginManager;
var ReferenceIdPlugin = (function () {
    function ReferenceIdPlugin() {
        this.priority = 20;
        this.name = 'ReferenceIdPlugin';
    }
    ReferenceIdPlugin.prototype.run = function (context) {
        if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
            context.event.reference_id = Utils.guid().replace('-', '').substring(0, 10);
        }
        return Promise.resolve();
    };
    return ReferenceIdPlugin;
})();
exports.ReferenceIdPlugin = ReferenceIdPlugin;
var DefaultEventQueue = (function () {
    function DefaultEventQueue(config) {
        this._processingQueue = false;
        this._config = config;
    }
    DefaultEventQueue.prototype.enqueue = function (event) {
        this.ensureQueueTimer();
        if (this.areQueuedItemsDiscarded()) {
            this._config.log.info('Queue items are currently being discarded. The event will not be queued.');
            return;
        }
        var key = this.queuePath() + "-" + new Date().toJSON() + "-" + Utils.randomNumber();
        this._config.log.info("Enqueuing event: " + key);
        return this._config.storage.save(key, event);
    };
    DefaultEventQueue.prototype.process = function () {
        var _this = this;
        this.ensureQueueTimer();
        if (this._processingQueue) {
            return;
        }
        this._config.log.info('Processing queue...');
        if (!this._config.enabled) {
            this._config.log.info('Configuration is disabled. The queue will not be processed.');
            return;
        }
        this._processingQueue = true;
        try {
            var events = this._config.storage.get(this.queuePath(), this._config.submissionBatchSize);
            if (!events || events.length == 0) {
                this._config.log.info('There are currently no queued events to process.');
                return;
            }
            this._config.log.info("Sending " + events.length + " events to " + this._config.serverUrl + ".");
            this._config.submissionClient.submit(events, this._config)
                .then(function (response) { return _this.processSubmissionResponse(response, events); }, function (response) { return _this.processSubmissionResponse(response, events); })
                .then(function () {
                _this._config.log.info('Finished processing queue.');
                _this._processingQueue = false;
            });
        }
        catch (ex) {
            this._config.log.error("An error occurred while processing the queue: " + ex);
            this.suspendProcessing();
            this._processingQueue = false;
        }
    };
    DefaultEventQueue.prototype.processSubmissionResponse = function (response, events) {
        if (response.success) {
            this._config.log.info("Sent " + events.length + " events to " + this._config.serverUrl + ".");
            return;
        }
        if (response.serviceUnavailable) {
            this._config.log.error('Server returned service unavailable.');
            this.suspendProcessing();
            this.requeueEvents(events);
            return;
        }
        if (response.paymentRequired) {
            this._config.log.info('Too many events have been submitted, please upgrade your plan.');
            this.suspendProcessing(null, true, true);
            return;
        }
        if (response.unableToAuthenticate) {
            this._config.log.info('Unable to authenticate, please check your configuration. The event will not be submitted.');
            this.suspendProcessing(15);
            return;
        }
        if (response.notFound || response.badRequest) {
            this._config.log.error("Error while trying to submit data: " + response.message);
            this.suspendProcessing(60 * 4);
            return;
        }
        if (response.requestEntityTooLarge) {
            if (this._config.submissionBatchSize > 1) {
                this._config.log.error('Event submission discarded for being too large. The event will be retried with a smaller events size.');
                this._config.submissionBatchSize = Math.max(1, Math.round(this._config.submissionBatchSize / 1.5));
                this.requeueEvents(events);
            }
            else {
                this._config.log.error('Event submission discarded for being too large. The event will not be submitted.');
            }
            return;
        }
        if (!response.success) {
            this._config.log.error("An error occurred while submitting events: " + response.message);
            this.suspendProcessing();
            this.requeueEvents(events);
        }
    };
    DefaultEventQueue.prototype.ensureQueueTimer = function () {
        var _this = this;
        if (!this._queueTimer) {
            this._queueTimer = setInterval(function () { return _this.onProcessQueue(); }, 10000);
        }
    };
    DefaultEventQueue.prototype.onProcessQueue = function () {
        if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
            this.process();
        }
    };
    DefaultEventQueue.prototype.suspendProcessing = function (durationInMinutes, discardFutureQueuedItems, clearQueue) {
        if (!durationInMinutes || durationInMinutes <= 0) {
            durationInMinutes = 5;
        }
        this._config.log.info("Suspending processing for " + durationInMinutes + " minutes.");
        this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        if (discardFutureQueuedItems) {
            this._discardQueuedItemsUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        }
        if (!clearQueue) {
            return;
        }
        try {
            this._config.storage.clear(this.queuePath());
        }
        catch (Exception) { }
    };
    DefaultEventQueue.prototype.requeueEvents = function (events) {
        this._config.log.info("Requeuing " + events.length + " events.");
        for (var index = 0; index < events.length; index++) {
            this.enqueue(events[index]);
        }
    };
    DefaultEventQueue.prototype.isQueueProcessingSuspended = function () {
        return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    };
    DefaultEventQueue.prototype.areQueuedItemsDiscarded = function () {
        return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    };
    DefaultEventQueue.prototype.queuePath = function () {
        return !!this._config.apiKey ? "ex-" + this._config.apiKey.slice(0, 8) + "-q" : null;
    };
    return DefaultEventQueue;
})();
exports.DefaultEventQueue = DefaultEventQueue;
var InMemoryStorage = (function () {
    function InMemoryStorage() {
        this._items = {};
    }
    InMemoryStorage.prototype.save = function (path, value) {
        this._items[path] = value;
        return true;
    };
    InMemoryStorage.prototype.get = function (searchPattern, limit) {
        var results = [];
        var regex = new RegExp(searchPattern || '.*');
        for (var key in this._items) {
            if (results.length >= limit) {
                break;
            }
            if (regex.test(key)) {
                results.push(this._items[key]);
                delete this._items[key];
            }
        }
        return results;
    };
    InMemoryStorage.prototype.clear = function (searchPattern) {
        if (!searchPattern) {
            this._items = {};
            return;
        }
        var regex = new RegExp(searchPattern);
        for (var key in this._items) {
            if (regex.test(key)) {
                delete this._items[key];
            }
        }
    };
    InMemoryStorage.prototype.count = function (searchPattern) {
        var regex = new RegExp(searchPattern || '.*');
        var results = [];
        for (var key in this._items) {
            if (regex.test(key)) {
                results.push(key);
            }
        }
        return results.length;
    };
    return InMemoryStorage;
})();
exports.InMemoryStorage = InMemoryStorage;
var Utils = (function () {
    function Utils() {
    }
    Utils.getHashCode = function (source) {
        if (!source || source.length === 0) {
            return null;
        }
        var hash = 0;
        for (var index = 0; index < source.length; index++) {
            var character = source.charCodeAt(index);
            hash = ((hash << 5) - hash) + character;
            hash |= 0;
        }
        return hash.toString();
    };
    Utils.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
    Utils.merge = function (defaultValues, values) {
        var result = {};
        for (var key in defaultValues || {}) {
            if (!!defaultValues[key]) {
                result[key] = defaultValues[key];
            }
        }
        for (var key in values || {}) {
            if (!!values[key]) {
                result[key] = values[key];
            }
        }
        return result;
    };
    Utils.parseVersion = function (source) {
        if (!source) {
            return null;
        }
        var versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
        var matches = versionRegex.exec(source);
        if (matches && matches.length > 0) {
            return matches[0];
        }
        return null;
    };
    Utils.parseQueryString = function (query) {
        if (!query || query.length === 0) {
            return null;
        }
        var pairs = query.split('&');
        if (pairs.length === 0) {
            return null;
        }
        var result = {};
        for (var index = 0; index < pairs.length; index++) {
            var pair = pairs[index].split('=');
            result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return result;
    };
    Utils.randomNumber = function () {
        return Math.floor(Math.random() * 9007199254740992);
    };
    Utils.stringify = function (data) {
        var cache = [];
        return JSON.stringify(data, function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    return;
                }
                cache.push(value);
            }
            return value;
        });
    };
    return Utils;
})();
exports.Utils = Utils;
var Configuration = (function () {
    function Configuration(settings) {
        this._enabled = false;
        this._serverUrl = 'https://collector.exceptionless.io';
        this._plugins = [];
        this.lastReferenceIdManager = new InMemoryLastReferenceIdManager();
        this.defaultTags = [];
        this.defaultData = {};
        function inject(fn) {
            return typeof fn === 'function' ? fn(this) : fn;
        }
        settings = Utils.merge(Configuration.defaults, settings);
        this.apiKey = settings.apiKey;
        this.serverUrl = settings.serverUrl;
        this.environmentInfoCollector = inject(settings.environmentInfoCollector);
        this.errorParser = inject(settings.errorParser);
        this.lastReferenceIdManager = inject(settings.lastReferenceIdManager) || new InMemoryLastReferenceIdManager();
        this.log = inject(settings.log) || new NullLog();
        this.moduleCollector = inject(settings.moduleCollector);
        this.requestInfoCollector = inject(settings.requestInfoCollector);
        this.submissionBatchSize = inject(settings.submissionBatchSize) || 50;
        this.submissionClient = inject(settings.submissionClient);
        this.storage = inject(settings.storage) || new InMemoryStorage();
        this.queue = inject(settings.queue) || new DefaultEventQueue(this);
        EventPluginManager.addDefaultPlugins(this);
    }
    Object.defineProperty(Configuration.prototype, "apiKey", {
        get: function () {
            return this._apiKey;
        },
        set: function (value) {
            this._apiKey = value || null;
            this._enabled = !!value && value.length > 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "serverUrl", {
        get: function () {
            return this._serverUrl;
        },
        set: function (value) {
            if (!!value && value.length > 0) {
                this._serverUrl = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "enabled", {
        get: function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "plugins", {
        get: function () {
            return this._plugins.sort(function (p1, p2) {
                return (p1.priority < p2.priority) ? -1 : (p1.priority > p2.priority) ? 1 : 0;
            });
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addPlugin = function (pluginOrName, priority, pluginAction) {
        var plugin = !!pluginAction ? { name: pluginOrName, priority: priority, run: pluginAction } : pluginOrName;
        if (!plugin || !plugin.run) {
            this.log.error('Unable to add plugin: No run method was found.');
            return;
        }
        if (!plugin.name) {
            plugin.name = Utils.guid();
        }
        if (!plugin.priority) {
            plugin.priority = 0;
        }
        var pluginExists = false;
        for (var index = 0; index < this._plugins.length; index++) {
            if (this._plugins[index].name === plugin.name) {
                pluginExists = true;
                break;
            }
        }
        if (!pluginExists) {
            this._plugins.push(plugin);
        }
    };
    Configuration.prototype.removePlugin = function (pluginOrName) {
        var name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
        if (!name) {
            this.log.error('Unable to remove plugin: No plugin name was specified.');
            return;
        }
        for (var index = 0; index < this._plugins.length; index++) {
            if (this._plugins[index].name === name) {
                this._plugins.splice(index, 1);
                break;
            }
        }
    };
    Configuration.prototype.setVersion = function (version) {
        if (!!version && version.length > 0) {
            this.defaultData['@version'] = version;
        }
    };
    Configuration.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        if (!userInfo.identity && !userInfo.name) {
            delete this.defaultData['@user'];
        }
        else {
            this.defaultData['@user'] = userInfo;
        }
    };
    Configuration.prototype.useReferenceIds = function () {
        this.addPlugin(new ReferenceIdPlugin());
    };
    Configuration.prototype.useDebugLogger = function () {
        this.log = new ConsoleLog();
    };
    Object.defineProperty(Configuration, "defaults", {
        get: function () {
            if (Configuration._defaultSettings === null) {
                Configuration._defaultSettings = {};
            }
            return Configuration._defaultSettings;
        },
        enumerable: true,
        configurable: true
    });
    Configuration._defaultSettings = null;
    return Configuration;
})();
exports.Configuration = Configuration;
var EventBuilder = (function () {
    function EventBuilder(event, client, pluginContextData) {
        this.target = event;
        this.client = client;
        this.pluginContextData = pluginContextData || new ContextData();
    }
    EventBuilder.prototype.setType = function (type) {
        if (!!type && type.length > 0) {
            this.target.type = type;
        }
        return this;
    };
    EventBuilder.prototype.setSource = function (source) {
        if (!!source && source.length > 0) {
            this.target.source = source;
        }
        return this;
    };
    EventBuilder.prototype.setSessionId = function (sessionId) {
        if (!this.isValidIdentifier(sessionId)) {
            throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
        }
        this.target.session_id = sessionId;
        return this;
    };
    EventBuilder.prototype.setReferenceId = function (referenceId) {
        if (!this.isValidIdentifier(referenceId)) {
            throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
        }
        this.target.reference_id = referenceId;
        return this;
    };
    EventBuilder.prototype.setMessage = function (message) {
        if (!!message && message.length > 0) {
            this.target.message = message;
        }
        return this;
    };
    EventBuilder.prototype.setGeo = function (latitude, longitude) {
        if (latitude < -90.0 || latitude > 90.0)
            throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
        if (longitude < -180.0 || longitude > 180.0)
            throw new Error('Must be a valid longitude value between -180.0 and 180.0.');
        this.target.geo = latitude + "," + longitude;
        return this;
    };
    EventBuilder.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        if (!userInfo.identity && !userInfo.name) {
            return this;
        }
        this.setProperty('@user', userInfo);
        return this;
    };
    EventBuilder.prototype.setValue = function (value) {
        if (!!value) {
            this.target.value = value;
        }
        return this;
    };
    EventBuilder.prototype.addTags = function () {
        var tags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tags[_i - 0] = arguments[_i];
        }
        if (!tags || tags.length === 0) {
            return this;
        }
        if (!this.target.tags) {
            this.target.tags = [];
        }
        for (var index = 0; index < tags.length; index++) {
            if (tags[index] && this.target.tags.indexOf(tags[index]) < 0) {
                this.target.tags.push(tags[index]);
            }
        }
        return this;
    };
    EventBuilder.prototype.setProperty = function (name, value) {
        if (!name || (value === undefined || value == null)) {
            return this;
        }
        if (!this.target.data) {
            this.target.data = {};
        }
        this.target.data[name] = value;
        return this;
    };
    EventBuilder.prototype.markAsCritical = function (critical) {
        if (critical) {
            this.addTags('Critical');
        }
        return this;
    };
    EventBuilder.prototype.addRequestInfo = function (request) {
        if (!!request) {
            this.pluginContextData['@request'] = request;
        }
        return this;
    };
    EventBuilder.prototype.submit = function () {
        return this.client.submitEvent(this.target, this.pluginContextData);
    };
    EventBuilder.prototype.isValidIdentifier = function (value) {
        if (!value || !value.length) {
            return true;
        }
        if (value.length < 8 || value.length > 100) {
            return false;
        }
        for (var index = 0; index < value.length; index++) {
            var code = value.charCodeAt(index);
            var isDigit = (code >= 48) && (code <= 57);
            var isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
            var isMinus = code === 45;
            if (!(isDigit || isLetter) && !isMinus) {
                return false;
            }
        }
        return true;
    };
    return EventBuilder;
})();
exports.EventBuilder = EventBuilder;
var ExceptionlessClient = (function () {
    function ExceptionlessClient(settingsOrApiKey, serverUrl) {
        // TODO: populate this in a plugin..
        //var settings = this.getSettingsFromScriptTag() || {};
        if (typeof settingsOrApiKey !== 'object') {
            this.config = new Configuration(settingsOrApiKey);
        }
        else {
            this.config = new Configuration({ apiKey: settingsOrApiKey, serverUrl: serverUrl });
        }
    }
    ExceptionlessClient.prototype.createException = function (exception) {
        var pluginContextData = new ContextData();
        pluginContextData.setException(exception);
        return this.createEvent(pluginContextData).setType('error');
    };
    ExceptionlessClient.prototype.submitException = function (exception) {
        return this.createException(exception).submit();
    };
    ExceptionlessClient.prototype.createUnhandledException = function (exception, submissionMethod) {
        var builder = this.createException(exception);
        builder.pluginContextData.markAsUnhandledError();
        builder.pluginContextData.setSubmissionMethod(submissionMethod);
        return builder;
    };
    ExceptionlessClient.prototype.submitUnhandledException = function (exception, submissionMethod) {
        return this.createUnhandledException(exception, submissionMethod).submit();
    };
    ExceptionlessClient.prototype.createFeatureUsage = function (feature) {
        return this.createEvent().setType('usage').setSource(feature);
    };
    ExceptionlessClient.prototype.submitFeatureUsage = function (feature) {
        return this.createFeatureUsage(feature).submit();
    };
    ExceptionlessClient.prototype.createLog = function (sourceOrMessage, message, level) {
        var builder = this.createEvent().setType('log');
        if (sourceOrMessage && message && level) {
            builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
        }
        else if (sourceOrMessage && message) {
            builder = builder.setSource(sourceOrMessage).setMessage(message);
        }
        else {
            var source = (arguments.callee.caller).name;
            builder = builder.setSource(source).setMessage(sourceOrMessage);
        }
        return builder;
    };
    ExceptionlessClient.prototype.submitLog = function (sourceOrMessage, message, level) {
        return this.createLog(sourceOrMessage, message, level).submit();
    };
    ExceptionlessClient.prototype.createNotFound = function (resource) {
        return this.createEvent().setType('404').setSource(resource);
    };
    ExceptionlessClient.prototype.submitNotFound = function (resource) {
        return this.createNotFound(resource).submit();
    };
    ExceptionlessClient.prototype.createSessionStart = function (sessionId) {
        return this.createEvent().setType('start').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionStart = function (sessionId) {
        return this.createSessionStart(sessionId).submit();
    };
    ExceptionlessClient.prototype.createSessionEnd = function (sessionId) {
        return this.createEvent().setType('end').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionEnd = function (sessionId) {
        return this.createSessionEnd(sessionId).submit();
    };
    ExceptionlessClient.prototype.createEvent = function (pluginContextData) {
        return new EventBuilder({ date: new Date() }, this, pluginContextData);
    };
    ExceptionlessClient.prototype.submitEvent = function (event, pluginContextData) {
        var _this = this;
        if (!event) {
            return Promise.reject(new Error('Unable to submit undefined event.'));
        }
        if (!this.config.enabled) {
            var message = 'Event submission is currently disabled.';
            this.config.log.info(message);
            return Promise.reject(new Error(message));
        }
        var context = new EventPluginContext(this, event, pluginContextData);
        return EventPluginManager.run(context)
            .then(function () {
            if (context.cancel) {
                var message = "Event submission cancelled by plugin\": id=" + event.reference_id + " type=" + event.type;
                _this.config.log.info(message);
                return Promise.reject(new Error(message));
            }
            if (!event.type || event.type.length === 0) {
                event.type = 'log';
            }
            if (!event.date) {
                event.date = new Date();
            }
            _this.config.log.info("Submitting event: type=" + event.type + " " + (!!event.reference_id ? 'refid=' + event.reference_id : ''));
            _this.config.queue.enqueue(event);
            if (event.reference_id && event.reference_id.length > 0) {
                _this.config.log.info("Setting last reference id \"" + event.reference_id + "\"");
                _this.config.lastReferenceIdManager.setLast(event.reference_id);
            }
            return Promise.resolve();
        })
            .catch(function (error) {
            var message = "Event submission cancelled. An error occurred while running the plugins: " + (error && error.message ? error.message : error);
            _this.config.log.error(message);
            return Promise.reject(new Error(message));
        });
    };
    ExceptionlessClient.prototype.getLastReferenceId = function () {
        return this.config.lastReferenceIdManager.getLast();
    };
    Object.defineProperty(ExceptionlessClient, "default", {
        get: function () {
            if (ExceptionlessClient._instance === null) {
                ExceptionlessClient._instance = new ExceptionlessClient(null);
            }
            return ExceptionlessClient._instance;
        },
        enumerable: true,
        configurable: true
    });
    ExceptionlessClient._instance = null;
    return ExceptionlessClient;
})();
exports.ExceptionlessClient = ExceptionlessClient;
var ConfigurationDefaultsPlugin = (function () {
    function ConfigurationDefaultsPlugin() {
        this.priority = 10;
        this.name = 'ConfigurationDefaultsPlugin';
    }
    ConfigurationDefaultsPlugin.prototype.run = function (context) {
        if (!!context.client.config.defaultTags) {
            if (!context.event.tags) {
                context.event.tags = [];
            }
            for (var index = 0; index < context.client.config.defaultTags.length; index++) {
                var tag = context.client.config.defaultTags[index];
                if (tag && context.client.config.defaultTags.indexOf(tag) < 0) {
                    context.event.tags.push(tag);
                }
            }
        }
        if (!!context.client.config.defaultData) {
            if (!context.event.data) {
                context.event.data = {};
            }
            for (var key in context.client.config.defaultData) {
                if (!!context.client.config.defaultData[key]) {
                    context.event.data[key] = context.client.config.defaultData[key];
                }
            }
        }
        return Promise.resolve();
    };
    return ConfigurationDefaultsPlugin;
})();
exports.ConfigurationDefaultsPlugin = ConfigurationDefaultsPlugin;
var ErrorPlugin = (function () {
    function ErrorPlugin() {
        this.priority = 30;
        this.name = 'ErrorPlugin';
    }
    ErrorPlugin.prototype.run = function (context) {
        var exception = context.contextData.getException();
        if (exception == null) {
            return Promise.resolve();
        }
        if (!context.event.data) {
            context.event.data = {};
        }
        context.event.type = 'error';
        if (!!context.event.data['@error']) {
            return Promise.resolve();
        }
        var parser = context.client.config.errorParser;
        if (!parser) {
            context.cancel = true;
            return Promise.reject(new Error('No error parser was defined. This exception will be discarded.'));
        }
        return parser.parse(context, exception);
    };
    return ErrorPlugin;
})();
exports.ErrorPlugin = ErrorPlugin;
var DuplicateCheckerPlugin = (function () {
    function DuplicateCheckerPlugin() {
        this.priority = 50;
        this.name = 'DuplicateCheckerPlugin';
    }
    DuplicateCheckerPlugin.prototype.run = function (context) {
        return Promise.resolve();
    };
    return DuplicateCheckerPlugin;
})();
exports.DuplicateCheckerPlugin = DuplicateCheckerPlugin;
var ModuleInfoPlugin = (function () {
    function ModuleInfoPlugin() {
        this.priority = 40;
        this.name = 'ModuleInfoPlugin';
    }
    ModuleInfoPlugin.prototype.run = function (context) {
        if (!context.event.data ||
            !context.event.data['@error'] ||
            !!context.event.data['@error'].modules ||
            !context.client.config.moduleCollector) {
            return Promise.resolve();
        }
        var modules = context.client.config.moduleCollector.getModules(context);
        if (modules && modules.length > 0) {
            context.event.data['@error'].modules = modules;
        }
        return Promise.resolve();
    };
    return ModuleInfoPlugin;
})();
exports.ModuleInfoPlugin = ModuleInfoPlugin;
var RequestInfoPlugin = (function () {
    function RequestInfoPlugin() {
        this.priority = 60;
        this.name = 'RequestInfoPlugin';
    }
    RequestInfoPlugin.prototype.run = function (context) {
        if (!!context.event.data && !!context.event.data['@request'] || !context.client.config.requestInfoCollector) {
            return Promise.resolve();
        }
        if (!context.event.data) {
            context.event.data = {};
        }
        var ri = context.client.config.requestInfoCollector.getRequestInfo(context);
        if (ri) {
            context.event.data['@request'] = ri;
        }
        return Promise.resolve();
    };
    return RequestInfoPlugin;
})();
exports.RequestInfoPlugin = RequestInfoPlugin;
var EnvironmentInfoPlugin = (function () {
    function EnvironmentInfoPlugin() {
        this.priority = 70;
        this.name = 'EnvironmentInfoPlugin';
    }
    EnvironmentInfoPlugin.prototype.run = function (context) {
        if (!!context.event.data && !!context.event.data['@environment'] || !context.client.config.environmentInfoCollector) {
            return Promise.resolve();
        }
        if (!context.event.data) {
            context.event.data = {};
        }
        var ei = context.client.config.environmentInfoCollector.getEnvironmentInfo(context);
        if (ei) {
            context.event.data['@environment'] = ei;
        }
        return Promise.resolve();
    };
    return EnvironmentInfoPlugin;
})();
exports.EnvironmentInfoPlugin = EnvironmentInfoPlugin;
var SubmissionMethodPlugin = (function () {
    function SubmissionMethodPlugin() {
        this.priority = 100;
        this.name = 'SubmissionMethodPlugin';
    }
    SubmissionMethodPlugin.prototype.run = function (context) {
        var submissionMethod = context.contextData.getSubmissionMethod();
        if (!!submissionMethod) {
            if (!context.event.data) {
                context.event.data = {};
            }
            context.event.data['@submission_method'] = submissionMethod;
        }
        return Promise.resolve();
    };
    return SubmissionMethodPlugin;
})();
exports.SubmissionMethodPlugin = SubmissionMethodPlugin;
var SettingsResponse = (function () {
    function SettingsResponse(success, settings, settingsVersion, exception, message) {
        if (settingsVersion === void 0) { settingsVersion = -1; }
        if (exception === void 0) { exception = null; }
        if (message === void 0) { message = null; }
        this.success = false;
        this.settingsVersion = -1;
        this.success = success;
        this.settings = settings;
        this.settingsVersion = settingsVersion;
        this.exception = exception;
        this.message = message;
    }
    return SettingsResponse;
})();
exports.SettingsResponse = SettingsResponse;
var SubmissionResponse = (function () {
    function SubmissionResponse(statusCode, message) {
        this.success = false;
        this.badRequest = false;
        this.serviceUnavailable = false;
        this.paymentRequired = false;
        this.unableToAuthenticate = false;
        this.notFound = false;
        this.requestEntityTooLarge = false;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode >= 200 && statusCode <= 299;
        this.badRequest = statusCode === 400;
        this.serviceUnavailable = statusCode === 503;
        this.paymentRequired = statusCode === 402;
        this.unableToAuthenticate = statusCode === 401 || statusCode === 403;
        this.notFound = statusCode === 404;
        this.requestEntityTooLarge = statusCode === 413;
    }
    return SubmissionResponse;
})();
exports.SubmissionResponse = SubmissionResponse;
var os = require('os');
var NodeEnvironmentInfoCollector = (function () {
    function NodeEnvironmentInfoCollector() {
    }
    NodeEnvironmentInfoCollector.prototype.getEnvironmentInfo = function (context) {
        if (!os) {
            return null;
        }
        var environmentInfo = {
            processor_count: os.cpus().length,
            total_physical_memory: os.totalmem(),
            available_physical_memory: os.freemem(),
            command_line: process.argv.join(' '),
            process_name: process.title,
            process_id: process.pid + '',
            process_memory_size: process.memoryUsage().heapTotal,
            architecture: os.arch(),
            o_s_name: os.type(),
            o_s_version: os.release(),
            ip_address: this.getIpAddresses(),
            machine_name: os.hostname(),
            runtime_version: process.version,
            data: {
                loadavg: os.loadavg(),
                platform: os.platform(),
                tmpdir: os.tmpdir(),
                uptime: os.uptime()
            }
        };
        if (os.endianness) {
            environmentInfo.data.endianness = os.endianness();
        }
        return environmentInfo;
    };
    NodeEnvironmentInfoCollector.prototype.getIpAddresses = function () {
        var ips = [];
        var interfaces = os.networkInterfaces();
        Object.keys(interfaces).forEach(function (name) {
            interfaces[name].forEach(function (iface) {
                if ('IPv4' === iface.family && !iface.internal) {
                    ips.push(iface.address);
                }
            });
        });
        return ips.join(', ');
    };
    return NodeEnvironmentInfoCollector;
})();
exports.NodeEnvironmentInfoCollector = NodeEnvironmentInfoCollector;
var nodestacktrace = require('stack-trace');
var NodeErrorParser = (function () {
    function NodeErrorParser() {
    }
    NodeErrorParser.prototype.parse = function (context, exception) {
        if (!nodestacktrace) {
            context.cancel = true;
            return Promise.reject(new Error('Unable to load the stack trace library. This exception will be discarded.'));
        }
        var stackFrames = nodestacktrace.parse(exception);
        if (!stackFrames || stackFrames.length === 0) {
            context.cancel = true;
            return Promise.reject(new Error('Unable to parse the exceptions stack trace. This exception will be discarded.'));
        }
        var error = {
            message: exception.message,
            stack_trace: this.getStackFrames(context, stackFrames || [])
        };
        context.event.data['@error'] = error;
        return Promise.resolve();
    };
    NodeErrorParser.prototype.getStackFrames = function (context, stackFrames) {
        var frames = [];
        for (var index = 0; index < stackFrames.length; index++) {
            var frame = stackFrames[index];
            frames.push({
                name: frame.getMethodName() || frame.getFunctionName(),
                file_name: frame.getFileName(),
                line_number: frame.getLineNumber(),
                column: frame.getColumnNumber(),
                declaring_type: frame.getTypeName(),
                data: {
                    is_native: frame.isNative() || (!!frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
                }
            });
        }
        return frames;
    };
    return NodeErrorParser;
})();
exports.NodeErrorParser = NodeErrorParser;
var NodeRequestInfoCollector = (function () {
    function NodeRequestInfoCollector() {
    }
    NodeRequestInfoCollector.prototype.getRequestInfo = function (context) {
        if (!context.contextData['@request']) {
            return null;
        }
        var request = context.contextData['@request'];
        var ri = {
            client_ip_address: request.ip,
            user_agent: request.headers['user-agent'],
            is_secure: request.secure,
            http_method: request.method,
            host: request.hostname || request.host,
            path: request.path,
            post_data: request.body,
            cookies: this.getCookies(request),
            query_string: request.params
        };
        return ri;
    };
    NodeRequestInfoCollector.prototype.getCookies = function (request) {
        if (!request) {
            return null;
        }
        if (request.cookies) {
            return request.cookies;
        }
        var result = {};
        var cookies = (request.headers['cookie'] || '').split('; ');
        for (var index = 0; index < cookies.length; index++) {
            var cookie = cookies[index].split('=');
            result[cookie[0]] = cookie[1];
        }
        return result;
    };
    return NodeRequestInfoCollector;
})();
exports.NodeRequestInfoCollector = NodeRequestInfoCollector;
var https = require('https');
var url = require('url');
var NodeSubmissionClient = (function () {
    function NodeSubmissionClient() {
    }
    NodeSubmissionClient.prototype.submit = function (events, config) {
        var _this = this;
        return this.sendRequest('POST', config.serverUrl, '/api/v2/events', config.apiKey, Utils.stringify(events)).then(function (msg) { return new SubmissionResponse(msg.statusCode, _this.getResponseMessage(msg)); }, function (msg) { return new SubmissionResponse(msg.statusCode || 500, _this.getResponseMessage(msg)); });
    };
    NodeSubmissionClient.prototype.submitDescription = function (referenceId, description, config) {
        var _this = this;
        var path = "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description";
        return this.sendRequest('POST', config.serverUrl, path, config.apiKey, Utils.stringify(description)).then(function (msg) { return new SubmissionResponse(msg.statusCode, _this.getResponseMessage(msg)); }, function (msg) { return new SubmissionResponse(msg.statusCode || 500, _this.getResponseMessage(msg)); });
    };
    NodeSubmissionClient.prototype.getSettings = function (config) {
        var _this = this;
        return this.sendRequest('GET', config.serverUrl, '/api/v2/projects/config', config.apiKey).then(function (msg) {
            if (msg.statusCode !== 200 || !msg.responseText) {
                return new SettingsResponse(false, null, -1, null, "Unable to retrieve configuration settings: " + _this.getResponseMessage(msg));
            }
            var settings;
            try {
                settings = JSON.parse(msg.responseText);
            }
            catch (e) {
                config.log.error("An error occurred while parsing the settings response text: \"" + msg.responseText + "\"");
            }
            if (!settings || !settings.settings || !settings.version) {
                return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
            }
            return new SettingsResponse(true, settings.settings, settings.version);
        }, function (msg) {
            return new SettingsResponse(false, null, -1, null, _this.getResponseMessage(msg));
        });
    };
    NodeSubmissionClient.prototype.getResponseMessage = function (msg) {
        if (!msg || (msg.statusCode >= 200 && msg.statusCode <= 299)) {
            return null;
        }
        if (msg.statusCode === 0) {
            return 'Unable to connect to server.';
        }
        return msg.statusMessage || msg.message;
    };
    NodeSubmissionClient.prototype.sendRequest = function (method, host, path, apiKey, data) {
        return new Promise(function (resolve, reject) {
            var parsedHost = url.parse(host);
            var options = {
                auth: "client:" + apiKey,
                hostname: parsedHost.hostname,
                method: method,
                port: parsedHost.port && parseInt(parsedHost.port),
                path: path
            };
            if (method === 'POST') {
                options.headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                };
            }
            var request = https.request(options, function (response) {
                var body = '';
                response.on('data', function (chunk) { return body += chunk; });
                response.on('end', function () {
                    response.responseText = body;
                    resolve(response);
                });
            });
            request.on('error', function (e) {
                reject(e);
            });
            request.write(data);
            request.end();
        });
    };
    return NodeSubmissionClient;
})();
exports.NodeSubmissionClient = NodeSubmissionClient;
var NodeBootstrapper = (function () {
    function NodeBootstrapper() {
    }
    NodeBootstrapper.prototype.register = function () {
        var _this = this;
        if (!this.isNode()) {
            return;
        }
        Configuration.defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
        Configuration.defaults.errorParser = new NodeErrorParser();
        Configuration.defaults.requestInfoCollector = new NodeRequestInfoCollector();
        Configuration.defaults.submissionClient = new NodeSubmissionClient();
        process.on('uncaughtException', function (error) {
            ExceptionlessClient.default.submitUnhandledException(error, 'uncaughtException');
        });
        process.on('beforeExit', function (code) {
            var client = ExceptionlessClient.default;
            var message = _this.getExitCodeReason(code);
            if (message !== null) {
                client.submitLog('beforeExit', message, 'Error');
            }
            client.config.queue.process();
        });
    };
    NodeBootstrapper.prototype.getExitCodeReason = function (code) {
        if (code === 1) {
            return 'Uncaught Fatal Exception';
        }
        if (code === 3) {
            return 'Internal JavaScript Parse Error';
        }
        if (code === 4) {
            return 'Internal JavaScript Evaluation Failure';
        }
        if (code === 5) {
            return 'Fatal Exception';
        }
        if (code === 6) {
            return 'Non-function Internal Exception Handler ';
        }
        if (code === 7) {
            return 'Internal Exception Handler Run-Time Failure';
        }
        if (code === 8) {
            return 'Uncaught Exception';
        }
        if (code === 9) {
            return 'Invalid Argument';
        }
        if (code === 10) {
            return 'Internal JavaScript Run-Time Failure';
        }
        if (code === 12) {
            return 'Invalid Debug Argument';
        }
        if (code > 128) {
            return 'Signal Exits';
        }
        return null;
    };
    NodeBootstrapper.prototype.isNode = function () {
        return typeof window === 'undefined' && typeof global !== 'undefined' && {}.toString.call(global) === '[object global]';
    };
    return NodeBootstrapper;
})();
exports.NodeBootstrapper = NodeBootstrapper;
var WebErrorParser = (function () {
    function WebErrorParser() {
    }
    WebErrorParser.prototype.parse = function (context, exception) {
        var _this = this;
        return StackTrace.fromError(exception).then(function (stackFrames) { return _this.processError(context, exception, stackFrames); }, function () { return _this.onParseError(context); });
    };
    WebErrorParser.prototype.processError = function (context, exception, stackFrames) {
        var error = {
            message: exception.message,
            stack_trace: this.getStackFrames(context, stackFrames || [])
        };
        context.event.data['@error'] = error;
        return Promise.resolve();
    };
    WebErrorParser.prototype.onParseError = function (context) {
        context.cancel = true;
        return Promise.reject(new Error('Unable to parse the exceptions stack trace. This exception will be discarded.'));
    };
    WebErrorParser.prototype.getStackFrames = function (context, stackFrames) {
        var frames = [];
        for (var index = 0; index < stackFrames.length; index++) {
            frames.push({
                name: stackFrames[index].functionName,
                parameters: stackFrames[index].args,
                file_name: stackFrames[index].fileName,
                line_number: stackFrames[index].lineNumber,
                column: stackFrames[index].columnNumber
            });
        }
        return frames;
    };
    return WebErrorParser;
})();
exports.WebErrorParser = WebErrorParser;
var WebModuleCollector = (function () {
    function WebModuleCollector() {
    }
    WebModuleCollector.prototype.getModules = function (context) {
        if (document && document.getElementsByTagName) {
            return null;
        }
        var modules = [];
        var scripts = document.getElementsByTagName('script');
        if (scripts && scripts.length > 0) {
            for (var index = 0; index < scripts.length; index++) {
                if (scripts[index].src) {
                    modules.push({
                        module_id: index,
                        name: scripts[index].src,
                        version: Utils.parseVersion(scripts[index].src)
                    });
                }
                else if (!!scripts[index].innerHTML) {
                    modules.push({
                        module_id: index,
                        name: 'Script Tag',
                        version: Utils.getHashCode(scripts[index].innerHTML)
                    });
                }
            }
        }
        return modules;
    };
    return WebModuleCollector;
})();
exports.WebModuleCollector = WebModuleCollector;
var WebRequestInfoCollector = (function () {
    function WebRequestInfoCollector() {
    }
    WebRequestInfoCollector.prototype.getRequestInfo = function (context) {
        if (!navigator || !location) {
            return null;
        }
        var requestInfo = {
            user_agent: navigator.userAgent,
            is_secure: location.protocol === 'https:',
            host: location.hostname,
            port: location.port && location.port !== '' ? parseInt(location.port) : 80,
            path: location.pathname,
            cookies: this.getCookies(),
            query_string: Utils.parseQueryString(location.search.substring(1))
        };
        if (document.referrer && document.referrer !== '') {
            requestInfo.referrer = document.referrer;
        }
    };
    WebRequestInfoCollector.prototype.getCookies = function () {
        if (!document.cookie) {
            return null;
        }
        var result = {};
        var cookies = document.cookie.split(', ');
        for (var index = 0; index < cookies.length; index++) {
            var cookie = cookies[index].split('=');
            result[cookie[0]] = cookie[1];
        }
        return result;
    };
    return WebRequestInfoCollector;
})();
exports.WebRequestInfoCollector = WebRequestInfoCollector;
var DefaultSubmissionClient = (function () {
    function DefaultSubmissionClient() {
    }
    DefaultSubmissionClient.prototype.submit = function (events, config) {
        var _this = this;
        var url = config.serverUrl + "/api/v2/events?access_token=" + encodeURIComponent(config.apiKey);
        return this.sendRequest('POST', url, Utils.stringify(events)).then(function (xhr) { return new SubmissionResponse(xhr.status, _this.getResponseMessage(xhr)); }, function (xhr) { return new SubmissionResponse(xhr.status || 500, _this.getResponseMessage(xhr)); });
    };
    DefaultSubmissionClient.prototype.submitDescription = function (referenceId, description, config) {
        var _this = this;
        var url = config.serverUrl + "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description?access_token=" + encodeURIComponent(config.apiKey);
        return this.sendRequest('POST', url, Utils.stringify(description)).then(function (xhr) { return new SubmissionResponse(xhr.status, _this.getResponseMessage(xhr)); }, function (xhr) { return new SubmissionResponse(xhr.status || 500, _this.getResponseMessage(xhr)); });
    };
    DefaultSubmissionClient.prototype.getSettings = function (config) {
        var _this = this;
        var url = config.serverUrl + "/api/v2/projects/config?access_token=" + encodeURIComponent(config.apiKey);
        return this.sendRequest('GET', url).then(function (xhr) {
            if (xhr.status !== 200) {
                return new SettingsResponse(false, null, -1, null, "Unable to retrieve configuration settings: " + _this.getResponseMessage(xhr));
            }
            var settings;
            try {
                settings = JSON.parse(xhr.responseText);
            }
            catch (e) {
                config.log.error("An error occurred while parsing the settings response text: \"" + xhr.responseText + "\"");
            }
            if (!settings || !settings.settings || !settings.version) {
                return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
            }
            return new SettingsResponse(true, settings.settings, settings.version);
        }, function (xhr) {
            return new SettingsResponse(false, null, -1, null, _this.getResponseMessage(xhr));
        });
    };
    DefaultSubmissionClient.prototype.getResponseMessage = function (xhr) {
        if (!xhr || (xhr.status >= 200 && xhr.status <= 299)) {
            return null;
        }
        if (xhr.status === 0) {
            return 'Unable to connect to server.';
        }
        if (xhr.responseBody) {
            return xhr.responseBody.message;
        }
        if (xhr.responseText) {
            try {
                return JSON.parse(xhr.responseText).message;
            }
            catch (e) {
                return xhr.responseText;
            }
        }
        return xhr.statusText;
    };
    DefaultSubmissionClient.prototype.createRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        if ('withCredentials' in xhr) {
            xhr.open(method, url, true);
        }
        else if (typeof XDomainRequest != 'undefined') {
            xhr = new XDomainRequest();
            xhr.open(method, url);
        }
        else {
            xhr = null;
        }
        if (xhr) {
            if (method === 'POST' && xhr.setRequestHeader) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
            xhr.timeout = 10000;
        }
        return xhr;
    };
    DefaultSubmissionClient.prototype.sendRequest = function (method, url, data) {
        var xhr = this.createRequest(method || 'POST', url);
        return new Promise(function (resolve, reject) {
            if (!xhr) {
                return reject({ status: 503, message: 'CORS not supported.' });
            }
            if ('withCredentials' in xhr) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== 4) {
                        return;
                    }
                    if (xhr.status >= 200 && xhr.status <= 299) {
                        resolve(xhr);
                    }
                    else {
                        reject(xhr);
                    }
                };
            }
            xhr.ontimeout = function () { return reject(xhr); };
            xhr.onerror = function () { return reject(xhr); };
            xhr.onload = function () { return resolve(xhr); };
            xhr.send(data);
        });
    };
    return DefaultSubmissionClient;
})();
exports.DefaultSubmissionClient = DefaultSubmissionClient;
var WindowBootstrapper = (function () {
    function WindowBootstrapper() {
    }
    WindowBootstrapper.prototype.register = function () {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        var settings = this.getDefaultsSettingsFromScriptTag();
        if (settings && (settings.apiKey || settings.serverUrl)) {
            Configuration.defaults.apiKey = settings.apiKey;
            Configuration.defaults.serverUrl = settings.serverUrl;
        }
        Configuration.defaults.errorParser = new WebErrorParser();
        Configuration.defaults.moduleCollector = new WebModuleCollector();
        Configuration.defaults.requestInfoCollector = new WebRequestInfoCollector();
        Configuration.defaults.submissionClient = new DefaultSubmissionClient();
        this.handleWindowOnError();
    };
    WindowBootstrapper.prototype.getDefaultsSettingsFromScriptTag = function () {
        if (!document || !document.getElementsByTagName) {
            return null;
        }
        var scripts = document.getElementsByTagName('script');
        for (var index = 0; index < scripts.length; index++) {
            if (scripts[index].src && scripts[index].src.indexOf('/exceptionless') > -1) {
                return Utils.parseQueryString(scripts[index].src.split('?').pop());
            }
        }
        return null;
    };
    WindowBootstrapper.prototype.handleWindowOnError = function () {
        var _oldOnErrorHandler = window.onerror;
        window.onerror = function (message, filename, lineno, colno, error) {
            var client = ExceptionlessClient.default;
            if (error !== null && typeof error === 'object') {
                client.submitUnhandledException(error, 'onerror');
            }
            else {
                var e = {
                    message: message,
                    stack_trace: [{
                            file_name: filename,
                            line_number: lineno,
                            column: colno
                        }]
                };
                client.createUnhandledException(new Error(message), 'onerror').setMessage(message).setProperty('@error', e).submit();
            }
            if (_oldOnErrorHandler) {
                try {
                    return _oldOnErrorHandler(message, filename, lineno, colno, error);
                }
                catch (e) {
                    client.config.log.error("An error occurred while calling previous error handler: " + e.message);
                }
            }
            return false;
        };
    };
    return WindowBootstrapper;
})();
exports.WindowBootstrapper = WindowBootstrapper;
new NodeBootstrapper().register();
new WindowBootstrapper().register();
Error.stackTraceLimit = Infinity;

return exports;

}));


//# sourceMappingURL=exceptionless.js.map