'use strict';

module.exports.set = function (rc, options, cli) {
  var fs = require('fs');
  var ddns = require('../lib/ddns-client.js');
  var answers;
  var freedomain = rc.freedomain;
  var configPath = rc.configPath;

  options.services = (cli.services||cli.service||'').split(',').filter(function (s) { return s; });
  if (!options.services.length) {
    options.services = rc.services || [];
  }

  if (!options.services.length) {
    options.services = [ 'ns1.redirect-www.org', 'ns2.redirect-www.org' ];
  }

  // XXX get le certs for ns1, ns2
  if ('ns1.redirect-www.org,ns2.redirect-www.org' === options.services.join(',')) {
    options.cacert = false;
  }

  options.token = options.token || cli.token || rc.token;
  if (!cli.token) {
    if (!rc.token) {
      throw new Error("SANITY FAIL: called raw.set witohut cli.token or rc.token");
    }
    else if (!(new RegExp(rc.hostname)).test(options.hostname)) {
      console.error("The token at '" + configPath + "' does not match '" + rc.hostname + "'");
      return;
    }
  }
  if ((new RegExp('\\w\\.' + freedomain + '$')).test(options.hostname)) {
    if (!options.email) {
      console.error("[Error] You must specify a email address with --email");
      console.error("");
      console.error("our registration system is not yet complete, but we will email you when it is");
      console.error("so that you can claim your '" + freedomain + "' domain");
      return;
    }
    if (!options.agree) {
      console.error("[Error] To register a domain with us you must agree to our terms of use");
      console.error("");
      console.error("add --agree to accept the Daplie DNS terms of use");
      console.error("");
      console.error("Currently our agreement is simply: 'You will use Daplie DNS for good, not evil'.");
      console.error("We will email you when our actual legal agreement becomes available.");
      return;
    }
  }

  // TODO read services and token from config
  // if (!fs.existsSync('~/.node-ddns')) {
  //   console.error('You must login first: ddns login');
  //   // TODO prompt email, password, one-time
  //   // TODO npm install --save qrcode-terminal
  //   return;
  // }

  if (options.token) {
    try {
      options.token = require('fs').readFileSync(options.token, 'ascii').trim();
    } catch(e) {
      if (options.token.length < 384) {
        console.error("Could not read token file '" + options.token + "'");
        return;
      }
    }
  }

  answers = [
    { "name": options.hostname
    , "value": options.answer
    , "type": options.type
    , "priority": options.priority
    , "token": options.token // device should go here?
    , "ttl": options.ttl || undefined
    , "device": options.device || undefined
    , "email": options.email || undefined
    }
  ];

  return ddns.update({
    servers: options.services
  , port: options.port
  , cacert: options.cacert
  , pathname: options.pathname || '/api/com.daplie.dns/ddns' // TODO dns -> ddns ?
  , token: options.token
  , ddns: answers
  , mapResults: true
  }).then(function (data) {
    var line;
    var servernames = Object.keys(data);

    if (!servernames.every(function (servername) {
      var records = data[servername].results;
      return Array.isArray(records) && records.every(function (r) {
        return r && r.value;
      });
    })) {
      console.error('[Error DDNS]:');
      console.error(JSON.stringify(data, null, '  '));
      return;
    }

    /*
    if (!Array.isArray(data)) {
      console.error('[Error] unexpected data');
      console.error(JSON.stringify(data, null, '  '));
      return;
    }
    */

    line = 'Hostname: ' + options.hostname;
    console.log('');
    console.log(line.replace(/./g, '-'));
    console.log(line);
    // TODO fix weird double array bug
    console.log('IP Address: ' + data[servernames[0]].results[0].value);
    console.log(line.replace(/./g, '-'));
    console.log('\n');
    console.log('Test with');
    console.log('dig ' + options.hostname + ' ' + (options.type || ''));
    console.log('\n');
    try {
      if (!(rc.hostname || rc.services || rc.token || rc.email)) {
        rc.hostname = options.hostname;
        rc.services = options.services;
        rc.token = options.token;
        rc.email = options.email;

        fs.writeFileSync(configPath, JSON.stringify(rc, null, '  '), 'ascii');
        console.log("config saved to '" + configPath + "'");
      }
    } catch(e) {
      // ignore
      console.warn("Could not write configuration file '" + configPath + "'");
    }
  }, function (err) {
    console.error('[Error] ddns-cli:');
    console.error(err.stack);
    console.error(err.data);
  });
};
