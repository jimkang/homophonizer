var doublemetaphone = require('double-metaphone');
var split = require('split');
var fs = require('fs');

var wordlistfilelocation = process.argv[2];
var limit;

if (process.argv.length > 3) {
  limit = process.argv[3];
}

var wordsProcessed = 0;

var readStream = fs.createReadStream(wordlistfilelocation);
var lineStream = split();

readStream
  .pipe(lineStream)
  .on('data', function processLine(word) {
    if (word.length > 0) {
      console.log(doublemetaphone(word));
      wordsProcessed += 1;
      if (limit && wordsProcessed > limit) {
        readStream.unpipe();
        lineStream.end();
      }
    }
  });

