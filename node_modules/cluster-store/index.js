'use strict';

var cluster = require('cluster');

if (cluster.isMaster) {
  module.exports = require('./master');
} else {
  module.exports = require('./worker');
}
