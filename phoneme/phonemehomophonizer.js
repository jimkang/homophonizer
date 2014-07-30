var subleveled = require('../subleveleddb');
var path = require('path');
var dbsettings = require('./phoneme-db-settings');
var _ = require('lodash');
var checks = require('../checks');
var phonemeNavigator = require('./phonemeNavigator');

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
    var branch = _.curry(checks.branchOnError)(done, getPhonemeVariants);

    db.words.get(opts.word.toUpperCase(), branch);
    var variancePositions = opts.varianceAtPhonemePositions;

    function getPhonemeVariants(phonemeString) {
      var phonemes = phonemeString.split(' ');
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
      console.log(phonemeCombos);

      // TODO: Look up words for phoneme combos.
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

    function getPhonemeCombinationsFromVariantGroups(phonemeVariantGroups) {
      var mostVariantsInAnyGroup = _.max(phonemeVariantGroups, count);

      for (var i = 0; i < phonemeVariantGroups.length; ++i) {
        var phonemeVariantGroup = phonemeVariantGroups[i];
        for (var j = 1; j < phonemeVariantGroups.length; ++j) {

        }
      }
    }
    
    function count(array) { 
      return array.length;
    }
  }

  function shutdown(done) {
    db.close(done);
  }
  return {
    getHomophones: getHomophones,
    getImperfectHomophones: getImperfectHomophones,
    shutdown: shutdown
  };
}

module.exports = createHomophonizer;
