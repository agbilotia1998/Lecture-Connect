#!/usr/bin/env node
'use strict';

var PromiseA = require('bluebird');
var https = require('https');
var fs = PromiseA.promisifyAll(require('fs'));

module.exports.update = function (opts) {
  if (!Array.isArray(opts.servers) && opts.updaters.length) {
    throw new Error('Please specify a DDNS host as opts.servers');
  }

  var servernames = opts.servers.slice();
  var results = [];
  var resultsMap = {};

  function update(servername) {
    return new PromiseA(function (resolve, reject) {
      var options;
      var hostname = servername;
      var port = opts.port;
      var pathname = opts.pathname;
      var req;

      if (!hostname) {
        throw new Error('Please specify a DDNS host as opts.hostname');
      }
      if (!pathname) {
        throw new Error('Please specify the api route as opts.pathname');
      }

      options = {
        host: hostname
      , port: port || 443
      , method: 'POST'
      , headers: {
          'Content-Type': 'application/json'
        }
      , path: pathname
      //, auth: opts.auth || 'admin:secret'
      };

      if (opts.cacert) {
        if (!Array.isArray(opts.cacert)) {
          opts.cacert = [opts.cacert];
        }
        options.ca = opts.cacert;
      }

      if (opts.token || opts.jwt) {
        options.headers.Authorization = 'Bearer ' + (opts.token || opts.jwt);
      }

      if (false === opts.cacert) {
        options.rejectUnauthorized = false;
      }

      options.ca = (options.ca||[]).map(function (str) {
        if ('string' === typeof str && str.length < 1000) {
          str = fs.readFileAsync(str);
        }
        return str;
      });

      return PromiseA.all(options.ca).then(function (cas) {
        options.ca = cas;
        options.agent = new https.Agent(options);

        req = https.request(options, function(res) {
          var textData = '';

          res.on('error', function (err) {
            reject(err);
          });
          res.on('data', function (chunk) {
            textData += chunk.toString();
            // console.log(chunk.toString());
          });
          res.on('end', function () {
            var err;
            try {
              resolve(JSON.parse(textData));
            } catch(e) {
              err = new Error("Unparsable Server Response");
              err.code = 'E_INVALID_SERVER_RESPONSE';
              err.data = textData;
              reject(err);
            }
          });
        });

        req.on('error', function (err) {
          reject(err);
        });

        req.end(JSON.stringify(opts.ddns, null, '  '));
      }, reject);
    });
  }

  return new PromiseA(function (resolve, reject) {
    function nextServer() {
      var servername = servernames.shift();

      if (!servername) {
        if (opts.mapResults) {
          resolve(resultsMap);
        } else {
          resolve(results);
        }
        return;
      }

      update(servername).then(function (result) {
        results.push(result);
        resultsMap[servername] = {
          results: result
        , index: opts.servers.indexOf(servername)
        };
        nextServer();
      }, function (err) {
        if (opts.allOrNothing) {
          reject(err);
          return;
        }

        if (!opts.ignoreServerFailure) {
          results.push({ error: err });
          resultsMap[servername] = {
            error: err
          , index: opts.servers.indexOf(servername)
          };
        }
        nextServer();
      });
    }

    nextServer();
  });

};
