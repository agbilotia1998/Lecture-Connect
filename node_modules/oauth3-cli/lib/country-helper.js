'use strict';

var colors = require('colors/safe');

// TODO prefer any used state, country, etc
// even if the previous parts of the address are not a perfect match
function findAddress(state, attr) {
  return state.hintAddresses.sort(function (a, b) {
    var aCount = 0;
    var bCount = 0;

    Object.keys(state.hintAddress).forEach(function (key) {
      var v = (state.hintAddress[key] || '').toString().toLowerCase().trim();
      if (new RegExp('^' + v, 'i').test((a[key] || '').toString().toLowerCase().trim())) {
        aCount += 1;
      }
      if (new RegExp('^' + v, 'i').test((b[key] || '').toString().toLowerCase().trim())) {
        bCount += 1;
      }
    });

    return aCount - bCount;
  }).map(function (address) {
    return address[attr];
  });
}

function searchHints(hints, attrs, input, autohint) {
  var key;

  hints = hints.filter(function (hintable) {
    if (Array.isArray(attrs) && attrs.length) {
      return attrs.some(function (_key) {
        //console.log('DEBUG', hintable[key].toString().toLowerCase().indexOf(input), key, hintable[key]);
        if ((input || autohint) && 0 === hintable[_key].toString().toLowerCase().indexOf(input)) {
          key = _key;
          return true;
        }
      });
    }
    return (input || autohint) && 0 === hintable.toLowerCase().indexOf(input);
  });

  if (key && hints[0]) {
    return hints[0][key];
  }

  return hints[0] || '';
}

function getCurPos(hint, input) {
  // { hint: 'John Doe', input 'John' }
  // { hint: 'John Doe', input 'Doe' }
  var start;
  var end;

  start = hint.indexOf(input);
  if (-1 === start) {
    throw new Error("Developer Error (not your fault): '"
      + input + "' has matched '" + hint + "' but the casing wasn't updated."
      + " Please report this bug at https://github.com/Daplie/daplie-tools"
    );
  }
  end = start + input.length;

  return {
    start: start
  , end: end
  , length: input.length
  };
}

function completePrompt(o) {
  var hint = o.hint;
  var input = o.input;
  var pos = getCurPos(hint, input);
  var before = o.hint.substr(0, pos.start);
  var during = o.hint.substr(pos.start, pos.length);
  var after = o.hint.substr(pos.end);
  var complete = '';

  if (before) {
    complete += colors.blue(before);
  }
  if (during) {
    complete += colors.red(during);
  }
  if (after) {
    complete += colors.dim(after);
  }

  return complete;
}

function getCountryHelper(state) {
                      // { hintAddresses, hintAddress }
  var usedCountries = findAddress(state, 'countryCode');
  var hists = usedCountries.map(function (str) {
    return require('./country').matches(str)[0];
  });
  var hint = searchHints(hists, [ 'code', 'name' ], state.input, state.autohint);
  var hintObj;
  var autocomplete;
  var curPos;

  //console.log('DEBUG state.input', state.input);
  //console.log('DEBUG hint', hint);
  //console.log('DEBUG hists', hists);

  hint = hint || state.input;
  while (!hintObj) {
    hintObj = require('./country').matches(hint)[0];
    if (!hintObj) {
      hint = hint.substr(0, hint.length - 1);
    }
  }

  //console.log('DEBUG hint', hint);
  //console.log('DEBUG hintObject.input', hintObj.input);

  // if the previous location hint was CA, but the user has only typed C
  // then we should show the hint for CA, but still allow the user to type differently
  if (hintObj.input.length > state.input.length) {
    hintObj.input = hintObj.input.substr(0, state.input.length);
  }

  //console.log('DEBUG hintObject.input', hintObj.input);

  // { hint, input, code, rank }
  state.input = hintObj.input;
  autocomplete = completePrompt(hintObj);
  curPos = getCurPos(hintObj.hint, state.input);

  return {
    autocomplete: autocomplete
  , position: curPos.end
  , code: hintObj.code
  };
}

module.exports.findAddress = findAddress;
module.exports.getCountryHelper = getCountryHelper;

if (require.main === module) {
  var data = getCountryHelper({
    input: 'irat' // emm, c, ca, cad, can, cana
  , hintAddress: { countryCode: 'CA' }
  , hintAddresses: [ { countryCode: 'CA' } ]
  });

  console.log('Country: ', data.autocomplete);
}
