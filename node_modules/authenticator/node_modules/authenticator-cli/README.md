<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

# Commandline Authenticator

A commandline Authenticator App (for Authy, Google Authenticator, Microsoft Authenticator, Facebook Authenticator, TOTP, etc)

```bash
authenticator --generate --issuer "ACME" --account "user@example.com"

Key: ru36 53z3 fmh4 d67u kgeh 7rgj hcbb ypnd
Token: 947464
URL: otpauth://totp/ACME:user@example.com?secret=RU3653Z3FMH4D67UKGEH7RGJHCBBYPND&issuer=ACME&algorithm=SHA1&digits=6&period=30
```

## Install

**Install node.js 4.0+**:

```bash
curl -L bit.ly/iojs-min | bash
```

**Install authenticator**:
```bash
npm install --global authenticator-cli
```

## Usage

```bash
authenticator --help
```

## Browser & Node Authenticator

You may also be interested in

* [Browser Authenticator](https://github.com/Daplie/browser-authenticator) over at <https://github.com/Daplie/browser-authenticator>
* [Node.js Authenticator](https://github.com/Daplie/node-authenticator) over at <https://github.com/Daplie/node-authenticator>

## Full Usage

```
Usage:
  authenticator [OPTIONS]

Options:
      --account user@example.com    Account Name, typically email address (Default is user@example.com)

      --algo SHA1                   Algorithm, typically SHA1 (also SHA256, SHA512)  (Default is SHA1)

      --digits 6                    Number of digits, typically 6 (also 8) (Default is 6)

      --generate                    Create a cryptographically-random TOTP key
                                    formatted in base32 with spaces.  (Default is true)

      --issuer ACME                 Issuer, typically the company name (Google,
                                    Facebook, Digital Ocean, etc)  (Default is ACME)

      --key 'xxxx xxxx ...'         Supply the base32 key yourself (with or without
                                    delimeters). Takes precedence over --generate

      --period 30                   Number of seconds between tokens, typically 30  (Default is 30)

      --qr                          Print the QR Code to the Terminal.

      --verify '123 456'            Verify a token. Must be used with --key.

  -h, --help                        Display help and usage details
```
