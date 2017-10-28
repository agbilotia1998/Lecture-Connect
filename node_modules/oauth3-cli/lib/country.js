'use strict';

var countries = require('country-data').countries.all;
var escapeRe = require('escape-string-regexp');

/*
alpha2: 'ZW',
alpha3: 'ZWE',
countryCallingCodes: [ '+263' ],
currencies: [ 'USD', 'ZAR', 'BWP', 'GBP', 'EUR' ],
ioc: 'ZIM',
languages: [ 'eng', 'sna', 'nde' ],
name: 'Zimbabwe',
status: 'assigned' }
*/
module.exports.matches = function (input) {
	input = input || '';
	var data = JSON.parse(JSON.stringify(countries));
	var unput = input.toUpperCase();
	var ilput = input.toLowerCase();
	var hints = data.filter(function (country) {
		if (country.alpha2) {
			if (0 === country.alpha2.indexOf(unput)) {
				return true;
			}
		}
		if (country.alpha3) {
			if (0 === country.alpha3.indexOf(unput)) {
				return true;
			}
		}
		if (country.name.toLowerCase().match(ilput)) {
			return true;
		}
	}).map(function (country) {
		// TODO give higher priority if input in full-uppercase match for 2- and 3- char codes
		country.rank = 0;
		if (country.alpha3) {
			if (0 === country.alpha3.indexOf(unput)) {
				country.rank += 100;
				if (country.alpha3 === unput) {
					country.rank += 10000;
				}
			}
			if (input === unput) {
				country.rank += 2;
			}
		}

		if (country.alpha2) {
			if (0 === country.alpha2.indexOf(unput)) {
				country.rank += 100;
				if (country.alpha2 === unput) {
					country.rank += 1000;
				}
			}
			if (input === unput) {
				country.rank += 2;
			}
		}

		if (country.name.toLowerCase().match(ilput)) {
			country.rank += 100;
			if (0 === country.name.toLowerCase().indexOf(ilput)) {
				country.rank += 100;
				if (country.name === unput) {
					country.rank += 100000;
				}
			}

			if (0 === country.name.indexOf(input)) {
				country.rank += 3;
			}
			else if (input[0] === unput[0] && country.name.match(input)) {
				country.rank += 2;
			}
		}

		// TODO +1s to countries where our customers are based on stats
		var customerCountries = [ 'US', 'CA', 'MX', 'GB', 'UK' ];
		var index = customerCountries.indexOf(country.alpha2);
		if (-1 !== index) {
			country.rank += (customerCountries.length - index);
		}

    return country;
	}).sort(function (a, b) {
		return b.rank - a.rank;
	}).slice(0, 5).map(function (country) {
		if (country.alpha3 === unput) {
			return {
				hint: country.alpha3 + ' - ' + country.name
			, input: unput
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

		if (country.alpha2 === unput) {
			return {
				hint: country.alpha2 + ' - ' + country.name
			, input: unput
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

		if (country.name.toLowerCase() === ilput) {
			return {
				hint: country.name + ' (' + (country.alpha3 || country.alpha2) + ') '
			, input: country.name
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

		if (country.alpha3 && 0 === country.alpha3.indexOf(unput)) {
			return {
				hint: country.alpha3 + ' - ' + country.name
			, input: unput
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

		if (country.alpha2 && 0 === country.alpha2.indexOf(unput)) {
			return {
				hint: country.alpha2 + ' - ' + country.name
			, input: unput
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

		if (0 === country.name.toLowerCase().indexOf(ilput)) {
			return {
				hint: country.name + ' (' + (country.alpha2 || country.alpha3) + ') '
			, input: country.name.substr(0, input.length)
			, code: country.alpha2 || country.alpha3
      , rank: country.rank
      , name: country.name
			};
		}

    // em -> United Arab Emirates -> Em
    input = country.name.match(new RegExp(escapeRe(input), 'i'))[0];
		return {
			hint: country.name + ' (' + (country.alpha2 || country.alpha3) + ') '
		, input: input
		, code: country.alpha2 || country.alpha3
    , rank: country.rank
    , name: country.name
		};
	});

  return hints;
};

//module.exports.getHints('Un');
// module.exports.getHints('un');
// module.exports.getHints('us');
// module.exports.getHints('cana');
// module.exports.getHints('can');
// module.exports.getHints('ca');
//module.exports.getHints('c');
//module.exports.getHints('un');
