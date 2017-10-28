'use strict';

var tldHints = require('./lib/tld-hints');

//var state = { input: '', prompt: 'Search Domain > ' };
//var state = { input: 'coolaj86', prompt: 'Search> ' };
//var state = { input: 'coolaj86.', prompt: 'Search> ' };
var state = { input: 'coolaj86.c', prompt: 'Search> ' };
//var state = { input: 'coolaj86.co', prompt: 'Search> ' };   // exact match
//var state = { input: 'coolaj86.com', prompt: 'Search> ' };
//var state = { input: 'coolaj86.comp', prompt: 'Search> ' };
//var state = { input: 'coolaj86.compa', prompt: 'Search> ' };
//var state = { input: 'coolaj86.cou', prompt: 'Search> ', width: 110 };
//var state = { input: 'coolaj86.cxtzmmr', prompt: 'Search> ', width: 110 };
//var state = { input: 'coolaj86.xyz', prompt: 'Search> ', width: 110 };
console.log(state.input);
var tlds = tldHints.format(state);
console.log(state.prompt + tlds.complete);
console.log(state.input);
