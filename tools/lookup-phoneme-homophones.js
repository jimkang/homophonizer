var homophonizerFactory = require('../phoneme/phonemehomophonizer');
var homophonizer = homophonizerFactory({
  dbLocation: '../phoneme/phoneme.db'
});
var probable = require('probable');

var word = process.argv[2];
var imperfect = process.argv[3];

if (word.length > 0) {
  if (imperfect) {
    var varyAtPositions = [];
    homophonizer.getPhonemesInWord(word, function done(error, phonemeString) {
      if (error) {
        console.log('Could not get phonemes for word.');
      }
      else {
        var phonemes = phonemeString.split(' ');
        varyAtPositions = phonemes.map(function getPosition(ph, i) { return i; });

        homophonizer.getImperfectHomophones({
          word: word,
          varyPhonemesAtPositions: varyAtPositions
        },
        showHomophones);
      }
    });
  }
  else {
    homophonizer.getHomophones(word, showHomophones);
  }
}

function showHomophones(error, homophones) {
  if (error) {
    console.log(error);
  }
  else {
    console.log(homophones);
  }
}