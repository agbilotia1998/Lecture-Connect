'use strict';

module.exports.create = function (opts) {
  var Oauth3 = require('oauth3-cli');
  var Tunnel = require('daplie-tunnel').create({
    Oauth3: Oauth3
  , PromiseA: opts.PromiseA
  , CLI: {
      init: function (rs, ws/*, state, options*/) {
        // noop
        return ws;
      }
    }
  }).Tunnel;
  var stunnel = require('stunnel');
  /*
  var Dup = {
    write: function (chunk, encoding, cb) {
      this.__my_socket.push(chunk, encoding);
      cb();
    }
  , read: function (size) {
      var x = this.__my_socket.read(size);
      if (x) { this.push(x); }
    }
  , setTimeout: function () {
      console.log('TODO implement setTimeout on Duplex');
    }
  };

  var httpServer = require('http').createServer(function (req, res) {
    console.log('req.socket.encrypted', req.socket.encrypted);
    res.end('Hello, tunneled World!');
  });

  var tlsServer = require('tls').createServer(opts.httpsOptions, function (tlsSocket) {
    console.log('tls connection');
    // things get a little messed up here
    httpServer.emit('connection', tlsSocket);

    // try again
    //servers.server.emit('connection', tlsSocket);
  });
  */

  return Tunnel.token({
    refreshToken: opts.refreshToken
  , email: opts.email
  , domains: opts.sites.map(function (site) {
      return site.name;
    })
  , device: { hostname: opts.devicename || opts.device }
  }).then(function (result) {
    // { jwt, tunnelUrl }
    return stunnel.connect({
      token: result.jwt
    , stunneld: result.tunnelUrl
    , insecure: opts.insecure

      // The newer version of stunnel shouldn't use locals, we provide it anyway just in
      // case we are somehow using an older version.
    , locals: [
        {protocol: 'https', hostname: '*', port: opts.port}
      , {protocol: 'http',  hostname: '*', port: opts.insecurePort || opts.port }
      ]
    , services: {
        https: { '*': opts.port }
      , http:  { '*': opts.insecurePort || opts.port }
      }
      // a simple passthru is proving to not be so simple
    , net: require('net') /*
      {
        createConnection: function (info, cb) {
          // data is the hello packet / first chunk
          // info = { data, servername, port, host, remoteAddress: { family, address, port } }

          var myDuplex = new (require('stream').Duplex)();
          var myDuplex2 = new (require('stream').Duplex)();
          // duplex = { write, push, end, events: [ 'readable', 'data', 'error', 'end' ] };

          myDuplex2.__my_socket = myDuplex;
          myDuplex.__my_socket = myDuplex2;

          myDuplex2._write = Dup.write;
          myDuplex2._read = Dup.read;

          myDuplex._write = Dup.write;
          myDuplex._read = Dup.read;

          myDuplex.remoteFamily = info.remoteFamily;
          myDuplex.remoteAddress = info.remoteAddress;
          myDuplex.remotePort = info.remotePort;

          // socket.local{Family,Address,Port}
          myDuplex.localFamily = 'IPv4';
          myDuplex.localAddress = '127.0.01';
          myDuplex.localPort = info.port;

          myDuplex.setTimeout = Dup.setTimeout;

          // this doesn't seem to work so well
          //servers.server.emit('connection', myDuplex);

          // try a little more manual wrapping / unwrapping
          var firstByte = info.data[0];
          if (firstByte < 32 || firstByte >= 127) {
            tlsServer.emit('connection', myDuplex);
          }
          else {
            httpServer.emit('connection', myDuplex);
          }

          if (cb) {
            process.nextTick(cb);
          }

          return myDuplex2;
        }
      }
      //*/
    });
  });
};
