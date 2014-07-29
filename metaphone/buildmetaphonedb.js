var metaphoneindexerFactory = require('./metaphoneindexer');
var split = require('split');
var fs = require('fs');

if (process.argv.length < 4) {
  process.stderr.write('Usage: node buildmetaphonedb.js <line-separated word list file> <db location>');
  process.exit();
}

var wordlistLocation = process.argv[2];
var dbLocation = process.argv[3];

var indexer = metaphoneindexerFactory({
  dbLocation: dbLocation
});

var readStream = fs.createReadStream(wordlistLocation);
var lineStream = split();
readStream.pipe(lineStream);

function noOp() {
}

lineStream.on('data', function indexWord(word) {
  indexer.index(word, noOp);
});


