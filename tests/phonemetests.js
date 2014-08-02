var assert = require('assert');
var phonemeindexerFactory = require('../phoneme/phonemeindexer');
var split = require('split');
var fs = require('fs');
var idmaker = require('idmaker');
var queue = require('queue-async');
var level = require('level');
var homophonizerFactory = require('../phoneme/phonemehomophonizer');
var phonemeNavigator = require('../phoneme/phonemeNavigator');

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

// // Requires a full phoneme DB to be built.
suite('Find homophones', function findHomophonesSuite() {
  var homophonizer;

  beforeEach(function createHomophonizer() {
    homophonizer = homophonizerFactory({
      dbLocation: './phoneme/phoneme.db'
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
          assert.ok(homophones.indexOf('WALKE') !== -1);
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
          assert.ok(homophones.indexOf('WALKE') !== -1);
          testDone();
        }
      );
    }
  );

  test('Verify that crossArrays generates all permutations of two arrays', 
    function testCrossArrays() {
      assert.deepEqual(
        homophonizer.crossArrays(['a', 'b', 'c'], [1, 2, 3, 4]),
        [
          [ 'a', 1 ],
          [ 'a', 2 ],
          [ 'a', 3 ],
          [ 'a', 4 ],
          [ 'b', 1 ],
          [ 'b', 2 ],
          [ 'b', 3 ],
          [ 'b', 4 ],
          [ 'c', 1 ],
          [ 'c', 2 ],
          [ 'c', 3 ],
          [ 'c', 4 ]
        ]
      );
    }
  );

  test('Verify that crossArrays generates all permutations of four arrays', 
    function testCrossArrays() {
      var arrays = [
        ['a', 'b', 'c'], 
        [1, 2, 3, 4],
        ['x'],
        ['ß', '∑', '∂', '¢']
      ];

      var combos = arrays.slice(1).reduce(homophonizer.crossArrays, arrays[0]);
      assert.equal(combos.length, 
        arrays[0].length * arrays[1].length * arrays[2].length * arrays[3].length 
      );
    }
  );


  test('Verify that simple variants of a phoneme sequence can be found for cellar',
    function testSimplePhonemeVariants() {
      var sequence = ['S', 'EH', 'L', 'ER'];
      var positionsToVary = [0, 1, 2, 3];
      var variants = homophonizer.getSimplePhonemeVariants(
        sequence, positionsToVary
      );

      var numberOfPossibilities = positionsToVary.reduce(
        function addPhonemesInSameClass(sum, position) {
          var phoneme = sequence[position];
          var permutationsForPosition = phonemeNavigator
            .getPhonemesInSameClass(phoneme).length;
          return permutationsForPosition + sum;
        },
        0
      );
      assert.equal(variants.length, numberOfPossibilities);
    }
  );


  test('Verify that variants of a phoneme sequence can be found for obsequious',
    function testPhonemeVariants() {
      var sequence = ['AH0', 'B', 'S', 'IY1', 'K', 'W', 'IY0', 'AH0', 'S'].map(
          phonemeNavigator.stripStressor
        );
      var positionsToVary = [0, 4, 5, 8];
      var variants = homophonizer.getAllPhonemeVariantCombinations(
        sequence, positionsToVary
      );

      var numberOfPossibilities = positionsToVary.reduce(
        function multiplyByPhonemesInSameClass(product, position) {
          var phoneme = sequence[position];
          var permutationsForPosition = phonemeNavigator
            .getPhonemesInSameClass(phoneme).length;
          return permutationsForPosition * product;
        },
        1
      );
      assert.equal(variants.length, numberOfPossibilities);
    }
  );

  test('Verify that one-phoneme-altered homophones can be found for cellar', 
    function testPhonemeFirstPhonemeSwapped(testDone) {
      homophonizer.getImperfectHomophones({
          word: 'cellar',
          varianceAtPhonemePositions: [0]
        }, 
        function checkHomophones(error, homophones) {
          assert.ok(!error, error);
          assert.deepEqual(homophones, [
            'FELLER', 'SHELLER', 'SHELOR', 'ZELLER'
          ]);
          testDone();
        }
      );
    }
  );

  test('Verify that variance-at-all-positions homophones can be found for scanner', 
    function testPhonemeAllPhonemesSwapped(testDone) {
      homophonizer.getImperfectHomophones({
          word: 'scanner',
          varianceAtPhonemePositions: [0, 1, 2, 3, 4]
        }, 
        function checkHomophones(error, homophones) {
          assert.ok(!error, error);
          console.log(homophones);
          assert.deepEqual(homophones, 
            ['SPANNER', 'SKINNER', 'SCHOONER', 'SCAMMER']
          );
          testDone();
        }
      );
    }
  );

});

suite('Phoneme navigator', function navigatorSuite() {
  suite('Phoneme classifcation', function classificationSuite() {
    function checkClassifyPhoneme(phoneme, expectedClassification) {
      assert.equal(phonemeNavigator.classifyPhoneme(phoneme), 
        expectedClassification
      );
    }

    test('Verify that that phonemes are identified as vowels', 
      function vowelTest() {
        checkClassifyPhoneme('AA', 'vowel');
        checkClassifyPhoneme('AE', 'vowel');
        checkClassifyPhoneme('AH', 'vowel');
        checkClassifyPhoneme('AO', 'vowel');
        checkClassifyPhoneme('AW', 'vowel');
        checkClassifyPhoneme('EY', 'vowel');
        checkClassifyPhoneme('IY', 'vowel');
        checkClassifyPhoneme('UH', 'vowel');
        checkClassifyPhoneme('UW', 'vowel');
      }
    );

    test('Verify that that phonemes are identified as affricates', 
      function affricateTest() {
        checkClassifyPhoneme('CH', 'affricate');
        checkClassifyPhoneme('JH', 'affricate');
      }
    );

    test('Verify that that phonemes are identified as aspirates', 
      function aspirateTest() {
        checkClassifyPhoneme('HH', 'aspirate');
      }
    );

    test('Verify that that phonemes are identified as fricatives', 
      function fricativeTest() {
        checkClassifyPhoneme('DH', 'fricative');
        checkClassifyPhoneme('F', 'fricative');
        checkClassifyPhoneme('S', 'fricative');
        checkClassifyPhoneme('SH', 'fricative');
        checkClassifyPhoneme('TH', 'fricative');
        checkClassifyPhoneme('V', 'fricative');
        checkClassifyPhoneme('Z', 'fricative');
        checkClassifyPhoneme('ZH', 'fricative');
      }
    );

    test('Verify that that phonemes are identified as liquids', 
      function liquidTest() {
        checkClassifyPhoneme('L', 'liquid');
        checkClassifyPhoneme('R', 'liquid');
      }
    );

    test('Verify that that phonemes are identified as nasals', 
      function nasalTest() {
        checkClassifyPhoneme('M', 'nasal');
        checkClassifyPhoneme('N', 'nasal');
        checkClassifyPhoneme('NG', 'nasal');
      }
    );

    test('Verify that that phonemes are identified as semivowels', 
      function semivowelTest() {
        checkClassifyPhoneme('W', 'semivowel');
        checkClassifyPhoneme('Y', 'semivowel');
      }
    );

    test('Verify that that phonemes are identified as stops', 
      function stopTest() {
        checkClassifyPhoneme('B', 'stop');
        checkClassifyPhoneme('D', 'stop');
        checkClassifyPhoneme('G', 'stop');
        checkClassifyPhoneme('K', 'stop');
        checkClassifyPhoneme('P', 'stop');
        checkClassifyPhoneme('T', 'stop');
      }
    );
  });

  suite('Related phonemes', function relatedSuite() {
    test('Verify that related phonemes are found for a vowel', 
      function testRelatedVowels() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('AY'),
          [
            'AA',
            'AE',
            'AH',
            'AO',
            'AW',
            'EH',
            'ER',
            'EY',
            'IH',
            'IY',
            'OW',
            'OY',
            'UH',
            'UW'
          ]
        );
      }
    );

    test('Verify that related phonemes are found for an affricate', 
      function testRelatedAffricates() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('JH'),
          ['CH']
        );
      }
    );

    test('Verify that related phonemes are found for an aspirate', 
      function testRelated() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('HH'),
          []
        );
      }
    );

    test('Verify that related phonemes are found for a fricative', 
      function testRelatedFricatives() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('V'),
          [
            'DH',
            'F',
            'S',
            'SH',
            'TH',
            'Z',
            'ZH'
          ]
        );
      }
    );

    test('Verify that related phonemes are found for a liquid', 
      function testRelatedLiquid() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('L'),
          ['R']
        );
      }
    );

    test('Verify that related phonemes are found for a nasal', 
      function testRelatedNasals() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('N'),
          ['M', 'NG']
        );
      }
    );

    test('Verify that related phonemes are found for a semivowel', 
      function testRelatedSemivowels() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('Y'),
          ['W']
        );
      }
    );

    test('Verify that related phonemes are found for a stop', 
      function testRelatedStops() {
        assert.deepEqual(
          phonemeNavigator.getPhonemesInSameClass('T'),
          [
            'B',
            'D',
            'G',
            'K',
            'P'
          ]
        );
      }
    );
  });

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

