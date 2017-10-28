'use strict';

var PromiseA = require('bluebird');
var fs = PromiseA.promisifyAll(require('fs'));
//var punycode = require('punycode');
var path = require('path');
var UUID = require('node-uuid');
var crypto = require('crypto');
var mkdirpAsync = PromiseA.promisify(require('mkdirp'));

var A = module.exports;

// TODO needs unit test
A._reHostname = /^[a-z0-9\.\-]+$/;                              // all valid (lowercase) hostnames
A._reConfname = /^[a-z0-9][a-z0-9\.\-]*\.[a-z0-9\-]+\.json$/;   // <domain>.<domain>.json
A.providers = ['oauth3.org'/*, 'daplie.com', 'daplie.me', 'lds.io', 'hellabit.com'*/];
A.getConfname = function (filename) {
  /*
  if (!reHostname.test(domain)) {
    return false;
  }

  domain = punycode.toASCII(domain);

  if (!reHostname.test(domain)) {
    return false;
  }
  */

  if (A._reConfname.test(filename)) {
    return filename;
  }

  return '';
};

A._readFileMaybe = function (fname) {
  return fs.readFileAsync(fname, 'utf8').then(function (text) {
    try {
      return JSON.parse(text);
    } catch(e) {
      A._showWarning(fname, text);
      return null;
    }
  }, function (/*err*/) {
    return null;
  });
};
A._showWarning = function (filename, text) {
  var mtime = fs.statSync(filename).mtime;
  var bakname = filename + "."
      + (mtime.toISOString().replace(/[-:]/g, '').replace('T', '_').replace(/\..*/, ''))
      + ".bak'"
      ;

  console.warn("[Error] couldn't parse '" + filename + "'");
  fs.writeFileSync(bakname, text, 'utf8');
  console.warn("    backed up as '" + bakname + "'");
  fs.unlinkSync(filename, text, 'utf8');
  console.warn("    removed '" + filename + "'");
};

A.devices = {};
A.devices.all = function (conf) {
  var pathname = path.join(conf.rcpath, 'devices');

  return fs.readdirAsync(pathname).then(function (nodes) {
    return nodes.map(function (node) {
      node = node.toLowerCase();
      if ('default.json' === node || !/\.json$/.test(node)) {
        return null;
      }
      return node.replace(/\.json$/, '');
    }).filter(function (n) {
      return n;
    });
  });
};
A.devices.select = function (conf) {
  // because sometimes we want to fake out a device
  return A.devices.all(conf).then(function (/*names*/) {
    throw new Error("device select and resave default not yet implemented");
  });
};
A.devices.one = function (conf) {
  var pathname = path.join(conf.rcpath, 'devices');
  var devicename = (conf.device && conf.device.hostname || '').toLowerCase();

  return mkdirpAsync(pathname).then(function () {
    var defaultname = path.join(pathname, 'default.json');
    return A._readFileMaybe(defaultname).then(function (defaultDevice) {
      if (!defaultDevice) {
        defaultDevice = {
          hostname: (devicename || require('os').hostname()).toLowerCase()
        };
        fs.writeFileSync(
          defaultname.toLowerCase()
        , JSON.stringify(defaultDevice, null, '  ') + '\n'
        , 'utf8'
        );
      }

      if (!devicename) {
        devicename = defaultDevice.hostname;
      }

      var devfile = path.join(pathname, devicename + '.json');
      return A._readFileMaybe(devfile).then(function (device) {
        return device || {};
      });
    });
  }).then(function (device) {
    if (!device.uuid) {
      device.uuid = UUID.v4();
    }

    if (!device.hostname) {
      device.hostname = devicename;
    }

    if (!device.secret) {
      device.secret = crypto.randomBytes(16).toString('hex');
    }

    return fs.writeFileAsync(
      path.join(pathname, device.hostname + '.json')
    , JSON.stringify(device, null, '  ') + '\n'
    , 'utf8'
    ).then(function () {
      return { device: device };
    });
  });
};

A.saveSession = function (state, setDefault) {
  var sessionfile = path.join(state.rcpath, 'logins', state.providerUrl, state.username + '.json');
  var accountsDir = path.join(state.rcpath, 'accounts');
  var defaultAccountFile = path.join(accountsDir, 'default.json');
  // TODO session for the account, or the login?
  var profile = {
    sessions: [
      { accounts: state.accounts
      , session: state.session
      , userMeta: state.userMeta
      , credentialId: state.username
      }
    ]
  };

  return fs.writeFileAsync(sessionfile, JSON.stringify(profile, null, 2) + '\n', 'utf8').then(function () {
    function write() {
      var json = JSON.stringify({
        providerUrl: state.providerUrl
      , credentialId: state.username
      , accountId: state.accountId || state.session.acx
          || state.account.ppid || state.account.idx || state.account.appScopedId
      }, null, 2);

      return fs.writeFileAsync(defaultAccountFile, json + '\n', 'utf8');
    }

    return mkdirpAsync(accountsDir).then(function () {
      return fs.existsAsync(defaultAccountFile).then(function () {
        return write();
      }, function () {
        if (setDefault) {
          return write();
        }
      });
    });
  });
};

A.session = function (state) {
  // TODO lowercase domain portion of providerUrl
  // TODO handle '/' in providerUrl as non-directory (?)
  // TODO account identifier irrespective of username
  var providerDir = path.join(state.rcpath, 'logins', state.providerUrl);

  return mkdirpAsync(providerDir).then(function () {
    var sessionfile = path.join(state.rcpath, 'logins', state.providerUrl, state.username + '.json');
    return fs.readFileAsync(sessionfile, 'utf8').then(function (text) {
      return JSON.parse(text);
    }).then(function (data) {
      return data;
    }, function (err) {
      if ('SyntaxError' === err.name) {
        throw err;
      }

      return null;
    }).then(function (profile) {
      //state.providerUrl
      if (!profile) {
        profile = {};
      }
      if (!Array.isArray(profile.accounts)) {
        profile.accounts = [];
      }

      return profile.sessions;
    });
  }).then(function (sessions) {
    state.triedSession = true;

    var session = sessions && sessions[0];

    if (!Array.isArray(sessions) || !session) {
      return null;
    }

    return session;
  });
};

A.getDefaults = function (state) {
  if (state.providerUrl && state.username && state.accountId) {
    return PromiseA.resolve(null);
  }

  var accountsDir = path.join(state.rcpath, 'accounts');
  var defaultAccount = path.join(accountsDir, 'default.json');

  return mkdirpAsync(accountsDir).then(function () {
    return fs.readFileAsync(defaultAccount, 'utf8').then(function (text) {
      var defs;

      try {
        defs = JSON.parse(text);
      } catch(e) {
        return;
      }

      defs.credentialId = defs.credentialId || defs.userId /*deprecated*/;

      // false / null should count as purposefully ignoring the defaults
      if (('undefined' === typeof state.providerUrl) || (defs.providerUrl === state.providerUrl)) {
        state.providerUrl = defs.providerUrl;
        if (('undefined' === typeof state.username) || (defs.credentialId === state.username)) {
          state.username = defs.credentialId;
          if (('undefined' === typeof state.accountId) || (defs.accountId === state.accountId)) {
            state.accountId = defs.accountId;
          }
        }
      }

    }, function (err) {
      if ('ENOENT' === err.code) {
        return;
      }

      return PromiseA.reject(err);
    });
  });
};

A.profiles = {};
A.profiles.all = function (conf) {
  var pathname = path.join(conf.rcpath, 'logins');

  return mkdirpAsync(pathname).then(function () {
    return fs.readdirAsync(pathname);
  }).then(function (nodes) {
    var results = { configs: [], errors: [] };

    nodes = nodes.filter(A.getConfname);

    return PromiseA.all(nodes.map(function (confdir) {

      return fs.readdirAsync(path.join(pathname, confdir), 'utf8').then(function (confnames) {
        return PromiseA.all(confnames.map(function (confname) {
          var confFilename = path.join(pathname, confdir, confname);
          return fs.readFileAsync(confFilename, 'utf8').then(function (text) {
            try {
              results.configs.push(JSON.parse(text));
            } catch(e) {
              results.errors.push({ message: "could not parse", config: confname });
            }
          }, function (err) {
            results.errors.push({ code: err.code, message: "could not read", config: confname });
          });
        }));
      }, function (err) {
        results.errors.push({ code: err.code, message: "could not read", config: confdir });
      });

    })).then(function () {
      return results;
    });
  });
};
