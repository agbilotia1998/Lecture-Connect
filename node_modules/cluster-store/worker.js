'use strict';

module.exports.create = function (opts) {
  return require('cluster-rpc/worker').create({
    name: 'memstore.' + (opts.name || '')
  , worker: opts.worker
  });
};
