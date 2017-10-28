<!-- BANNER_TPL_BEGIN -->

About Daplie: We're taking back the Internet!
--------------

Down with Google, Apple, and Facebook!

We're re-decentralizing the web and making it read-write again - one home cloud system at a time.

Tired of serving the Empire? Come join the Rebel Alliance:

<a href="mailto:jobs@daplie.com">jobs@daplie.com</a> | [Invest in Daplie on Wefunder](https://daplie.com/invest/) | [Pre-order Cloud](https://daplie.com/preorder/), The World's First Home Server for Everyone

<!-- BANNER_TPL_END -->

# tunnel-packer

A strategy for packing and unpacking tunneled network messages (or any stream) in node.js

Examples

```js
var Packer = require('tunnel-packer');

Packer.create({
  onmessage: function (msg) {
    // msg = { family, address, port, service, data };
  }
, onend: function (msg) {
    // msg = { family, address, port };
  }
, onerror: function (err) {
    // err = { message, family, address, port };
  }
});

var chunk = Packer.pack(address, data, service);
var addr = Packer.socketToAddr(socket);
var id = Packer.addrToId(address);
var id = Packer.socketToId(socket);

var myDuplex = Packer.Stream.create(socketOrStream);

var myTransform = Packer.Transform.create({
  address: {
    family: '...'
  , address: '...'
  , port: '...'
  }
  // hint at the service to be used
, service: 'https'
});
```

# Testing an implementation

If you want to write a compatible packer, just make sure that for any given input
you get the same output as the packer does.

```bash
node test-pack.js input.json output.bin
hexdump output.bin
```

Where `input.json` looks something like this:

`input.json`:
```
{ "version": 1
, "address": {
    "family": "IPv4"
  , "address": "127.0.1.1"
  , "port": 443
  , "service": "foo"
  }
, "filepath": "./sni.tcp.bin"
}
```

Raw TCP SNI Packet
------------------

and `sni.tcp.bin` is any captured tcp packet, such as this one with a tls hello:

`sni.tcp.bin`:
```
         0  1  2  3  4  5  6  7  8  9  A  B  C  D  D  F
0000000 16 03 01 00 c2 01 00 00 be 03 03 57 e3 76 50 66
0000010 03 df 99 76 24 c8 31 e6 e8 08 34 6b b4 7b bb 2c
0000020 f3 17 aa 5c ec 09 da da 83 5a b2 00 00 56 00 ff
0000030 c0 24 c0 23 c0 0a c0 09 c0 08 c0 28 c0 27 c0 14
0000040 c0 13 c0 12 c0 26 c0 25 c0 05 c0 04 c0 03 c0 2a
0000050 c0 29 c0 0f c0 0e c0 0d 00 6b 00 67 00 39 00 33
0000060 00 16 00 3d 00 3c 00 35 00 2f 00 0a c0 07 c0 11
0000070 c0 02 c0 0c 00 05 00 04 00 af 00 ae 00 8d 00 8c
0000080 00 8a 00 8b 01 00 00 3f 00 00 00 19 00 17 00 00
0000090 14 70 6f 6b 65 6d 61 70 2e 68 65 6c 6c 61 62 69
00000a0 74 2e 63 6f 6d 00 0a 00 08 00 06 00 17 00 18 00
00000b0 19 00 0b 00 02 01 00 00 0d 00 0c 00 0a 05 01 04
00000c0 01 02 01 04 03 02 03
00000c7
```

Tunneled TCP SNI Packet
-----------------------

You should see that the result is simply all of the original packet with a leading header.

Note that `16 03 01 00` starts at the 29th byte (at index 28 or 0x1C) instead of at index 0:

```
         0  1  2  3  4  5  6  7  8  9  A  B  C  D  D  F
0000000 fe 1a 49 50 76 34 2c 31 32 37 2e 30 2e 31 2e 31 <-- 0xfe = v1, 0x1a = 26 more bytes for header
0000010 2c 34 34 33 2c 31 39 39 2c 66 6f 6f
                                            16 03 01 00 <-- first 4 bytes of tcp packet
0000020 c2 01 00 00 be 03 03 57 e3 76 50 66 03 df 99 76
0000030 24 c8 31 e6 e8 08 34 6b b4 7b bb 2c f3 17 aa 5c
0000040 ec 09 da da 83 5a b2 00 00 56 00 ff c0 24 c0 23
0000050 c0 0a c0 09 c0 08 c0 28 c0 27 c0 14 c0 13 c0 12
0000060 c0 26 c0 25 c0 05 c0 04 c0 03 c0 2a c0 29 c0 0f
0000070 c0 0e c0 0d 00 6b 00 67 00 39 00 33 00 16 00 3d
0000080 00 3c 00 35 00 2f 00 0a c0 07 c0 11 c0 02 c0 0c
0000090 00 05 00 04 00 af 00 ae 00 8d 00 8c 00 8a 00 8b
00000a0 01 00 00 3f 00 00 00 19 00 17 00 00 14 70 6f 6b
00000b0 65 6d 61 70 2e 68 65 6c 6c 61 62 69 74 2e 63 6f
00000c0 6d 00 0a 00 08 00 06 00 17 00 18 00 19 00 0b 00
00000d0 02 01 00 00 0d 00 0c 00 0a 05 01 04 01 02 01 04
00000e0 03 02 03
00000e3
```