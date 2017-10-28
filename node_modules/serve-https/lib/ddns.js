'use strict';

module.exports.create = function (opts) {
  var PromiseA = opts.PromiseA;
  var dns = PromiseA.promisifyAll(require('dns'));

  return PromiseA.all([
    dns.resolve4Async(opts._old_server_name).then(function (results) {
      return results;
    }, function () {})
  , dns.resolve6Async(opts._old_server_name).then(function (results) {
      return results;
    }, function () {})
  ]).then(function (results) {
    var ipv4 = results[0] || [];
    var ipv6 = results[1] || [];
    var record;

    opts.dnsRecords = {
      A: ipv4
    , AAAA: ipv6
    };

    Object.keys(opts.ifaces).some(function (ifacename) {
      var iface = opts.ifaces[ifacename];

      return iface.ipv4.some(function (localIp) {
        return ipv4.some(function (remoteIp) {
          if (localIp.address === remoteIp) {
            record = localIp;
            return record;
          }
        });
      }) || iface.ipv6.some(function (localIp) {
        return ipv6.forEach(function (remoteIp) {
          if (localIp.address === remoteIp) {
            record = localIp;
            return record;
          }
        });
      });
    });

    if (!record) {
      console.info("DNS Record '" + ipv4.concat(ipv6).join(',') + "' does not match any local IP address.");
      console.info("Use --ddns to allow the people of the Internet to access your server.");
    }

    opts.externalIps.ipv4.some(function (localIp) {
      return ipv4.some(function (remoteIp) {
        if (localIp.address === remoteIp) {
          record = localIp;
          return record;
        }
      });
    });

    opts.externalIps.ipv6.some(function (localIp) {
      return ipv6.some(function (remoteIp) {
        if (localIp.address === remoteIp) {
          record = localIp;
          return record;
        }
      });
    });

    if (!record) {
      console.info("DNS Record '" + ipv4.concat(ipv6).join(',') + "' does not match any local IP address.");
      console.info("Use --ddns to allow the people of the Internet to access your server.");
    }
  });
};

if (require.main === module) {
  var opts = {
    _old_server_name: 'aj.daplie.me'
  , PromiseA: require('bluebird')
  };
  // ifaces
  opts.ifaces = require('./local-ip.js').find();
  console.log('opts.ifaces');
  console.log(opts.ifaces);
  require('./match-ips.js').match(opts._old_server_name, opts).then(function (ips) {
    opts.matchingIps = ips.matchingIps || [];
    opts.externalIps = ips.externalIps;
    module.exports.create(opts);
  });
}
