'use strict';

var leChallengeDns = require('./').create({

  test: '_test_01'
, email: 'test@daplie.com'
, refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJqdGkiOiJjY2VmMjNlMGNjYWE1MDRlNDY0ZGEwZWQ4YTI3NmRjNSIsImlhdCI6MTQ3MzI3NTQwOSwiaXNzIjoib2F1dGgzLm9yZyIsImF1ZCI6Im9hdXRoMy5vcmciLCJhenAiOiJvYXV0aDMub3JnIiwic3ViIjoiIiwia2lkIjoib2F1dGgzLm9yZyIsInNjcCI6IiIsImFzIjoibG9naW4iLCJncnQiOiJwYXNzd29yZCIsInNydiI6ZmFsc2UsImsiOiJvYXV0aDMub3JnIiwiYXBwIjoib2F1dGgzLm9yZyIsImF4cyI6W10sInVzciI6IjFlMzAxOTBjZGJiMWM4Yjg4MmJiNTg0OTQ1OGNlZWEzYTk1NTI4ZjIiLCJhY3MiOltdLCJpZHgiOiJxTFNOVHYwTG11YkFnSTc4eEo3d2FlOHVNc1FORFhWVDFsVWRGdHdVbHNpN1hiRnY3OTFVSFlhNE81RkNaeGtDIiwicmVmcmVzaCI6dHJ1ZX0.q2AgyzclADm8LBIbkazbr9Ji_6lj0dS-OhOwHBKimbc6gNlJUpSAlUEKMhEPswYkIIw9oIzOdf2-13FRpk6ZSa7NxRcZ37B6TBMpVzmHojnyXa025uht3CX7UdBtXMsxOSNSEv-m2CLLfq89j2Zr0kwdiUvpb9oo2IwxWPJMgmc'

//, debug: true
});

var opts = leChallengeDns.getOptions();
var domain = 'test.daplie.me';
var challenge = 'xxx-acme-challenge-xxx';
var keyAuthorization = 'xxx-acme-challenge-xxx.xxx-acme-authorization-xxx';

setTimeout(function () {
  leChallengeDns.test(opts, domain, challenge, null, function (err) {
    // if there's an error, there's a problem
    if (err) { throw err; }

    console.log('test passed');
  });
}, 300);
