var assert = require('assert');
var phonemeindexerFactory = require('../phoneme/phonemeindexer');
var split = require('split');
var fs = require('fs');
var idmaker = require('idmaker');
var queue = require('queue-async');
var level = require('level');
var homophonizerFactory = require('../phoneme/phonemehomophonizer');

require('approvals')
  .configure({errorOnStaleApprovedFiles: false})
  .mocha(__dirname + '/approvals');

suite('Index phonemes and words', function indexSuite() {
  var numberOfWordsToIndex = 100;

  test('Verify ' + numberOfWordsToIndex + ' words and their phonemes are indexed', 
    function testIndex(testDone) {
      var testInstance = this;

      var dbLocation = 'tests/test' + idmaker.randomId(8) + '.db';
      var indexer = phonemeindexerFactory({
        dbLocation: dbLocation
      });

      var readStream = fs.createReadStream('phoneme/cmudict.0.7a');
      var lineStream = split();
      readStream.pipe(lineStream);
      var wordsProcessed = 0;
      var q = queue();

      lineStream.on('data', function indexWord(line) {
        if (!line || line.indexOf(';;;') === 0) {
          return;
        }
        var pieces = line.split('  ');
        if (pieces.length < 2) {
          return;
        }
        var word = pieces[0];
        var phonemeString = pieces[1];

        q.defer(indexer.index, word, phonemeString);

        wordsProcessed += 1;
        if (wordsProcessed >= numberOfWordsToIndex) {
          readStream.unpipe();
          lineStream.end();
          q.awaitAll(function closeIndexerAndCheckDb(error) {
            assert.ok(!error, error);
            indexer.closeDb(serializeDb);
          });
        }
      });

      function serializeDb(error) {
        assert.ok(!error, error);
        var db = level(dbLocation);
        var serializedDb = {};

        db.createReadStream()
          .on('data', function writeDataToObject(data) {
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

