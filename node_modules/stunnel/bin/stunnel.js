#!/usr/bin/env node
(function () {
'use strict';

var pkg = require('../package.json');

var program = require('commander');
var url = require('url');
var stunnel = require('../wsclient.js');

var domainsMap = {};
var services = {};

function collectDomains(val, memo) {
  var vals = val.split(/,/g);

  function parseProxy(location) {
    // john.example.com
    // http:john.example.com:3000
    // http://john.example.com:3000
    var parts = location.split(':');
    if (1 === parts.length) {
      // john.example.com -> :john.example.com:0
      parts[1] = parts[0];

      parts[0] = '';
      parts[2] = 0;
    }
    else if (2 === parts.length) {
      throw new Error("invalid arguments for --domains, should use the format <domainname> or <scheme>:<domainname>:<local-port>");
    }
    if (!parts[1]) {
      throw new Error("invalid arguments for --domains, should use the format <domainname> or <scheme>:<domainname>:<local-port>");
    }

    parts[0] = parts[0].toLowerCase();
    parts[1] = parts[1].toLowerCase().replace(/(\/\/)?/, '');
    parts[2] = parseInt(parts[2], 10) || 0;

    memo.push({
      protocol: parts[0]
    , hostname: parts[1]
    , port: parts[2]
    });
  }

  vals.map(function (val) {
    return parseProxy(val);
  });

  return memo;
}
function collectProxies(val, memo) {
  var vals = val.split(/,/g);

  function parseProxy(location) {
    // john.example.com
    // https:3443
    // http:john.example.com:3000
    // http://john.example.com:3000
    var parts = location.split(':');
    var dual = false;
    if (1 === parts.length) {
      // john.example.com -> :john.example.com:0
      parts[1] = parts[0];

      parts[0] = '';
      parts[2] = 0;

      dual = true;
    }
    else if (2 === parts.length) {
      // https:3443 -> https:*:3443
      parts[2] = parts[1];

      parts[1] = '*';
    }

    parts[0] = parts[0].toLowerCase();
    parts[1] = parts[1].toLowerCase().replace(/(\/\/)?/, '') || '*';
    parts[2] = parseInt(parts[2], 10) || 0;
    if (!parts[2]) {
      // TODO grab OS list of standard ports?
      if (!parts[0] || 'http' === parts[0]) {
        parts[2] = 80;
      }
      else if ('https' === parts[0]) {
        parts[2] = 443;
      }
      else {
        throw new Error("port must be specified - ex: tls:*:1337");
      }
    }

    memo.push({
      protocol: parts[0] || 'https'
    , hostname: parts[1]
    , port: parts[2] || 443
    });

    if (dual) {
      memo.push({
        protocol: 'http'
      , hostname: parts[1]
      , port: 80
      });
    }
  }

  vals.map(function (val) {
    return parseProxy(val);
  });

  return memo;
}

program
  .version(pkg.version)
  //.command('jsurl <url>')
  .arguments('<url>')
  .action(function (url) {
    program.url = url;
  })
  .option('-k --insecure', 'Allow TLS connections to stunneld without valid certs (rejectUnauthorized: false)')
  .option('--locals <LIST>', 'comma separated list of <proto>:<port> to which matching incoming http and https should forward (reverse proxy). Ex: https:8443,smtps:8465', collectProxies, [ ]) // --reverse-proxies
  .option('--domains <LIST>', 'comma separated list of domain names to set to the tunnel (to capture a specific protocol to a specific local port use the format https:example.com:1337 instead). Ex: example.com,example.net', collectDomains, [ ])
  .option('--device [HOSTNAME]', 'Tunnel all domains associated with this device instead of specific domainnames. Use with --locals <proto>:<port>. Ex: macbook-pro.local (the output of `hostname`)')
  .option('--stunneld <URL>', 'the domain (or ip address) at which you are running stunneld.js (the proxy)') // --proxy
  .option('--secret <STRING>', 'the same secret used by stunneld (used for JWT authentication)')
  .option('--token <STRING>', 'a pre-generated token for use with stunneld (instead of generating one with --secret)')
  .option('--agree-tos', 'agree to the Daplie Terms of Service (requires user validation)')
  .option('--email <EMAIL>', 'email address (or cloud address) for user validation')
  .option('--oauth3-url <URL>', 'Cloud Authentication to use (default: https://oauth3.org)')
  .parse(process.argv)
  ;

function connectTunnel() {
  program.net = {
    createConnection: function (info, cb) {
      // data is the hello packet / first chunk
      // info = { data, servername, port, host, remoteFamily, remoteAddress, remotePort }
      var net = require('net');
      // socket = { write, push, end, events: [ 'readable', 'data', 'error', 'end' ] };
      var socket = net.createConnection({ port: info.port, host: info.host }, cb);
      return socket;
    }
  };

  Object.keys(program.services).forEach(function (protocol) {
    var subServices = program.services[protocol];
    Object.keys(subServices).forEach(function (hostname) {
      console.info('[local proxy]', protocol + '://' + hostname + ' => ' + subServices[hostname]);
    });
  });
  console.info('');

  var tun = stunnel.connect({
    stunneld: program.stunneld
  , locals: program.locals
  , services: program.services
  , net: program.net
  , insecure: program.insecure
  , token: program.token
  });

  function sigHandler() {
    console.log('SIGINT');

    // We want to handle cleanup properly unless something is broken in our cleanup process
    // that prevents us from exitting, in which case we want the user to be able to send
    // the signal again and exit the way it normally would.
    process.removeListener('SIGINT', sigHandler);
    tun.end();
  }
  process.on('SIGINT', sigHandler);
}

function rawTunnel() {
  program.stunneld = program.stunneld || 'wss://tunnel.daplie.com';

  if (!(program.secret || program.token)) {
    console.error("You must use --secret or --token with --stunneld");
    process.exit(1);
    return;
  }

  var location = url.parse(program.stunneld);
  if (!location.protocol || /\./.test(location.protocol)) {
    program.stunneld = 'wss://' + program.stunneld;
    location = url.parse(program.stunneld);
  }
  var aud = location.hostname + (location.port ? ':' + location.port : '');
  program.stunneld = location.protocol + '//' + aud;

  if (!program.token) {
    var jwt = require('jsonwebtoken');
    var tokenData = {
      domains: Object.keys(domainsMap).filter(Boolean)
    , aud: aud
    };

    program.token = jwt.sign(tokenData, program.secret);
  }

  connectTunnel();
}

function daplieTunnel() {
  //var OAUTH3 = require('oauth3.js');
  var Oauth3Cli = require('oauth3.js/bin/oauth3.js');
  require('oauth3.js/oauth3.tunnel.js');
  return Oauth3Cli.login({
    email: program.email
  , providerUri: program.oauth3Url || 'oauth3.org'
  }).then(function (oauth3) {
    var data = { device: null, domains: [] };
    var domains = Object.keys(domainsMap).filter(Boolean);
    if (program.device) {
      // TODO use device API to select device by id
      data.device = { hostname: program.device };
      if (true === program.device) {
        data.device.hostname = require('os').hostname();
        console.log("Using device hostname '" + data.device.hostname + "'");
      }
    }
    if (domains.length) {
      data.domains = domains;
    }
    return oauth3.api('tunnel.token', { data: data }).then(function (results) {
      var token = new Buffer(results.jwt.split('.')[1], 'base64').toString('utf8');
      console.info('');
      console.info('tunnel token issued:');
      console.info(token);
      console.info('');
      program.token = results.jwt;
      program.stunneld = results.tunnelUrl || ('wss://' + token.aud + '/');

      connectTunnel();
    });
  });
}

program.locals = (program.locals || []).concat(program.domains || []);
program.locals.forEach(function (proxy) {
  // Create a map from which we can derive a list of all domains we want forwarded to us.
  if (proxy.hostname && proxy.hostname !== '*') {
    domainsMap[proxy.hostname] = true;
  }

  // Create a map of which port different protocols should be forwarded to, allowing for specific
  // domains to go to different ports if need be (though that only works for HTTP and HTTPS).
  if (proxy.protocol && proxy.port) {
    services[proxy.protocol] = services[proxy.protocol] || {};

    if (/http/.test(proxy.protocol) && proxy.hostname && proxy.hostname !== '*') {
      services[proxy.protocol][proxy.hostname] = proxy.port;
    }
    else {
      if (services[proxy.protocol]['*'] && services[proxy.protocol]['*'] !== proxy.port) {
        console.error('cannot forward generic', proxy.protocol, 'traffic to multiple ports');
        process.exit(1);
      }
      else {
        services[proxy.protocol]['*'] = proxy.port;
      }
    }
  }
});

if (Object.keys(domainsMap).length === 0) {
  console.error('no domains specified');
  process.exit(1);
  return;
}

// Make sure we have generic ports for HTTP and HTTPS
services.https = services.https || {};
services.https['*'] = services.https['*'] || 8443;

services.http = services.http || {};
services.http['*'] = services.http['*'] || services.https['*'];

program.services = services;

if (!(program.secret || program.token) && !program.stunneld) {
  daplieTunnel();
}
else {
  rawTunnel();
}

}());
