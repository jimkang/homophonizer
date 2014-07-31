var subleveled = require('../subleveleddb');
var path = require('path');
var dbsettings = require('./phoneme-db-settings');
var _ = require('lodash');
var checks = require('../checks');
var phonemeNavigator = require('./phonemeNavigator');
var queue = require('queue-async');

var db;

function createHomophonizer(opts) {
  // opts:
  //  dbLocation: database file location
  var dbPath = path.resolve(__dirname, opts.dbLocation);
  var db = subleveled.setUpSubleveledDB(_.defaults(opts, dbsettings));

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

      var phonemeVariantCombos = getPhonemeVariants(
        phonemes, opts.varianceAtPhonemePositions
      );

      var comboStrings = phonemeVariantCombos.map(function glueEm(phonemes) {
        return phonemes.join(' ');
      });

      lookUpWordsForPhonemes(comboStrings,         
        checks.createCallbackBranch({
          onFail: done,
          onSuccess: function cleanAndPassback(wordLists) {
            done(null, _.flatten(filterEmptyArrays(wordLists)));
          } 
        })
      );
    }
  }

  function getPhonemeVariants(phonemes, variancePositions) {
    var newPhonemeStrings = [];

    var phonemeVariantGroups = phonemes.map(function getVariants(phoneme, i) {
      if (variancePositions.indexOf(i) === -1) {
        return [phoneme];
      }
      else {
        return phonemeNavigator.getPhonemesInSameClass(phoneme);
      }
    });

    var phonemeCombos = phonemeVariantGroups.slice(1)
      .reduce(crossArrays, phonemeVariantGroups[0]);

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
    getPhonemeVariants: getPhonemeVariants,
    getImperfectHomophones: getImperfectHomophones,
    shutdown: shutdown
  };
}

module.exports = createHomophonizer;
