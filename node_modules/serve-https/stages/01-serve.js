'use strict';

var https = require('httpolyglot');
var httpsOptions = require('localhost.daplie.me-certificates').merge({});
var httpsPort = 8443;
var redirectApp = require('redirect-https')({
  port: httpsPort
});

var server = https.createServer(httpsOptions);

server.on('request', function (req, res) {
  if (!req.socket.encrypted) {
    redirectApp(req, res);
    return;
  }

  res.end("Hello, Encrypted World!");
});

server.listen(httpsPort, function () {
  console.log('https://' + 'localhost.daplie.me' + (443 === httpsPort ? ':' : ':' + httpsPort));
});
