var assert = require('assert');
var homophonizerFactory = require('../phoneme/phonemehomophonizer');
var phonemeNavigator = require('../phoneme/phonemeNavigator');

// Requires a full phoneme DB to be built.
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
          varyPhonemesAtPositions: [0]
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
          varyPhonemesAtPositions: [0, 1, 2, 3, 4]
        }, 
        function checkHomophones(error, homophones) {
          assert.ok(!error, error);
          assert.deepEqual(homophones, 
            ['SPANNER', 'SKINNER', 'SCHOONER', 'SCAMMER']
          );
          testDone();
        }
      );
    }
  );

});
