(function () {
'use strict';

var WebSocket = require('ws');
var jwt = require('jsonwebtoken');
var hostname = 'example.daplie.me';
var token = jwt.sign({ name: hostname }, 'shhhhh');
var url = 'wss://stunnel.hellabit.com:3000/?access_token=' + token;
var wstunneler = new WebSocket(url, { rejectUnauthorized: false });

wstunneler.on('open', function () {
  console.log('open');
});

wstunneler.on('error', function (err) {
  console.error(err.toString());
});

}());
