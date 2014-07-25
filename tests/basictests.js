var assert = require('assert');
var metaphoneindexerFactory = require('../metaphoneindexer');
var split = require('split');
var fs = require('fs');
var idmaker = require('idmaker');
var queue = require('queue-async');
var level = require('level');
require('approvals').mocha(__dirname + '/approvals');


suite('Index metaphones and words', function indexSuite() {
  var numberOfWordsToIndex = 50;

  test('Verify ' + numberOfWordsToIndex + ' words and their metaphones are indexed', 
    function testIndex(testDone) {
      var testInstance = this;

      var dbLocation = 'tests/test' + idmaker.randomId(8) + '.db';
      var indexer = metaphoneindexerFactory({
        dbLocation: dbLocation
      });

      var readStream = fs.createReadStream('cmudict.0.7a-words-only.txt');
      var lineStream = split();
      readStream.pipe(lineStream);
      var wordsProcessed = 0;
      var q = queue();

      lineStream.on('data', function indexWord(word) {
        console.log(word);
        q.defer(indexer.index, word);

        wordsProcessed += 1;
        if (wordsProcessed >= numberOfWordsToIndex) {
          readStream.unpipe();
          lineStream.end();
          q.awaitAll(function closeIndexerAndCheckDb(error) {
            indexer.closeDb(serializeDb);
          });
        }
      });

      function serializeDb(error) {
        assert.ok(!error, error);
        var db = level(dbLocation, {valueEncoding: 'json'});
        // db.getDocObjectStream
        var serializedDb = {};

        db.createReadStream()
          .on('data', function writeDataToObject(data) {
            debugger;
            console.log(data);
            serializedDb[data.key] = data.value;
          })
          .on('error', checkDb)
          .on('end', checkDb);

        function checkDb(error) {
          assert.ok(!error, error);
          testInstance.verifyAsJSON(serializedDb);
          deleteFolderRecursive(dbLocation);
          testDone();
        }
      }
    }
  );
});

// http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      }
      else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

