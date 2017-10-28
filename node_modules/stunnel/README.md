<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

# stunnel.js

A client that works in combination with [stunneld.js](https://github.com/Daplie/node-tunnel-server)
to allow you to serve http and https from any computer, anywhere through a secure tunnel.

* CLI
* Library

CLI
===

Installs as `stunnel.js` with the alias `jstunnel`
(for those that regularly use `stunnel` but still like commandline completion).

### Install

```bash
npm install -g 'git+https://git@git.daplie.com/Daplie/node-tunnel-client.git#v1'
```

Or if you want to bow down to the kings of the centralized dictator-net:

```bash
npm install -g stunnel
```

### Usage with OAuth3.org

Daplie's OAuth3.org tunnel service is in Beta.

**Terms of Service**: The Software and Services shall be used for Good, not Evil.
Examples of good: education, business, pleasure. Examples of evil: crime, abuse, extortion.

```bash
stunnel.js --agree-tos --email john@example.com --locals http:*:4080,https:*:8443 --device
```

```bash
stunnel.js \
  --agree-tos --email <EMAIL> \
  --locals <List of <SCHEME>:<EXTERNAL_DOMAINNAME>:<INTERNAL_PORT>> \
  --device [HOSTNAME] \
  --domains [Comma-separated list of domains to attach to device] \
  --oauth3-url <Tunnel Service OAuth3 URL>
```

### Advanced Usage (DIY)

How to use `stunnel.js` with your own instance of `stunneld.js`:

```bash
stunnel.js \
  --locals <<external domain name>> \
  --stunneld wss://<<tunnel domain>>:<<tunnel port>> \
  --secret <<128-bit hex key>>
```

```bash
stunnel.js --locals john.example.com --stunneld wss://tunnel.example.com:443 --secret abc123
```

```bash
stunnel.js \
  --locals <<protocol>>:<<external domain name>>:<<local port>> \
  --stunneld wss://<<tunnel domain>>:<<tunnel port>> \
  --secret <<128-bit hex key>>
```

```bash
stunnel.js \
  --locals http:john.example.com:3000,https:john.example.com \
  --stunneld wss://tunnel.example.com:443 \
  --secret abc123
```

```
--secret          the same secret used by stunneld (used for authentication)
--locals          comma separated list of <proto>:<servername>:<port> to which
                  incoming http and https should be forwarded
--stunneld        the domain or ip address at which you are running stunneld.js
-k, --insecure    ignore invalid ssl certificates from stunneld
```

Library
=======

### Example

```javascript
var stunnel = require('stunnel');

stunnel.connect({
  stunneld: 'wss://tunnel.example.com'
, token: '...'
, locals: [
    // defaults to sending http to local port 80 and https to local port 443
    { hostname: 'doe.net' }

    // sends both http and https to local port 3000 (httpolyglot)
  , { protocol: 'https', hostname: 'john.doe.net', port: 3000 }

    // send http to local port 4080 and https to local port 8443
  , { protocol: 'https', hostname: 'jane.doe.net', port: 4080 }
  , { protocol: 'https', hostname: 'jane.doe.net', port: 8443 }
  ]

, net: require('net')
, insecure: false
});
```

* You can get sneaky with `net` and provide a `createConnection` that returns a `stream.Duplex`.

### Token

```javascript
var tokenData = { domains: [ 'doe.net', 'john.doe.net', 'jane.doe.net' ] }
var secret = 'shhhhh';
var token = jwt.sign(tokenData, secret);
```

### net

Let's say you want to handle http requests in-process
or decrypt https before passing it to the local http handler.

You'll need to create a pair of streams to connect between the
local handler and the tunnel handler.

You could do a little magic like this:

```js
stunnel.connect({
  // ...
, net: {
  createConnection: function (info, cb) {
    // data is the hello packet / first chunk
    // info = { data, servername, port, host, remoteAddress: { family, address, port } }

    var streamPair = require('stream-pair');
    
    // here "reader" means the socket that looks like the connection being accepted
    var writer = streamPair.create();
    // here "writer" means the remote-looking part of the socket that driving the connection
    var reader = writer.other;
    // duplex = { write, push, end, events: [ 'readable', 'data', 'error', 'end' ] };

    reader.remoteFamily = info.remoteFamily;
    reader.remoteAddress = info.remoteAddress;
    reader.remotePort = info.remotePort;

    // socket.local{Family,Address,Port}
    reader.localFamily = 'IPv4';
    reader.localAddress = '127.0.01';
    reader.localPort = info.port;

    httpsServer.emit('connection', reader);

    if (cb) {
      process.nextTick(cb);
    }

    return writer;
  }
});
```
