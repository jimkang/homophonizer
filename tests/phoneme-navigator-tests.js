var assert = require('assert');
var homophonizerFactory = require('../phoneme/phonemehomophonizer');

suite('Phoneme navigator', function navigatorSuite() {
  test('Verify that phoneme classes can be found for a given string', 
    function testGetPhonemeClasses(testDone) {
      var homophonizer = homophonizerFactory({
        dbLocation: './phoneme/phoneme.db'
      });

      homophonizer.getPhonemeClassesForWord({
        word: 'pock'
      },
      checkClasses);

      function checkClasses(error, classes) {
        assert.ok(!error, error);
        assert.deepEqual(classes, ['stop', 'vowel', 'stop']);

        homophonizer.shutdown(testDone);
      }

    }
  );
});
