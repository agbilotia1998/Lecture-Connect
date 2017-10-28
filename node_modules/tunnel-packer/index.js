'use strict';

var Packer = module.exports;

var serviceEvents = {
  default: 'tunnelData'
, control: 'tunnelControl'
, error:   'tunnelError'
, end:     'tunnelEnd'
, pause:   'tunnelPause'
, resume:  'tunnelResume'
};
var serviceFuncs = {
  default: 'onmessage'
, control: 'oncontrol'
, error:   'onerror'
, end:     'onend'
, pause:   'onpause'
, resume:  'onresume'
};

Packer.create = function (opts) {
  var machine;

  if (!opts.onMessage && !opts.onmessage) {
    machine = new (require('events').EventEmitter)();
  } else {
    machine = {};
  }

  machine.onmessage = opts.onmessage || opts.onMessage;
  machine.oncontrol = opts.oncontrol || opts.onControl;
  machine.onerror   = opts.onerror   || opts.onError;
  machine.onend     = opts.onend     || opts.onEnd;
  machine.onpause   = opts.onpause   || opts.onPause;
  machine.onresume  = opts.onresume  || opts.onResume;

  machine._version = 1;
  machine.fns = {};

  machine.chunkIndex = 0;
  machine.buf = null;
  machine.bufIndex = 0;
  machine.fns.collectData = function (chunk, size) {
    var chunkLeft = chunk.length - machine.chunkIndex;

    if (size <= 0) {
      return Buffer.alloc(0);
    }

    // First handle case where we don't have all the data we need yet. We need to save
    // what we have in a buffer, and increment the index for both the buffer and the chunk.
    if (machine.bufIndex + chunkLeft < size) {
      if (!machine.buf) {
        machine.buf = Buffer.alloc(size);
      }
      chunk.copy(machine.buf, machine.bufIndex, machine.chunkIndex);
      machine.bufIndex += chunkLeft;
      machine.chunkIndex += chunkLeft;

      return null;
    }

    // Read and mark as read however much data we need from the chunk to complete our buffer.
    var partLen = size - machine.bufIndex;
    var part = chunk.slice(machine.chunkIndex, machine.chunkIndex+partLen);
    machine.chunkIndex += partLen;

    // If we had nothing buffered than the part of the chunk we just read is all we need.
    if (!machine.buf) {
      return part;
    }

    // Otherwise we need to copy the new data into the buffer.
    part.copy(machine.buf, machine.bufIndex);
    // Before returning the buffer we need to clear our reference to it.
    var buf = machine.buf;
    machine.buf = null;
    machine.bufIndex = 0;
    return buf;
  };

  machine.fns.version = function (chunk) {
    //console.log('');
    //console.log('[version]');
    if ((255 - machine._version) !== chunk[machine.chunkIndex]) {
      console.error("not v" + machine._version + " (or data is corrupt)");
      // no idea how to fix this yet
    }
    machine.chunkIndex += 1;

    return true;
  };


  machine.headerLen = 0;
  machine.fns.headerLength = function (chunk) {
    //console.log('');
    //console.log('[headerLength]');
    machine.headerLen = chunk[machine.chunkIndex];
    machine.chunkIndex += 1;

    return true;
  };

  machine.fns.header = function (chunk) {
    //console.log('');
    //console.log('[header]');
    var header = machine.fns.collectData(chunk, machine.headerLen);

    // We don't have the entire header yet so return false.
    if (!header) {
      return false;
    }

    machine._headers = header.toString().split(/,/g);

    machine.family  = machine._headers[0];
    machine.address = machine._headers[1];
    machine.port    = machine._headers[2];
    machine.bodyLen = parseInt(machine._headers[3], 10) || 0;
    machine.service = machine._headers[4];
    //console.log('machine.service', machine.service);

    return true;
  };

  machine.fns.data = function (chunk) {
    //console.log('');
    //console.log('[data]');
    var data = machine.fns.collectData(chunk, machine.bodyLen);

    // We don't have the entire body yet so return false.
    if (!data) {
      return false;
    }

    //
    // data, end, error
    //
    var msg = {};
    if ('error' === machine.service) {
      try {
        msg = JSON.parse(data.toString());
      } catch(e) {
        msg.message = data.toString();
        msg.code = 'E_UNKNOWN_ERR';
      }
    }

    msg.family  = machine.family;
    msg.address = machine.address;
    msg.port    = machine.port;
    msg.service = machine.service;
    msg.data    = data;

    if (machine.emit) {
      machine.emit(serviceEvents[msg.service] || serviceEvents.default);
    } else {
      (machine[serviceFuncs[msg.service]] || machine[serviceFuncs.default])(msg);
    }

    return true;
  };

  machine.state = 0;
  machine.states = ['version', 'headerLength', 'header', 'data'];
  machine.fns.addChunk = function (chunk) {
    //console.log('');
    //console.log('[addChunk]');
    machine.chunkIndex = 0;
    while (machine.chunkIndex < chunk.length) {
      //console.log('chunkIndex:', machine.chunkIndex, 'state:', machine.state);

      if (true === machine.fns[machine.states[machine.state]](chunk)) {
        machine.state += 1;
        machine.state %= machine.states.length;
      }
    }
  };

  return machine;
};

Packer.pack = function (address, data, service) {
  data = data || Buffer.from(' ');
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(JSON.stringify(data));
  }
  if (!data.byteLength) {
    data = Buffer.from(' ');
  }

  if (service && service !== 'control') {
    address.service = service;
  }

  var version = 1;
  var header;
  if (service === 'control') {
    header = Buffer.from(['', '', '', data.byteLength, service].join(','));
  }
  else {
    header = Buffer.from([
      address.family, address.address, address.port, data.byteLength, (address.service || '')
    ].join(','));
  }
  var meta = Buffer.from([ 255 - version, header.length ]);
  var buf = Buffer.alloc(meta.byteLength + header.byteLength + data.byteLength);

  meta.copy(buf, 0);
  header.copy(buf, 2);
  data.copy(buf, 2 + header.byteLength);

  return buf;
};

function extractSocketProp(socket, propName) {
  // remoteAddress, remotePort... ugh... https://github.com/nodejs/node/issues/8854
  var value = socket[propName] || socket['_' + propName];
  try {
    value = value || socket._handle._parent.owner.stream[propName];
  } catch (e) {}

  try {
    value = value || socket._handle._parentWrap[propName];
    value = value || socket._handle._parentWrap._handle.owner.stream[propName];
  } catch (e) {}

  return value || '';
}
Packer.socketToAddr = function (socket) {
  // TODO BUG XXX
  // https://github.com/nodejs/node/issues/8854
  // tlsSocket.remoteAddress = remoteAddress; // causes core dump
  // console.log(tlsSocket.remoteAddress);

  return {
    family:  extractSocketProp(socket, 'remoteFamily')
  , address: extractSocketProp(socket, 'remoteAddress')
  , port:    extractSocketProp(socket, 'remotePort')
  };
};

Packer.addrToId = function (address) {
  return address.family + ',' + address.address + ',' + address.port;
};

Packer.socketToId = function (socket) {
  return Packer.addrToId(Packer.socketToAddr(socket));
};


var addressNames = [
  'remoteAddress'
, 'remotePort'
, 'remoteFamily'
, 'localAddress'
, 'localPort'
];
var sockFuncs = [
  'address'
, 'destroy'
, 'ref'
, 'unref'
, 'setEncoding'
, 'setKeepAlive'
, 'setNoDelay'
, 'setTimeout'
];
// Improved workaround for  https://github.com/nodejs/node/issues/8854
// Unlike Packer.Stream.create this should handle all of the events needed to make everything work.
Packer.wrapSocket = function (socket) {
  var myDuplex = new require('stream').Duplex();
  addressNames.forEach(function (name) {
    myDuplex[name] = extractSocketProp(socket, name);
  });

  // Handle everything needed for the write part of the Duplex. We need to overwrite the
  // `end` function because there is no other way to know when the other side calls it.
  myDuplex._write = socket.write.bind(socket);
  myDuplex.end = socket.end.bind(socket);

  // Handle everything needed for the read part of the Duplex. See the example under
  // https://nodejs.org/api/stream.html#stream_readable_push_chunk_encoding.
  myDuplex._read = function () {
    socket.resume();
  };
  socket.on('data', function (chunk) {
    if (!myDuplex.push(chunk)) {
      socket.pause();
    }
  });
  socket.on('end', function () {
    myDuplex.push(null);
  });

  // Handle the the things not directly related to reading or writing
  socket.on('error', function (err) {
    console.error('[error] wrapped socket errored - ' + err.toString());
    myDuplex.emit('error', err);
  });
  socket.on('close', function () {
    myDuplex.emit('close');
  });
  sockFuncs.forEach(function (name) {
    if (typeof socket[name] !== 'function') {
      console.warn('expected `'+name+'` to be a function on wrapped socket');
    } else {
      myDuplex[name] = socket[name].bind(socket);
    }
  });

  return myDuplex;
};

var Transform = require('stream').Transform;
var util = require('util');

function MyTransform(options) {
  if (!(this instanceof MyTransform)) {
    return new MyTransform(options);
  }
  this.__my_addr = options.address;
  this.__my_service = options.service;
  Transform.call(this, options);
}
util.inherits(MyTransform, Transform);

MyTransform.prototype._transform = function (data, encoding, callback) {
  var address = this.__my_addr;

  address.service = address.service || this.__my_service;
  this.push(Packer.pack(address, data));
  callback();
};

Packer.Stream = {};
var Dup = {
  write: function (chunk, encoding, cb) {
    //console.log('_write', chunk.byteLength);
    this.__my_socket.write(chunk, encoding, cb);
  }
, read: function (size) {
    //console.log('_read');
    var x = this.__my_socket.read(size);
    if (x) {
      console.log('_read', size);
      this.push(x);
    }
  }
};
Packer.Stream.create = function (socket) {
  if (!Packer.Stream.warned) {
    console.warn('`Stream.create` deprecated, use `wrapSocket` instead');
    Packer.Stream.warned = true;
  }

  // Workaround for
  // https://github.com/nodejs/node/issues/8854

  // https://www.google.com/#q=get+socket+address+from+file+descriptor
  // TODO try creating a new net.Socket({ handle: socket._handle, fd: socket._handle.fd })
  // from the old one and then adding back the data with
  // sock.push(firstChunk)
  var Duplex = require('stream').Duplex;
  var myDuplex = new Duplex();

  myDuplex.__my_socket = socket;
  myDuplex._write = Dup.write;
  myDuplex._read = Dup.read;
  //console.log('plainSocket.*Address');
  //console.log('remote:', socket.remoteAddress);
  //console.log('local:', socket.localAddress);
  //console.log('address():', socket.address());
  myDuplex.remoteFamily = socket.remoteFamily;
  myDuplex.remoteAddress = socket.remoteAddress;
  myDuplex.remotePort = socket.remotePort;
  myDuplex.localFamily = socket.localFamily;
  myDuplex.localAddress = socket.localAddress;
  myDuplex.localPort = socket.localPort;

  return myDuplex;
};

Packer.Transform = {};
Packer.Transform.create = function (opts) {
  // Note: service refers to the port that the incoming request was from,
  // if known (smtps, smtp, https, http, etc)
  // { address: '127.0.0.1', service: 'https' }
  return new MyTransform(opts);
};
