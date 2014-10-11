var subleveled = require('../subleveleddb');
var path = require('path');
var dbsettings = require('./phoneme-db-settings');
var _ = require('lodash');
var checks = require('../checks');
var phonemeNavigator = require('./phonemenavigator');
var queue = require('queue-async');
var path = require('path');

var db;

function createHomophonizer() {
  var dir = path.dirname(module.filename);
  var dbPath = path.resolve(dir + '/phoneme.db');
  var opts = _.defaults({dbLocation: dbPath}, dbsettings);
  var db = subleveled.setUpSubleveledDB(opts);

  function getHomophones(word, done) {
    db.words.get(word.toUpperCase(), lookupWordsForPhoneme);

    function lookupWordsForPhoneme(error, phonemeString) {
      if (checks.checkError(error, done)) {
        var phonemeLevel = db.phonemes.sublevel(phonemeString);
        subleveled.readAllValuesFromSublevel(phonemeLevel, done);
      }
    }
  }

  function getImperfectHomophones(opts, done) {
    db.words.get(
      opts.word.toUpperCase(), 
      checks.createCallbackBranch({
        onFail: done,
        onSuccess: getPhonemeVariantStrings
      })
    );

    function getPhonemeVariantStrings(phonemeString) {
      var phonemes = phonemeString.split(' ');
      if (!phonemes || phonemes.length < 1) {
        done(null, []);
      }

      phonemes = phonemes.map(phonemeNavigator.stripStressor);

      var phonemeVariantCombos = getSimplePhonemeVariants(
        phonemes, opts.varyPhonemesAtPositions
      );

      var comboStrings = phonemeVariantCombos.map(function glueEm(phonemes) {
        return phonemes.join(' ');
      });

      lookUpWordsForPhonemes(comboStrings,         
        checks.createCallbackBranch({
          onFail: done,
          onSuccess: function cleanAndPassback(wordLists) {
            var cleanedUpLists = _.flatten(filterEmptyArrays(wordLists));
            // Hide stuff like '(1)' in 'HOUR(1)'.
            var cleanedUpLists = cleanedUpLists.map(function stripParens(word) {
              return word.replace(/\(\d\)/, '');
            });

            done(null, cleanedUpLists);
          } 
        })
      );
    }
  }

  function getSimplePhonemeVariants(phonemeSequence, variancePositions) {
    var results = [];

    phonemeSequence.forEach(getVariants);

    function getVariants(phoneme, positionInSequence) {
      var shouldVary = (variancePositions.indexOf(positionInSequence) !== -1);

      if (shouldVary) {
        var variants = phonemeNavigator.getPhonemesInSameClass(phoneme);
        var putVariantInSeq = _.curry(putVariantInSequence)(
          phonemeSequence, positionInSequence
        );
        var sequencesWithVariants = variants.map(putVariantInSeq);
        results = results.concat(sequencesWithVariants);
      }
    }

    return results;
  }

  function putVariantInSequence(originalSequence, sequencePosition, variant) {
    var sequenceWithVariant = originalSequence.slice();
    sequenceWithVariant[sequencePosition] = variant;
    return sequenceWithVariant;
  }

  function getAllPhonemeVariantCombinations(phonemes, variancePositions) {
    var newPhonemeStrings = [];

    var phonemeVariantGroups = phonemes.map(function getVariants(phoneme, i) {
      if (variancePositions.indexOf(i) === -1) {
        return [phoneme];
      }
      else {
        return phonemeNavigator.getPhonemesInSameClass(phoneme);
      }
    });

    var nonEmptyGroups = filterEmptyArrays(phonemeVariantGroups);

    var phonemeCombos = nonEmptyGroups.slice(1)
      .reduce(crossArrays, nonEmptyGroups[0]);

    return phonemeCombos;
  }

  // Combines every element in A with every element in B.
  function crossArrays(arrayA, arrayB) {
    var combo = [];
    arrayA.forEach(function combineElementWithArrayB(aElement) {
      arrayB.forEach(function combineBElementWithAElement(bElement) {
        if (Array.isArray(aElement) || Array.isArray(bElement)) {
          combo.push(aElement.concat(bElement));
        }
        else {
          combo.push([aElement, bElement]);
        }
      });
    });
    return combo;
  }

  function lookUpWordsForPhonemes(phonemeStrings, done) {
    var q = queue();

    phonemeStrings.forEach(function addPhonemeLookup(phonemesString) {
      var phonemeLevel = db.phonemes.sublevel(phonemesString);
      q.defer(subleveled.readAllValuesFromSublevel, phonemeLevel);
    });

    q.awaitAll(done);
  }

  function getPhonemesInWord(word, done) {
    db.words.get(word.toUpperCase(), done);    
  }

  function filterEmptyArrays(arrayOfArrays) {
    return arrayOfArrays.filter(function isNotEmpty(array) {
      return Array.isArray(array) && array.length > 0;
    });
  }
  
  function count(array) { 
    return array.length;
  }

  function shutdown(done) {
    db.close(done);
  }
  return {
    getHomophones: getHomophones,
    crossArrays: crossArrays,
    getSimplePhonemeVariants: getSimplePhonemeVariants,
    getAllPhonemeVariantCombinations: getAllPhonemeVariantCombinations,
    getImperfectHomophones: getImperfectHomophones,
    shutdown: shutdown,
    getPhonemesInWord: getPhonemesInWord
  };
}

module.exports = createHomophonizer;
