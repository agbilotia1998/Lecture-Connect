'use strict';

var cluster = require('cluster');
var cstore;
//global.Promise = require('bluebird');


if (cluster.isMaster) {


  cstore = require('./master').create({
    name: 'foo-level'
  });
  cstore.then(function (db) {
    db.set('foo', 'bar');
  });

  cluster.fork();
  cluster.fork();


}
else {


  cstore = require('./worker').create({
    name: 'foo-level'
  });


}


cstore.then(function (db) {
  setTimeout(function () {
    db.get('foo', function (err, result) {
      console.log(cluster.isMaster && '0' || cluster.worker.id.toString(), "db.get('foo')", result);

      if (!cluster.isMaster) {
        process.exit(0);
      }
    });
  }, 250);
});

process.on('unhandledRejection', function (err) {
  console.log('unhandledRejection', err);
});
