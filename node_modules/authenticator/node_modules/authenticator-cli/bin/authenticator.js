#!/usr/bin/env node
'use strict';

var cli = require('cli');
var authenticator = require('authenticator');
var qrcode = require('qrcode-terminal');

cli.parse({
  account: [ false, "Account Name, typically email address", 'string', 'user@example.com' ]
, algo: [ false, "Algorithm, typically SHA1 (also SHA256, SHA512)", 'string', 'SHA1' ]
, digits: [ false, "Number of digits, typically 6 (also 8)", 'integer', 6 ]
, generate: [ false, "Create a cryptographically-random TOTP key formatted in base32 with spaces.", 'boolean', true ]
, issuer: [ false, "Issuer, typically the company name (Google, Facebook, Digital Ocean, etc)", 'string', 'ACME' ]
, key: [ false, "Supply the base32 key yourself (with or without delimeters). Takes precedence over --generate", 'string' ]
, period: [ false, "Number of seconds between tokens, typically 30", 'integer', 30 ]
, qr: [ false, "Print the QR Code to the Terminal.", 'boolean', false ]
//, token: [ false, "Print the current token for the given (or generated) key.", 'boolean', false ]
, verify: [ false, "Verify a token. Must be used with --key.", 'string' ]
});

// ignore certonly and extraneous arguments
cli.main(function(_, options) {
  var key = (options.key || authenticator.generateKey()).toString();
  var token = (options.verify || authenticator.generateToken(key)).toString();
  var url = authenticator.generateTotpUri(
    key
  , options.account || null
  , options.issuer || null
  , options.algo || 'SHA1'
  , options.digits || 6
  , options.perdiod || 30
  );

  console.log('');
  console.log('Key:', key);
  console.log('Token:', token);
  console.log('URL:', url);

  if (options.qr) {
    console.log('');
    qrcode.setErrorLevel('L'); // L: 7%, M: 15%, Q: 25%, H: 30%
    qrcode.generate(url, function (qr) {
      console.log(qr);
    });
  }

  if (options.verify) {
    console.log('');
    console.log('Verified:', !!authenticator.verifyToken(key, token));
  }

  console.log('');
});
