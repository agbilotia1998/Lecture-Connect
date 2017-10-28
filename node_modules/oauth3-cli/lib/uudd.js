'use strict';

// https://www.novell.com/documentation/extend5/Docs/help/Composer/books/TelnetAppendixB.html

var ENTER = "\u0004";           // 13 // '\u001B[0m'
var CRLF = "\r\n";
var LF = "\n";
var ARROW_UP = '\u001b[A';      // 38
var ARROW_DOWN = '\u001b[B';    // 40
var ARROW_RIGHT = '\u001b[C';   // 39
var ARROW_LEFT = '\u001b[D';    // 37

var code = [
  ['u', 'w', 'i']
, ['u', 'w', 'i']
, ['d', 's', 'k']
, ['d', 's', 'k']
, ['l', 'a', 'j']
, ['r', 'd', 'l']
, ['l', 'a', 'j']
, ['r', 'd', 'l']
, ['b']
, ['a']
, [' ']
];

function checkCodes(state) {
  var nextChars = code[state.codes.length] || [];
  var ch = state.ch;

  switch (ch) {
  case ENTER:
  case CRLF:
  case LF:
    ch = ' ';
    break;
  case ARROW_UP:
    ch = 'w';
    break;
  case ARROW_DOWN:
    ch = 's';
    break;
  case ARROW_LEFT: // TODO handle left
    ch = 'a';
    break;
  case ARROW_RIGHT:
    ch = 'd';
    break;
  default:
    break;
  }

  if (-1 === nextChars.indexOf(ch)) {
    state.codes = '';
    return -1;
  }

  state.codes += ch;
  if (code.length === state.codes.length) {
    return 1;
  }

  return 0;
}

module.exports = checkCodes;
