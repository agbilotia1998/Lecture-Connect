'use strict';

module.exports.create = function (opts) {
  opts = opts || {};

  var db = require('./memstore').create();

  return require('cluster-rpc/master').create({
    instance: opts.store || db
  , methods: [
      'set', 'get', 'touch', 'destroy'
    , 'all', 'length', 'clear'
    , 'on', 'off', 'removeEventListener', 'addEventListener'
    ]
  , name: 'memstore.' + (opts.name || '')
  , master: opts.master
  , addOnFork: opts.addOnFork
  });
};
