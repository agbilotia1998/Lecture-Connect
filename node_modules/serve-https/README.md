<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

serve-https
===========

A simple HTTPS static file server with valid TLS (SSL) certs.

Comes bundled a valid certificate for localhost.daplie.me,
which is great for testing and development, and you can specify your own.

Also great for testing ACME certs from letsencrypt.org.

Install
-------

```bash
# v2.x
npm install --global serve-https@2.x

# v1.x
npm install --global serve-https@1.x

# master in git (via ssh)
npm install -g git+ssh://git@git.daplie.com:Daplie/serve-https

# master in git (unauthenticated)
npm install -g git+https://git@git.daplie.com:Daplie/serve-https
```

```bash
serve-https
```

```bash
Serving /Users/foo/ at https://localhost.daplie.me:8443
```

Usage
-----

Examples:

```
# Install
npm install -g git+https://git@git.daplie.com:Daplie/serve-https

# Use tunnel
serve-https --sites jane.daplie.me --agree-tos --email jane@example.com --tunnel

# BEFORE you access in a browser for the first time, use curl
# (because there's a concurrency bug in the greenlock setup)
curl https://jane.daplie.me
```

Options:

* `-p <port>` - i.e. `sudo serve-https -p 443` (defaults to 80+443 or 8443)
* `-d <dirpath>` - i.e. `serve-https -d /tmp/` (defaults to `pwd`)
  * you can use `:hostname` as a template for multiple directories
  * Example A: `serve-https -d /srv/www/:hostname --sites localhost.foo.daplie.me,localhost.bar.daplie.me`
  * Example B: `serve-https -d ./:hostname/public/ --sites localhost.foo.daplie.me,localhost.bar.daplie.me`
* `-c <content>` - i.e. `server-https -c 'Hello, World! '` (defaults to directory index)
* `--express-app <path>` - path to a file the exports an express-style app (`function (req, res, next) { ... }`)
* `--livereload` - inject livereload into all html pages (see also: [fswatch](http://stackoverflow.com/a/13807906/151312)), but be careful if `<dirpath>` has thousands of files it will spike your CPU usage to 100%
* `--trust-proxy <x.x.x.x,y.y.y.y>` - by default your https redirect will be skipped if the X-Forwarded-Proto or Forwarded headers are specified by loopback, linklocal, or uniquelocal addresses (i.e. 127.0.0.1, 192.168.x.x, 169.x.x.x). You can override that here.

* `--email <email>` - email to use for Let's Encrypt, Daplie DNS, Daplie Tunnel
* `--agree-tos` - agree to terms for Let's Encrypt, Daplie DNS
* `--sites <domain.tld>` comma-separated list of domains to respond to (default is `localhost.daplie.me`)
  * optionally you may include the path to serve with `|` such as `example.com|/tmp,example.net/srv/www`
* `--tunnel` - make world-visible (must use `--sites`)

Specifying a custom HTTPS certificate:

* `--key /path/to/privkey.pem` specifies the server private key
* `--cert /path/to/fullchain.pem` specifies the bundle of server certificate and all intermediate certificates
* `--root /path/to/root.pem` specifies the certificate authority(ies)

Note: `--root` may specify single cert or a bundle, and may be used multiple times like so:

```
--root /path/to/primary-root.pem --root /path/to/cross-root.pem
```

Other options:

* `--serve-root true` alias for `-c` with the contents of root.pem
* `--sites example.com` changes the servername logged to the console
* `--letsencrypt-certs example.com` sets and key, fullchain, and root to standard letsencrypt locations

Examples
--------

```bash
serve-https -p 1443 -c 'Hello from 1443' &
serve-https -p 2443 -c 'Hello from 2443' &
serve-https -p 3443 -d /tmp &

curl https://localhost.daplie.me:1443
> Hello from 1443

curl --insecure https://localhost:2443
> Hello from 2443

curl https://localhost.daplie.me:3443
> [html index listing of /tmp]
```

And if you tested <http://localhost.daplie.me:3443> in a browser,
it would redirect to <https://localhost.daplie.me:3443> (on the same port).

(in curl it would just show an error message)

### Testing ACME Let's Encrypt certs

In case you didn't know, you can get free https certificates from
[letsencrypt.org](https://letsencrypt.org)
(ACME letsencrypt)
and even a free subdomain from <https://freedns.afraid.org>.

If you want to quickly test the certificates you installed,
you can do so like this:

```bash
sudo serve-https -p 8443 \
  --letsencrypt-certs test.mooo.com \
  --serve-root true
```

which is equilavent to

```bash
sudo serve-https -p 8443 \
  --sites test.mooo.com
  --key /etc/letsencrypt/live/test.mooo.com/privkey.pem \
  --cert /etc/letsencrypt/live/test.mooo.com/fullchain.pem \
  --root /etc/letsencrypt/live/test.mooo.com/root.pem \
  -c "$(cat 'sudo /etc/letsencrypt/live/test.mooo.com/root.pem')"
```

and can be tested like so

```bash
curl --insecure https://test.mooo.com:8443 > ./root.pem
curl https://test.mooo.com:8843 --cacert ./root.pem
```

* [QuickStart Guide for Let's Encrypt](https://coolaj86.com/articles/lets-encrypt-on-raspberry-pi/)
* [QuickStart Guide for FreeDNS](https://coolaj86.com/articles/free-dns-hosting-with-freedns-afraid-org.html)
