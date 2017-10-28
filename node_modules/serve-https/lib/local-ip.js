'use strict';

var os = require('os');

module.exports.find = function (opts) {
  opts = opts || {};
  opts.externals = opts.externals || [];

  var ifaceMap = os.networkInterfaces();
  var newMap = {};

  Object.keys(ifaceMap).forEach(function (iname) {
    var ifaces = ifaceMap[iname];

    ifaces = ifaces.filter(function (iface) {
      return opts.externals.some(function (ip) {
        if (ip.address === iface.address) {
          ip.external = true;
          return true;
        }
      }) || (!iface.internal && !/^fe80/.test(iface.address) && !/^[0:]+$/.test(iface.mac));
    });

    if (!ifaces.length) {
      return;
    }

    newMap[iname] = newMap[iname] || { ipv4: [], ipv6: [] };

    ifaces.forEach(function (addr) {
      addr.iface = iname;
      if ('IPv4' === addr.family) {
        newMap[iname].ipv4.push(addr);
      }
      else if ('IPv6' === addr.family) {
        newMap[iname].ipv6.push(addr);
      }
    });
  });

  return newMap;

  /*
https://[2601:681:300:92c0:2477:d58a:d69e:51a0]:8443

  console.log('');

    console.log('');
    console.log(iname);
    console.log(ifaces);
    console.log('');
  */
};
