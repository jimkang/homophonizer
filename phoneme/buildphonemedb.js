var phonemeindexerFactory = require('./phonemeindexer');
var split = require('split');
var fs = require('fs');

if (process.argv.length < 4) {
  process.stderr.write('Usage: node buildphonemedb.js <line-separated word and phoneme list file> <db location>');
  process.exit();
}

var wordlistLocation = process.argv[2];
var dbLocation = process.argv[3];

var indexer = phonemeindexerFactory({
  dbLocation: dbLocation
});

var readStream = fs.createReadStream(wordlistLocation);
var lineStream = split();
readStream.pipe(lineStream);

function noOp() {
}

lineStream.on('data', function indexLine(line) {
  if (!line || line.indexOf(';;;') === 0) {
    return;
  }
  var pieces = line.split('  ');
  if (pieces.length < 2) {
    return;
  }

  var word = pieces[0];
  var phonemeString = pieces[1];

  indexer.index(word, phonemeString, noOp);
});
