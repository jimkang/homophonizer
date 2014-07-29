var subleveled = require('../subleveleddb');
var path = require('path');
var dbsettings = require('./phoneme-db-settings');
var _ = require('lodash');
var checks = require('../checks');

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

  function shutdown(done) {
    db.close(done);
  }
  return {
    getHomophones: getHomophones,
    shutdown: shutdown
  };
}

module.exports = createHomophonizer;
