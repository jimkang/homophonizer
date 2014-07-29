var doublemetaphone = require('double-metaphone');
var split = require('split');
var fs = require('fs');

var word = process.argv[2];

if (word.length > 0) {
  console.log(doublemetaphone(word));
}
