'use strict';

var cluster = require('cluster');
var cstore;

require('./').create({
  name: 'foo-store'
}).then(function (store) {
  if (cluster.isMaster) {
    cluster.fork();
    cluster.fork();

    store.set('foo', 'bar');
  }

  store.get('foo', function (err, result) {
    console.log(cluster.isMaster && '0' || cluster.worker.id.toString(), 'foo', result);
    if (!cluster.isMaster) {
      process.exit(0);
    }
  });
});

process.on('unhandledRejection', function (err) {
  console.log('unhandledRejection', err);
});
