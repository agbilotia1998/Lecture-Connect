<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

# redirect-https

Redirect from HTTP to HTTPS using meta redirects

See <https://coolaj86.com/articles/secure-your-redirects/>

## Installation and Usage

```bash
npm install --save redirect-https
```

```js
'use strict';

var express = require('express');
var app = express();

app.use('/', require('redirect-https')({
  body: '<!-- Hello Mr Developer! Please use HTTPS instead -->'
}));

module.exports = app;
```

## Options

```
{ port: 443           // defaults to 443
, body: ''            // defaults to an html comment to use https
, trustProxy: true    // useful if you haven't set this option in express
}
```

* This module will call `next()` if the connection is already tls / https.
* If `trustProxy` is true, and `X-Forward-Proto` is https, `next()` will be called.
* If you use `{{URL}}` in the body text it will be replaced with a URI encoded and HTML escaped url (it'll look just like it is)
* If you use `{{HTML_URL}}` in the body text it will be replaced with a URI decoded and HTML escaped url (it'll look just like it would in Chrome's URL bar)

## Demo

```javascript
'use strict';

var http = require('http');
var server = http.createServer();
var securePort = process.argv[2] || 8443;
var insecurePort = process.argv[3] || 8080;

server.on('request', require('redirect-https')({
  port: securePort
, body: '<!-- Hello! Please use HTTPS instead -->'
, trustProxy: true // default is false
}));

server.listen(insecurePort, function () {
  console.log('Listening on http://localhost.daplie.com:' + server.address().port);
});
```

# Why meta redirects?

When something is broken (i.e. insecure), you don't want it to kinda work, you want developers to notice.

Using a meta redirect will break requests from `curl` and api calls from a programming language, but still have all the SEO and speed benefits of a normal `301`.

```html
<html><head>
<meta http-equiv="refresh" content="0;URL='https://example.com/foo'" />
</head><body>
<!-- Hello Mr. Developer! Please use https instead. Thank you! -->
</html>
```

# Other strategies

If your application is properly separated between static assets and api, then it would probably be more beneficial to return a 200 OK with an error message inside

# Security

The incoming URL is already URI encoded by the browser but, just in case, I run an html escape on it
so that no malicious links of this sort will yield unexpected behavior:

  * `http://localhost.daplie.com:8080/"><script>alert('hi')</script>`
  * `http://localhost.daplie.com:8080/';URL=http://example.com`
  * `http://localhost.daplie.com:8080/;URL=http://example.com`
