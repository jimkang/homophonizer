var assert = require('assert');
var metaphoneindexerFactory = require('../metaphone/metaphoneindexer');
var split = require('split');
var fs = require('fs');
var idmaker = require('idmaker');
var queue = require('queue-async');
var level = require('level');
var homophonizerFactory = require('../metaphone/metaphonehomophonizer');

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

      var readStream = fs.createReadStream('metaphone/cmudict.0.7a-words-only.txt');
      var lineStream = split();
      readStream.pipe(lineStream);
      var wordsProcessed = 0;
      var q = queue();

      lineStream.on('data', function indexWord(word) {
        if (!word) {
          return;
        }

        q.defer(indexer.index, word);

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
        var db = level(dbLocation, {valueEncoding: 'json'});
        // db.getDocObjectStream
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

// Requires a full metaphone DB to be built.
suite('Find homophones', function findHomophonesSuite() {
  var homophonizer;

  beforeEach(function createHomophonizer() {
    homophonizer = homophonizerFactory({
      dbLocation: './metaphone/metaphone.db'
    });
  });

  afterEach(function closeHomophonizer(testDone) {
    homophonizer.shutdown(testDone);
    homophonizer = null;
  });

  test('Verify that an error is returned if homophonizer can\'t find the word', 
    function testMissing(testDone) {
      homophonizer.getHomophones('sdfwerfsdfsd', 
        function checkHomophones(error, homophones) {
          assert.ok(error, 'Should have returned an error.');
          testDone();
        }
      );
    }
  );

  test('Verify that homophones can be found for WALK', 
    function testWhatever(testDone) {
      homophonizer.getHomophones('WALK', 
        function checkHomophones(error, homophones) {
          assert.ok(!error, error);

          assert.ok(homophones.primary.indexOf('WALCK') !== -1);
          assert.ok(homophones.primary.indexOf('YOLK') !== -1);

          assert.ok(homophones.secondary.indexOf('FOLK') !== -1);
          assert.ok(homophones.secondary.indexOf('WELK') !== -1);

          testDone();
        }
      );
    }
  );

  test('Verify that homophones can be found for (lowercase) walk', 
    function testWhatever(testDone) {
      homophonizer.getHomophones('walk', 
        function checkHomophones(error, homophones) {
          assert.ok(!error, error);
          assert.ok(homophones.primary.indexOf('WALCK') !== -1);
          assert.ok(homophones.primary.indexOf('YOLK') !== -1);

          assert.ok(homophones.secondary.indexOf('FOLK') !== -1);
          assert.ok(homophones.secondary.indexOf('WELK') !== -1);
          testDone();
        }
      );
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

