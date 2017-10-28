'use strict';

var PromiseA = require('bluebird');
var cli = require('./cli').create(process.stdin, process.stdout);

cli.ask("Enter an oauth3-enabled URL: ", cli.inputs.url).then(function (/*obj*/) {
  cli.ask("Enter your email address: ", cli.inputs.email).then(function (/*obj*/) {
    // TODO auto-clear line below
    //ws.cursorTo(0);
    cli.ws.clearLine(); // person just hit enter, they are on the next line
    cli.ws.write('\n');
    cli.ws.write('Check your email. You should receive a login code.\n');
    return cli.ask("Enter your auth code: ", {
      onReturnAsync: function (rrs, ws, str) {
        if (!/-/.test(str)) {
          return PromiseA.reject(new Error("[X] That doesn't look like a login code."));
        }
        return PromiseA.resolve();
      }
    }).then(function (obj) {
      console.log(obj);
    });
  });
});
