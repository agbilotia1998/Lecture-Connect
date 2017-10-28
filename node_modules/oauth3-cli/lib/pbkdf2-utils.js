'use strict';

var PromiseA = require('bluebird');
var crypto = require('crypto');

module.exports.sha256 = function sha256(hex) {
  return crypto.createHash('sha256').update(new Buffer(hex, 'hex')).digest('hex');
};

// cipherKey = crypto.randomBytes(16)
//var aesCipherKey = '0123456789abcdeffedcba9876543210';

function getProofOfSecret(salt, secret, iter) {
  var userMeta = {
    algorithm: 'PBKDF2'
  //, salt: sha256(new Buffer(id).toString('hex') + appId)
  , salt: salt
  , iterations: iter || 372
  , length: 128
  , hash: 'SHA-256'
  };
  var keyBitLength = userMeta.length;
  var keyByteLength = keyBitLength / 8; // 32
  // saltSalt = crypto.randomBytes(32)
  // crypto.createHash('sha512').update(saltSalt).digest();
  var appPbkdf2Salt = new Buffer(userMeta.salt, 'hex');
  // pick a random number between 100 and 500
  // Math.ceil(parseFloat("0." + parseInt(crypto.randomBytes(4).toString('hex'), 16), 10) * 400) + 100;
  var iterations = userMeta.iterations;
  var hashname = userMeta.hash.toLowerCase().replace(/-/g, '');

  return new PromiseA(function (resolve, reject) {
    crypto.pbkdf2(secret, appPbkdf2Salt, iterations, keyByteLength, hashname, function (err, bytes) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        salt: appPbkdf2Salt.toString('hex')
      , kdf: 'pbkdf2'
      , algo: hashname
      //, hash: hashname
      , iter: iterations
      , proof: bytes.toString('hex')
      //, shadow: bytes.toString('hex')
      , bits: keyByteLength * 8
      });
    });
  });
}

// var appId = 'fedcba98765432100123456789abcdef';
// var userId = 'john.doe@email.com';
// var secret = 'MY_LITTLE_SECRET';
// getProofOfSecret(appId, userId, secret);
module.exports.getProofOfSecret = getProofOfSecret;
