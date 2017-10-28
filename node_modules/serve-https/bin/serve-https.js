#!/usr/bin/env node
'use strict';

//var PromiseA = global.Promise;
var PromiseA = require('bluebird');
var tls = require('tls');
var https = require('httpolyglot');
var http = require('http');
var proxyaddr = require('proxy-addr');
var fs = require('fs');
var path = require('path');
var DDNS = require('ddns-cli');
var enableDestroy = require('server-destroy');
var httpPort = 80;
var httpsPort = 443;
var lrPort = 35729;
var portFallback = 8443;
var insecurePortFallback = 4080;

function showError(err, port) {
  if ('EACCES' === err.code) {
    console.error(err);
    console.warn("You do not have permission to use '" + port + "'.");
    console.warn("You can probably fix that by running as Administrator or root.");
  }
  else if ('EADDRINUSE' === err.code) {
    console.warn("Another server is already running on '" + port + "'.");
    console.warn("You can probably fix that by rebooting your computer (or stopping it if you know what it is).");
  }
}

function createInsecureServer(port, _delete_me_, opts, onRequest) {
  return new PromiseA(function (realResolve) {
    var server = http.createServer();
    enableDestroy(server);

    function resolve() {
      realResolve(server);
    }

    server.on('error', function (err) {
      if (opts.errorInsecurePort || opts.manualInsecurePort) {
        showError(err, port);
        process.exit(1);
        return;
      }

      opts.errorInsecurePort = err.toString();

      return createInsecureServer(insecurePortFallback, null, opts, onRequest).then(realResolve);
    });

    server.on('request', onRequest);

    server.listen(port, function () {
      opts.insecurePort = port;
      resolve();
    });
  });
}

function createServerHelper(port, content, opts, lex) {
  var insecureServer;

  return new PromiseA(function (realResolve) {
    function resolve() {
      realResolve({
        plainServer: insecureServer
      , server: server
      });
    }

    function proxySaysSecure(req) {
      if (!proxyaddr(req, opts.isProxyTrusted)) {
        return false;
      }

      return 'https' === req.headers['x-forwarded-proto']
				|| -1 !== (req.headers.forwarded || '').toLowerCase().indexOf(' proto=https')
				|| 'on' === req.headers['x-forwarded-ssl']
      	//|| 'https' === req.headers['x-forwarded-protocol']
				//|| 'on' === req.headers['front-end-https']
        ;
      /*
				// Standard
				Forwarded: by=<identifier>; for=<identifier>; host=<host>; proto=<http|https>

				// Microsoft
				Front-End-Https: on

				// Misc
				X-Forwarded-Protocol: https
				X-Forwarded-Ssl: on
				X-Url-Scheme: https
      */
    }

    function onRequest(req, res) {
      console.log('onRequest [' + req.method + '] ' + req.url);
      if (!req.socket.encrypted && !proxySaysSecure(req) && !/\/\.well-known\/acme-challenge\//.test(req.url)) {
        opts.redirectApp(req, res);
        return;
      }

      lex.middleware(function (req, res) {
        if ('function' === typeof opts._app) {
          opts._app(req, res);
          return;
        }

        res.end('app not loaded');
      })(req, res);
    }

    function onListen() {
      opts.port = port;
      opts.redirectOptions.port = port;

      if (opts.livereload) {
        opts.lrPort = opts.lrPort || lrPort;
        var livereload = require('livereload');
        var server2 = livereload.createServer({
          https: opts.httpsOptions
        , port: opts.lrPort
        , exclusions: [ 'node_modules' ]
        });

        console.info("[livereload] watching " + opts.pubdir);
        console.warn("WARNING: If CPU usage spikes to 100% it's because too many files are being watched");
        // TODO create map of directories to watch from opts.sites and iterate over it
        server2.watch(opts.pubdir);
        server.on('close', function () {
          server2.close();
        });
      }

      // if we haven't disabled insecure port, and the insecure and secure ports are different
      if ('false' !== opts.insecurePort && opts.port !== opts.insecurePort) {
        // Only fire up the insecure server if the user specified neither or both ports
        if (opts.manualInsecurePort || !opts.manualPort) {
          return createInsecureServer(opts.insecurePort, null, opts, onRequest).then(function (_server) {
            insecureServer = _server;
            resolve();
          });
        }
      }

      opts.insecurePort = opts.port;
      resolve();
      return;
    }

    function onError(err) {
      if (opts.errorPort || opts.manualPort) {
        showError(err, port);
        process.exit(1);
        return;
      }

      opts.errorPort = err.toString();

      return createServerHelper(portFallback, content, opts, lex).then(realResolve);
    }

    var server = https.createServer(opts.httpsOptions);
    enableDestroy(server);

    server.on('error', onError);
    server.listen(port, onListen);
    server.on('request', onRequest);
  });
}

function createServer(port, _delete_me_, content, opts) {
  function approveDomains(params, certs, cb) {
    // This is where you check your database and associated
    // email addresses with domains and agreements and such
    var domains = params.domains;
    //var p;
    console.log('approveDomains');
    console.log(domains);


    // The domains being approved for the first time are listed in opts.domains
    // Certs being renewed are listed in certs.altnames
    if (certs) {
      params.domains = certs.altnames;
      //p = PromiseA.resolve();
    }
    else {
      //params.email = opts.email;
      if (!opts.agreeTos) {
        console.error("You have not previously registered '" + domains + "' so you must specify --agree-tos to agree to both the Let's Encrypt and Daplie DNS terms of service.");
        process.exit(1);
        return;
      }
      params.agreeTos = opts.agreeTos;
    }

    // ddns.token(params.email, domains[0])
    params.email = opts.email;
    params.refreshToken = opts.refreshToken;
    //params.challengeType = 'http-01';
    //params.challengeType = 'dns-01';
    params.cli = opts.argv;

    cb(null, { options: params, certs: certs });
  }

  var app = require('../lib/app.js');

  var directive = {
    content: content
  , livereload: opts.livereload
  , sites: opts.sites
  , expressApp: opts.expressApp
  };

  // returns an instance of node-letsencrypt with additional helper methods
  var webrootPath = require('os').tmpdir();
  var leChallengeFs = require('le-challenge-fs').create({ webrootPath: webrootPath });
  //var leChallengeSni = require('le-challenge-sni').create({ webrootPath: webrootPath });
  var leChallengeDdns = require('le-challenge-ddns').create({ ttl: 1 });
  var oldConfigDir = path.join((opts.homedir || '~'), 'letsencrypt', 'etc');
  var defaultConfigDir = path.join((opts.homedir || '~'), 'acme', 'etc');
  if (fs.existsSync(oldConfigDir)) {
    defaultConfigDir = oldConfigDir;
  }
  opts.configDir = opts.configDir || defaultConfigDir;
  var lex = require('greenlock-express').create({
    // set to https://acme-v01.api.letsencrypt.org/directory in production
    server: opts.test ? 'staging' : 'https://acme-v01.api.letsencrypt.org/directory'

  // If you wish to replace the default plugins, you may do so here
  //
  , challenges: {
      'http-01': leChallengeFs
    , 'tls-sni-01': leChallengeFs // leChallengeSni
    , 'dns-01': leChallengeDdns
    }
  , challengeType: opts.challengeType || (opts.tunnel ? 'http-01' : 'dns-01')
  //, challengeType: 'http-01'
  //, challengeType: 'dns-01'
  , store: require('le-store-certbot').create({
      webrootPath: webrootPath
    , configDir: opts.configDir
    , homedir: opts.homedir
    })
  , webrootPath: webrootPath

  // You probably wouldn't need to replace the default sni handler
  // See https://git.daplie.com/Daplie/le-sni-auto if you think you do
  //, sni: require('le-sni-auto').create({})

  , approveDomains: approveDomains
  });

  var secureContexts = {
    'localhost.daplie.me': null
  };
  opts.httpsOptions.SNICallback = function (sni, cb ) {
    var tlsOptions;
    console.log('[https] sni', sni);

    // Static Certs
    if (/.*localhost.*\.daplie\.me/.test(sni.toLowerCase())) {
      // TODO implement
      if (!secureContexts[sni]) {
        tlsOptions = require('localhost.daplie.me-certificates').mergeTlsOptions(sni, {});
      }
      if (tlsOptions) {
        secureContexts[sni] = tls.createSecureContext(tlsOptions);
      }
      cb(null, secureContexts[sni]);
      return;
    }

    // Dynamic Certs
    lex.httpsOptions.SNICallback(sni, cb);
  };

  if ('function' === typeof app) {
    app = app(directive);
  } else if ('function' === typeof app.create) {
    app = app.create(directive);
  }

  opts._app = app;
  return createServerHelper(port, content, opts, lex);
}

module.exports.createServer = createServer;

function run() {
  var defaultServername = 'localhost.daplie.me';
  var minimist = require('minimist');
  var argv = minimist(process.argv.slice(2));
  var port = parseInt(argv.p || argv.port || argv._[0], 10) || httpsPort;
  var defaultWebRoot = path.resolve(argv['default-web-root'] || argv.d || argv._[1] || process.cwd());
  var content = argv.c;
  var letsencryptHost = argv['letsencrypt-certs'];

  if (argv.V || argv.version || argv.v) {
    if (argv.v) {
      console.warn("flag -v is reserved for future use. Use -V or --version for version information.");
    }
    console.info('v' + require('../package.json').version);
    return;
  }
  if (argv.servername && argv.sites) {
    throw new Error('specify only --sites, not --servername');
  }
  argv.sites = argv.sites || argv.servername;

  // letsencrypt
  var httpsOptions = require('localhost.daplie.me-certificates').merge({});
  var secureContext;

  var opts = {
    agreeTos: argv.agreeTos || argv['agree-tos']
  , challengeType: argv['challenge-type']
  , debug: argv.debug
  , test: argv.debug || argv.test || argv['dry-run'] || argv.dryrun
  , device: argv.device
  , provider: (argv.provider && 'false' !== argv.provider) ? argv.provider : 'oauth3.org'
  , email: argv.email
  , httpsOptions: {
      key: httpsOptions.key
    , cert: httpsOptions.cert
    //, ca: httpsOptions.ca
    }
  , homedir: argv.homedir
  , trustProxy: (argv['trust-proxy'] || argv['trust-proxies'] || 'loopback,linklocal,uniquelocal').split(/,/g)
  , argv: argv
  };
  var peerCa;
  var p;

  opts.PromiseA = PromiseA;
  opts.httpsOptions.SNICallback = function (sni, cb) {
    if (!secureContext) {
      secureContext = tls.createSecureContext(opts.httpsOptions);
    }
    cb(null, secureContext);
    return;
  };

  if (letsencryptHost) {
    // TODO remove in v3.x (aka goldilocks)
    argv.key = argv.key || '/etc/letsencrypt/live/' + letsencryptHost + '/privkey.pem';
    argv.cert = argv.cert || '/etc/letsencrypt/live/' + letsencryptHost + '/fullchain.pem';
    argv.root = argv.root || argv.chain || '';
    argv.sites = argv.sites || letsencryptHost;
    argv['serve-root'] = argv['serve-root'] || argv['serve-chain'];
    // argv[express-app]
  }

  if (argv['serve-root'] && !argv.root) {
    console.error("You must specify bath --root to use --serve-root");
    return;
  }

  if (argv.key || argv.cert || argv.root) {
    if (!argv.key || !argv.cert) {
      console.error("You must specify bath --key and --cert, and optionally --root (required with serve-root)");
      return;
    }

    if (!Array.isArray(argv.root)) {
      argv.root = [argv.root];
    }

    opts.httpsOptions.key = fs.readFileSync(argv.key);
    opts.httpsOptions.cert = fs.readFileSync(argv.cert);

    // turn multiple-cert pemfile into array of cert strings
    peerCa = argv.root.reduce(function (roots, fullpath) {
      if (!fs.existsSync(fullpath)) {
        return roots;
      }

      return roots.concat(fs.readFileSync(fullpath, 'ascii')
      .split('-----END CERTIFICATE-----')
      .filter(function (ca) {
        return ca.trim();
      }).map(function (ca) {
        return (ca + '-----END CERTIFICATE-----').trim();
      }));
    }, []);

    // TODO * `--verify /path/to/root.pem` require peers to present certificates from said authority
    if (argv.verify) {
      opts.httpsOptions.ca = peerCa;
      opts.httpsOptions.requestCert = true;
      opts.httpsOptions.rejectUnauthorized = true;
    }

    if (argv['serve-root']) {
      content = peerCa.join('\r\n');
    }
  }


  opts.sites = [ { name: defaultServername , path: '.' } ];
  if (argv.sites) {
    opts._externalHost = false;
    opts.sites = argv.sites.split(',').map(function (name) {
      var nameparts = name.split('|');
      var servername = nameparts.shift();
      opts._externalHost = opts._externalHost || !/(^|\.)localhost\./.test(servername);
      // TODO allow reverse proxy
      return {
        name: servername
        // there should always be a path
      , paths: nameparts.length && nameparts || [
          defaultWebRoot.replace(/(:hostname|:servername)/g, servername)
        ]
        // TODO check for existing custom path before issuing with greenlock
      , _hasCustomPath: !!nameparts.length
      };
    });
  }
  // TODO use arrays in all things
  opts._old_server_name = opts.sites[0].name;
  opts.pubdir = defaultWebRoot.replace(/(:hostname|:servername).*/, '');

  if (argv.p || argv.port || argv._[0]) {
    opts.manualPort = true;
  }
  if (argv.t || argv.tunnel) {
    opts.tunnel = true;
  }
  if (argv.i || argv['insecure-port']) {
    opts.manualInsecurePort = true;
  }
  opts.insecurePort = parseInt(argv.i || argv['insecure-port'], 10)
    || argv.i || argv['insecure-port']
    || httpPort
    ;
  opts.livereload = argv.livereload;

  if (argv['express-app']) {
    opts.expressApp = require(path.resolve(process.cwd(), argv['express-app']));
  }

  if (opts.email || opts._externalHost) {
    if (!opts.agreeTos) {
      console.warn("You may need to specify --agree-tos to agree to both the Let's Encrypt and Daplie DNS terms of service.");
    }
    if (!opts.email) {
      // TODO store email in .ddnsrc.json
      console.warn("You may need to specify --email to register with both the Let's Encrypt and Daplie DNS.");
    }
    p = DDNS.refreshToken({
      email: opts.email
    , providerUrl: opts.provider
    , silent: true
    , homedir: opts.homedir
    }, {
      debug: false
    , email: opts.argv.email
    }).then(function (refreshToken) {
      opts.refreshToken = refreshToken;
    });
  }
  else {
    p = PromiseA.resolve();
  }

  return p.then(function () {

  // can be changed to tunnel external port
  opts.redirectOptions = { port: opts.port };
  opts.isProxyTrusted = proxyaddr.compile(opts.trustProxy || []);
  opts.redirectApp = require('redirect-https')(opts.redirectOptions);

  return createServer(port, null, content, opts).then(function (servers) {
    var httpsUrl;
    var httpUrl;
    var promise;

    // TODO show all sites
    console.info('');
    console.info('Serving ' + opts.pubdir + ' at ');
    console.info('');

    // Port
    httpsUrl = 'https://' + opts._old_server_name;
    if (httpsPort !== opts.port) {
      httpsUrl += ':' + opts.port;
    }
    console.info('\t' + httpsUrl);

    // Insecure Port
    httpUrl = 'http://' + opts._old_server_name;
    if (httpPort !== opts.insecurePort) {
      httpUrl += ':' + opts.insecurePort;
    }
    console.info('\t' + httpUrl + ' (redirecting to https)');
    console.info('');

    if (!(argv.sites && (defaultServername !== argv.sites) && !(argv.key && argv.cert))) {
      // TODO what is this condition actually intending to test again?
      // (I think it can be replaced with if (!opts._externalHost) { ... }

      // ifaces
      opts.ifaces = require('../lib/local-ip.js').find();
      promise = PromiseA.resolve();
    } else {
      console.info("Attempting to resolve external connection for '" + opts._old_server_name + "'");
      try {
        promise = require('../lib/match-ips.js').match(opts._old_server_name, opts);
      } catch(e) {
        console.warn("Upgrade to version 2.x to use automatic certificate issuance for '" + opts._old_server_name + "'");
        promise = PromiseA.resolve();
      }
    }

    return promise.then(function (matchingIps) {
      if (matchingIps) {
        if (!matchingIps.length) {
          console.info("Neither the attached nor external interfaces match '" + opts._old_server_name + "'");
        }
      }
      opts.matchingIps = matchingIps || [];

      if (opts.matchingIps.length) {
        console.info('');
        console.info('External IPs:');
        console.info('');
        opts.matchingIps.forEach(function (ip) {
          if ('IPv4' === ip.family) {
            httpsUrl = 'https://' + ip.address;
            if (httpsPort !== opts.port) {
              httpsUrl += ':' + opts.port;
            }
            console.info('\t' + httpsUrl);
          }
          else {
            httpsUrl = 'https://[' + ip.address + ']';
            if (httpsPort !== opts.port) {
              httpsUrl += ':' + opts.port;
            }
            console.info('\t' + httpsUrl);
          }
        });
      }
      else if (!opts.tunnel) {
        console.info("External IP address does not match local IP address.");
        console.info("Use --tunnel to allow the people of the Internet to access your server.");
        console.info("(or, if you know that you're using something like caddy or nginx to reverse proxy: keep calm and proxy on)");
      }

      if (opts.tunnel) {
        require('../lib/tunnel.js').create(opts).then(function (tunnel) {
          servers.tunnel = tunnel;
        });
      }
      else if (opts.ddns) {
        require('../lib/ddns.js').create(opts);
      }

      function sigHandler() {
        console.log('SIGINT');
        // We want to handle cleanup properly unless something is broken in our cleanup process
        // that prevents us from exitting, in which case we want the user to be able to send
        // the signal again and exit the way it normally would.
        process.removeListener('SIGINT', sigHandler);

        if (servers.tunnel) {
          servers.tunnel.end();
        }

        if (servers.plainServer) {
          servers.plainServer.destroy();
        }
        servers.server.destroy();
      }
      process.on('SIGINT', sigHandler);

      Object.keys(opts.ifaces).forEach(function (iname) {
        var iface = opts.ifaces[iname];

        if (iface.ipv4.length) {
          console.info('');
          console.info(iname + ':');

          httpsUrl = 'https://' + iface.ipv4[0].address;
          if (httpsPort !== opts.port) {
            httpsUrl += ':' + opts.port;
          }
          console.info('\t' + httpsUrl);

          if (iface.ipv6.length) {
            httpsUrl = 'https://[' + iface.ipv6[0].address + ']';
            if (httpsPort !== opts.port) {
              httpsUrl += ':' + opts.port;
            }
            console.info('\t' + httpsUrl);
          }
        }
      });

      console.info('');
    });
  });
  });
}

if (require.main === module) {
  run();
}
