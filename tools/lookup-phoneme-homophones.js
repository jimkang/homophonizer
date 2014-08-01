var homophonizerFactory = require('../phoneme/phonemehomophonizer');
var homophonizer = homophonizerFactory({
  dbLocation: '../phoneme/phoneme.db'
});
var probable = require('probable');

var word = process.argv[2];
// var varyAtPositionsString = process.argv[3]; // e.g. "[1, 3]"
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
        // console.log('varyAtPositions', varyAtPositions);
        homophonizer.getImperfectHomophones({
          word: word,
          varianceAtPhonemePositions: varyAtPositions
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