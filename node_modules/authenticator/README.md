<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

Node.js Authenticator
=====================

Two- and Multi- Factor Authenication (2FA / MFA) for node.js

![](https://blog.authy.com/assets/posts/authenticator.png)

There are a number of apps that various websites use to give you 6-digit codes to increase security when you log in:

* Authy (shown above) [iPhone](https://itunes.apple.com/us/app/authy/id494168017?mt=8) | [Android](https://play.google.com/store/apps/details?id=com.authy.authy&hl=en) | [Chrome](https://chrome.google.com/webstore/detail/authy/gaedmjdfmmahhbjefcbgaolhhanlaolb?hl=en) | [Linux](https://www.authy.com/personal/) | [OS X](https://www.authy.com/personal/) | [BlackBerry](https://appworld.blackberry.com/webstore/content/38831914/?countrycode=US&lang=en)
* Google Authenticator [iPhone](https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8) | [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en)
* Microsoft Authenticator [Windows Phone](https://www.microsoft.com/en-us/store/apps/authenticator/9wzdncrfj3rj) | [Android](https://play.google.com/store/apps/details?id=com.microsoft.msa.authenticator)
* GAuth [FxOS](https://marketplace.firefox.com/app/gauth/)

There are many [Services that Support MFA](http://lifehacker.com/5938565/heres-everywhere-you-should-enable-two-factor-authentication-right-now),
including Google, Microsoft, Facebook, and Digital Ocean for starters.

This module uses [`notp`](https://github.com/guyht/notp) which implements `TOTP` [(RFC 6238)](https://www.ietf.org/rfc/rfc6238.txt)
(the *Authenticator* standard), which is based on `HOTP` [(RFC 4226)](https://www.ietf.org/rfc/rfc4226.txt)
to provide codes that are exactly compatible with all other *Authenticator* apps and services that use them.

Browser & Commandline Authenticator
---------------------

You may also be interested in

* [Browser Authenticator](https://github.com/Daplie/browser-authenticator) over at <https://github.com/Daplie/browser-authenticator>
* [Commandline Authenticator](https://github.com/Daplie/authenticator-cli) over at <https://github.com/Daplie/authenticator-cli>

Install
=====

**node.js api**
```bash
npm install authenticator --save
```

**command line**
```bash
npm install authenticator-cli --global
```

Usage
=====

**node.js api**
```javascript
'use strict';

var authenticator = require('authenticator');

var formattedKey = authenticator.generateKey();
// "acqo ua72 d3yf a4e5 uorx ztkh j2xl 3wiz"

var formattedToken = authenticator.generateToken(formattedKey);
// "957 124"

authenticator.verifyToken(formattedKey, formattedToken);
// { delta: 0 }

authenticator.verifyToken(formattedKey, '000 000');
// null

authenticator.generateTotpUri(formattedKey, "john.doe@email.com", "ACME Co", 'SHA1', 6, 30);
//
// otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30
```

**command line**
```
# see help
authenticator --help

# generate a key and display qr code
authenticator --qr
```

API
---

```javascript
generateKey()                               // generates a 32-character (160-bit) base32 key

generateToken(formattedKey)                 // generates a 6-digit (20-bit) decimal time-based token

verifyToken(formattedKey, formattedToken)   // validates a time-based token within a +/- 30 second (90 seconds) window
                                            // returns `null` on failure or an object such as `{ delta: 0 }` on success

                                            // generates an `OTPAUTH://` scheme URI for QR Code generation.
generateTotpUri(formattedKey, accountName, issuer, algorithm, digits, period)
```

**OTPAuth Scheme**

* <https://github.com/google/google-authenticator/wiki/Key-Uri-Format>
* `otpauth://totp/<<ISSUER>>:<<ACCOUNT_NAME>>?secret=<<BASE32_KEY>>&issuer=<<ISSUER>>`
* `otpauth://totp/<<ISSUER>>:<<ACCOUNT_NAME>>?secret=<<BASE32_KEY>>&issuer=<<ISSUER>>&algorithm=<<ALGO>>&digits=<<INT>>&period=<<SECONDS>>`

Note that `ISSUER` is specified twice for backwards / forwards compatibility.

QR Code
-------

See <https://davidshimjs.github.io/qrcodejs/> and <https://github.com/soldair/node-qrcode>.

![](http://cdn9.howtogeek.com/wp-content/uploads/2014/10/sshot-7-22.png)

Example use with `qrcode.js` in the browser:

```javascript
'use strict';

var el = document.querySelector('.js-qrcode-canvas');
var link = "otpauth://totp/{{NAME}}?secret={{KEY}}";
var name = "Your Service";
                                              // remove spaces, hyphens, equals, whatever
var key = "acqo ua72 d3yf a4e5 uorx ztkh j2xl 3wiz".replace(/\W/g, '').toLowerCase();

var qr = new QRCode(el, {
  text: link.replace(/{{NAME}}/g, name).replace(/{{KEY}}/g, key)
});
```

Formatting
----------

All non-alphanumeric characters are ignored, so you could just as well use hyphens
or periods or whatever suites your use case.

These are just as valid:

* "acqo ua72 d3yf a4e5 - uorx ztkh j2xl 3wiz"
* "98.24.63"

0, 1, 8, and 9 also not used (so that base32).
To further avoid confusion with O, o, L, l, I, B, and g
you may wish to display lowercase instead of uppercase.

TODO: should this library replace 0 with o, 1 with l (or I?), 8 with b, 9 with g, and so on?

90-second Window
----------------

The window is set to +/- 1, meaning each token is valid for a total of 90 seconds
(-30 seconds, +0 seconds, and +30 seconds)
to account for time drift (which should be very rare for mobile devices)
and humans who are handicapped or otherwise struggle with quick fine motor skills (like my grandma).


Why not SpeakEasy?
------------------

It doesn't use native node crypto and there are open security issues which have been left unaddressed.
