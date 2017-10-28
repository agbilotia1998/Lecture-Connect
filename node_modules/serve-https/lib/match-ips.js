'use strict';

var PromiseA = require('bluebird');

module.exports.match = function (servername, opts) {
  return PromiseA.promisify(require('ipify'))().then(function (externalIp) {
    var dns = PromiseA.promisifyAll(require('dns'));

    opts.externalIps = [ { address: externalIp, family: 'IPv4' } ];
    opts.ifaces = require('./local-ip.js').find({ externals: opts.externalIps });
    opts.externalIfaces = Object.keys(opts.ifaces).reduce(function (all, iname) {
      var iface = opts.ifaces[iname];

      iface.ipv4.forEach(function (addr) {
        if (addr.external) {
          addr.iface = iname;
          all.push(addr);
        }
      });
      iface.ipv6.forEach(function (addr) {
        if (addr.external) {
          addr.iface = iname;
          all.push(addr);
        }
      });

      return all;
    }, []).filter(Boolean);

    function resolveIps(hostname) {
      var allIps = [];

      return PromiseA.all([
        dns.resolve4Async(hostname).then(function (records) {
            records.forEach(function (ip) {
              allIps.push({
                address: ip
              , family: 'IPv4'
              });
            });
          }, function () {})
        , dns.resolve6Async(hostname).then(function (records) {
            records.forEach(function (ip) {
              allIps.push({
                address: ip
              , family: 'IPv6'
              });
            });
          }, function () {})
      ]).then(function () {
        return allIps;
      });
    }

    function resolveIpsAndCnames(hostname) {
      return PromiseA.all([
        resolveIps(hostname)
      , dns.resolveCnameAsync(hostname).then(function (records) {
          return PromiseA.all(records.map(function (hostname) {
            return resolveIps(hostname);
          })).then(function (allIps) {
            return allIps.reduce(function (all, ips) {
              return all.concat(ips);
            }, []);
          });
        }, function () {
          return [];
        })
      ]).then(function (ips) {
        return ips.reduce(function (all, set) {
          return all.concat(set);
        }, []);
      });
    }

    return resolveIpsAndCnames(servername).then(function (allIps) {
      var matchingIps = [];

      if (!allIps.length) {
        console.warn("Could not resolve '" + servername + "'");
      }

      // { address, family }
      allIps.some(function (ip) {
        function match(addr) {
          if (ip.address === addr.address) {
            matchingIps.push(addr);
          }
        }

        opts.externalIps.forEach(match);
        // opts.externalIfaces.forEach(match);

        Object.keys(opts.ifaces).forEach(function (iname) {
          var iface = opts.ifaces[iname];

          iface.ipv4.forEach(match);
          iface.ipv6.forEach(match);
        });

        return matchingIps.length;
      });

      matchingIps.externalIps = {
        ipv4: [
          { address: externalIp
          , family: 'IPv4'
          }
        ]
      , ipv6: [
        ]
      };
      matchingIps.matchingIps = matchingIps;
      return matchingIps;
    });
  });
};
