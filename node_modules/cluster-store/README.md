cluster-store
=============

Makes any storage strategy similar to `express/session` useful in both `cluster` and non-`cluster` environments
by wrapping it with `cluster-rpc`.

Also works with **level-session-store** (leveldb), **connect-session-knex** (SQLite3), **session-file-store** (fs),
and any other embedded / in-process store.

Note: Most people would probably prefer to just use Redis rather than wrap a dumb memstore as a service...
but I am not most people.

Install
=======

```
npm install --save cluster-store@2.x
```

v1.x vs v2.x
------------

The [old v1](https://github.com/coolaj86/cluster-store/tree/v1.x)
used `ws` which makes it usable when clustering node processes without using `cluster`.

If you need that functionaliy, use v1 instead of v2.

Usage
=====

In its simplest form, you use this module nearly exactly the way you would
the any other storage module, with the exception that you must wait for
the inter-process initialization to complete.

When not using any of the options the usage is the same for the master and the worker:

```javascript
require('cluster-store').create().then(function (store) {
  // initialization is now complete
  store.set('foo', 'bar');
});
```

### standalone (non-cluster)
--------------

There is no disadvantage to using this module standalone.
The additional overhead of inter-process communication is only added when
a worker is added.

As such, the standalone usage is identical to usage in master process, as seen below.

### master

In the **master** process you will create the real store instance.

If you need to manually specify which worker will be enabled for this funcitonality
you must set `addOnFork` to `false` and call `addWorker()` manually.

```javascript
'use strict';

var cluster = require('cluster');

var cstore = require('cluster-store/master').create({
  name: 'foo-store'       // necessary when using multiple instances
, store: null             // use default in-memory store
, addOnFork: true         // default
});

// if you addOnFork is set to false you can add specific forks manually
//cstore.addWorker(cluster.fork());

cstore.then(function (store) {
  store.set('foo', 'bar');
});
```

Note: `store` can be replaced with any `express/session`-compatible store, such as:

  * `new require('express-session/session/memory')()`
  * `require('level-session-store')(session)`
  * and others

### worker

```javascript
'use strict';

// retrieve the instance
var cstore = require('cluster-store/worker').create({
  name: 'foo-store'
});

cstore.then(function (store) {
  store.get('foo', function (err, result) {
    console.log(result);
  });
});
```

API
===

This is modeled after Express'
[Session Store Implementation](https://github.com/expressjs/session#session-store-implementation)

**Note**: These are only exposed if the underlying store supports them.

CRUD methods
------------

* `store.set(id, data, fn)    => (error)`
* `store.get(id, fn)          => (error, data)`
* `store.touch(id, data, fn)  => (error)`
* `store.destroy(id, fn)      => (error)`

Helpers
-------

* `store.all(fn)              => (error, array)`
* `store.clear(fn)            => (error)`
* `store.length(fn)           => (error, length)`

See <https://github.com/expressjs/session#session-store-implementation>@4.x for full details

Example
=======

```javascript
'use strict';

var cluster = require('cluster');

require('cluster-store').create({
  name: 'foo-store'
}).then(function (store) {
  if (cluster.isMaster) {
    store.set('foo', 'bar');
  }

  store.get('foo', function (err, result) {
    console.log(result);
  });
});

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();
}
```
