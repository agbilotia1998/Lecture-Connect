'use strict';

var PromiseA = require('bluebird');
var A3 = module.exports;
var requestAsync = PromiseA.promisify(require('request'));

A3.parseJson = function (resp) {
  var err;
  var json = resp.body;

  // TODO toCamelCase
  if (!(resp.statusCode >= 200 && resp.statusCode < 400)) {
    // console.log('[A3] DEBUG', resp.body);
    err = new Error("bad response code: " + resp.statusCode);
    err.result = resp.body;
    return PromiseA.reject(err);
  }

  //console.log('resp.body', typeof resp.body);
  if ('string' === typeof json) {
    try {
      json = JSON.parse(json);
    } catch(e) {
      err = new Error('response not parsable:' + resp.body);
      err.result = resp.body;
      return PromiseA.reject(err);
    }
  }

  // handle both Oauth2- and node-style errors
  if (json.error) {
    err = new Error(json.error && json.error.message || json.error_description || json.error);
    err.result = json;
    return PromiseA.reject(err);
  }

  return json;
};

A3.request = function (opts) {
  var data = {
    method: opts.method
  , url: opts.url || opts.uri
  , headers: opts.headers
  , json: opts.body || opts.data || opts.json || undefined // TODO which to use?
  , formData: opts.formData || undefined
  };

  //console.log('DEBUG request');
  //console.log(opts.url || opts.uri);
  //console.log(data.json);

  return requestAsync(data).then(A3.parseJson);
};
