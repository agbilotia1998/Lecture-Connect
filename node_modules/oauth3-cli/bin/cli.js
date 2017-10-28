'use strict';

var cli = require('cli');

cli.parse({
  provider: [ false, "Provider URL which to use (such as facebook.com)", 'string' ]
, id: [ false, "The login id, typically your email address", 'string' ]
, secret: [ false, "The login shared secret, typically your passphrase (12+ characters, ~72+ bits)", 'string' ]
, totp: [ false, "base32-encoded 160-bit key to use for account creation (or false to disable)", 'string' ]
, scope: [ false, "OAuth scope", 'string' ]
, client: [ false, "OAuth client id (if different than provider url)", 'string' ]

, domains: [ false, "Comma-separated list of domains to purchase", 'string' ]
, tip: [ false, "Decimal dollar amount for tip (i.e. 0, 1.25, 5)", 'string' ]
, 'max-purchase-price': [ false, "Agree to purchase below decimal dollar amount (i.e. 12.5,25,100)", 'string' ]

, 'cc-number': [ false, "Credit Card number (xxxx-xxxx-xxxx-xxxx)", 'string' ]
, 'cc-exp': [ false, "Credit Card expiration (mm/yy)", 'string' ]
, 'cc-cvc': [ false, "Credit Card Verification Code (xxx)", 'string' ]
//, 'cc-email': [ false, "Credit Card email (xxxxxx@xxxx.xxx)", 'string' ]
//, 'cc-nick': [ false, "Credit Card nickname (defaults to email)", 'string' ]

, 'first-name': [ false, "(Domain Registration) First Name", 'string' ]
, 'last-name': [ false, "(Domain Registration) Last Name", 'string' ]
, 'phone': [ false, "(Domain Registration) Phone", 'string' ]
, 'email': [ false, "(Domain Registration) Email", 'string' ]
, 'line1': [ false, "(Domain Registration) Street Address", 'string' ]
, 'line2': [ false, "(Domain Registration) Extended Address", 'string' ]
, 'locality': [ false, "(Domain Registration) Locality (City)", 'string' ]
, 'region': [ false, "(Domain Registration) Region (State/Province)", 'string' ]
, 'postal-code': [ false, "(Domain Registration) Postal Code (Zip)", 'string' ]
, 'country-code': [ false, "(Domain Registration) 2-digit Country Code", 'string' ]
});

// ignore certonly and extraneous arguments
cli.main(function(_, options) {
  require('../lib/index').run(options);
});

process.on('unhandledRejection', function(reason, p) {
  console.log("Possibly Unhandled Rejection at:");
  console.log("Promise: ", p);
  console.log(p.stack);
  console.log("Reason: ", reason);
  console.log(reason.stack);
  process.exit(1);
  // application specific logging here
});
