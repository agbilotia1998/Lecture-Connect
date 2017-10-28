#!/usr/bin/env node
'use strict';

// dig -p 53 @ns1.redirect-www.org aj.daplie.me A

var cli = require('cli');
var hri = require('human-readable-ids').hri;
var freedomain = 'daplie.me';

var path = require('path');
var configPath = path.join(require('homedir')(), '.ddnsrc.json');


cli.parse({
  'agree-tos': [ false, "You agree to use Daplie DNS for good, not evil. You will not try to break stuff, hurt people, etc (we will notify you via email when more official legal terms become available on our website).", 'boolean', false ]
  //agree-tos: [ false, 'Agree to the Daplie DNS terms of service. They are very friendly and available at https://daplie.com/dns#terms', 'boolean', false ]
, config: [ false, 'path to config file', 'string', configPath ]
, email: [ false, 'we will keep your email safe and use it contact you when authenticated domain registration is available', 'email' ]
, oauth3: [ false, 'oauth3 ddns server to use for token (defaults to oauth3.org)', 'string' ]
, multi: [ 'm', "Add multiple devices on a single domain", 'boolean' ]
, 'refresh-token': [ false, 'a refresh token to use rather than login code', 'string' ]
, 'refresh-token-path': [ false, 'path to refresh token to use rather than login code', 'string' ]


// actual dns stuff
// name / host / alias
, name: [ false, "the domain name / host / alias to update - either of those you own or a subdomain of '" + freedomain + "'", 'string' ]
, host: [ false, "deprecated alias for --name", 'string' ]
, alias: [ false, "deprecated alias for --name", 'string' ]
, hostname: [ 'h', "deprecated alias for --name", 'string' ]
// type, priority
, type: [ 't', 'The record type i.e. A, AAAA, MX, CNAME, TXT, SRV, ANAME, FWD, etc', 'string' ]
, priority: [ 'p', 'The priority (for MX and other records)', 'string' ]
// value / answer / destination
, value: [ false, 'the value / answer / destination of the dns record - such as ip address, CNAME, text, etc', 'string' ]
, answer: [ 'a', 'depracated alias for --value', 'string' ]
, destination: [ false, 'depracated alias for --value', 'string' ]
// ttl
, ttl: [ false, "The record's cache time-to-live in seconds", 'string' ]
// ish
, device: [ false, "name of device or server to update. Multiple devices may be set to a single domain. Defaults to os.hostname (i.e. rpi.local)", 'string' ]
, random: [ false, "get a randomly assigned hostname such as 'rubber-duck-42." + freedomain + "'", 'boolean' ]
, remove: [ false, "remove a record matching the given name, type, and value" + freedomain + "'", 'boolean' ]


// dnsd stuff
, raw: [ false, 'use this to connnect directly to a custom ddns server', 'boolean' ]
, pathname: [ false, 'The api route to which to POST i.e. /api/ddns', 'string', '/api/com.daplie.dns/ddns' ]
, port: [ false, 'The port (default https/443)', 'number', 443 ]
, services: [ 's', 'The service to use for updates i.e. ns1.example.org,ns2.example.org', 'string' ]
, token: [ false, 'Token', 'string' ]


// debugging and developing
, test: [ false, '[developers] perform extra tests and checks where appropriate (more api calls, slower)', 'boolean' ]
, debug: [ false, '[developers] print extra debug statements', 'boolean' ]
});

cli.main(function (args, cli) {
  var options = {};
  var rc = {};

  // I've heard it *both* ways!
  cli.refreshTokenPath = cli.refreshTokenPath = cli['refresh-token-path'];
  cli.refreshToken = cli.refreshToken = cli['refresh-token'];
  cli.agreeTos = cli.agree = cli['agree-tos'] || cli.agreeTos || cli.agree;
  cli.oauth3 = cli.providerUrl = cli.oauth3 || cli.providerUrl || cli['provider-url'];
  cli.name = cli.host = cli.alias = cli.hostname = cli.name || cli.host || cli.hostname || cli.alias;
  cli.value = cli.answer = cli.destination = cli.value || cli.answer || cli.destination;

  try {
    rc = require(cli.config || configPath);
  } catch(e) {
    if (!cli.config) {
      console.error("Config file '" + configPath + "' could not be parsed.");
      return;
    }
  }
  rc.freedomain = rc.freedomain || freedomain;
  rc.configPath = cli.config || rc.configPath || configPath;

  Object.keys(cli).forEach(function (key) {
    options[key] = cli[key];
  });

  if (!cli.name) {
    cli.name = args[0];
    cli.name = cli.host = cli.alias = cli.hostname = cli.name;
    args.splice(0, 1);
  }

  if (cli.name && cli.random) {
    console.error("You may specify --name 'somedomain.example.com' or --random, but not both");
    return;
  }
  if (!(cli.name || cli.random || rc.hostname || cli.device)) {
    console.error("You must specify either --name 'somedomain.example.com' or --random or be updating a device with --device");
    return;
  }
  if (cli.random) {
    if (rc.hostname) {
      console.error("[error] cannot use --random because you already have a domain in '" + configPath + "'");
      return;
    }
    cli.name = cli.name || hri.random();
  }

  options.name = cli.name || rc.hostname;

  if (!/\./.test(options.name)) {
    options.name += '.' + freedomain.replace(/^\*/, '').replace(/^\./, '');
  }
  options.name = options.host = options.alias = options.hostname = options.name;
  options.value = options.answer = options.destination = cli.value;

  options.agree = options.agreeTos = cli.agreeTos;
  options.email = cli.email || rc.email;
  options.device = cli.device;
  options.refreshToken = cli.refreshToken;
  options.oauth3 = cli.oauth3 || 'oauth3.org';
  options.type = cli.type || 'A';
  if (cli.refreshTokenPath) {
    var fs = require('fs');
    if (!fs.existsSync(cli.refreshTokenPath)) {
      throw new Error("'" + cli.refreshTokenPath + "' does not exist");
    }
    options.refreshToken = fs.readFileSync(cli.refreshTokenPath, 'utf8').trim();
  }

  if (!cli.raw) {
    // !cli.token && !rc.token
    require('../lib/ddns').run(options, cli, rc);
  }
  else {
    require('../lib/raw').set(rc, options, cli);
  }
});
