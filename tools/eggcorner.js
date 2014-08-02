// TODO: Move into a different project.

var phonemeHomophonizerFactory = require('../phoneme/phonemehomophonizer');
var phonemeHomophonizer = phonemeHomophonizerFactory({
  dbLocation: '../phoneme/phoneme.db'
});

var metaphoneHomophonizerFactory = require('../metaphone/metaphonehomophonizer');
var metaphoneHomophonizer = metaphoneHomophonizerFactory({
  dbLocation: '../metaphone/metaphone.db'
});

var probable = require('probable');
var queue = require('queue-async');

var phrase = process.argv[2];

if (phrase.length > 0) {
  var words = phrase.split(' ');
  var q = queue();
  q.defer(getMetaphoneHomophonesForWords, words);
  q.defer(getPhonemeHomophonesForWords, words);
  q.await(showHomophones);
}

function getMetaphoneHomophonesForWords(words, done) {
  var q = queue();
  words.forEach(function queueLookup(word) {
    q.defer(metaphoneHomophonizer.getHomophones, word);
  });
  q.awaitAll(done);
}

function getPhonemeHomophonesForWords(words, done) {
  var q = queue();
  words.forEach(function queueLookup(word) {
    console.log('Queuing:', word);
    q.defer(getPhonemeHomophonesForWord, word);
  });
  q.awaitAll(done);
}

function getPhonemeHomophonesForWord(word, done) {
  phonemeHomophonizer.getPhonemesInWord(word, 
    function determineWhatPhonemesToVary(error, phonemeString) {
      if (error) {
        console.log('Could not get phonemes for word.');
      }
      else {
        var varyAtPositions = [];
        console.log(phonemeString, 'type:', typeof phonemeString);
        var phonemes = phonemeString.split(' ');
        varyAtPositions = phonemes.map(function getPosition(ph, i) { return i; });

        phonemeHomophonizer.getImperfectHomophones({
          word: word,
          varianceAtPhonemePositions: varyAtPositions
        },
        done);
      }
    }
  );
}

function showHomophones(error, metaphoneHomophones, phonemeHomophones) {
  if (error) {
    console.log(error);
  }
  else {
    console.log('metaphoneHomophones:', metaphoneHomophones);
    console.log('phonemeHomophones:', phonemeHomophones);

    console.log('metaphone eggcorn:', 
      deriveMetaphoneEggcorn(metaphoneHomophones));
    console.log('phoneme eggcorn:', 
      derivePhonemeEggcorn(phonemeHomophones));
  }
}

function deriveMetaphoneEggcorn(metaphoneHomophones) {
  var replaceIndex = probable.roll(metaphoneHomophones.length);
  var metaphonePhrase = words.slice();
  var metaphoneReplacemenChoices = metaphoneHomophones[replaceIndex].primary;
  var metaphoneReplacement = probable.pickFromArray(
    metaphoneReplacemenChoices);
  metaphonePhrase[replaceIndex] = metaphoneReplacement;
  return metaphonePhrase.join(' ');
}

function derivePhonemeEggcorn(phonemeHomophones) {
  var replaceIndex = probable.roll(phonemeHomophones.length);
  var phonemePhrase = words.slice();
  var phonemeReplacemenChoices = phonemeHomophones[replaceIndex];
  var phonemeReplacement = probable.pickFromArray(phonemeReplacemenChoices);
  phonemePhrase[replaceIndex] = phonemeReplacement;
  return phonemePhrase.join(' ');
}
