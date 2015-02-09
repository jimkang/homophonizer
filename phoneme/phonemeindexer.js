var queue = require('queue-async');
var setUpSubleveledDB = require('../subleveleddb').setUpSubleveledDB;
var dbsettings = require('./phoneme-db-settings');
var _ = require('lodash');
var phonemeTypes = require('phoneme-types');

function createIndexer(opts) {
  // opts:
  //  dbLocation: database file location

  var db = setUpSubleveledDB(_.defaults(opts, dbsettings));

  function index(word, phonemeString, done) {
    phonemeString = phonemeTypes.stripStressor(phonemeString);
    validateStringArgument(word, 'word', done);
    validateStringArgument(phonemeString, 'phonemeString', done);

    var q = queue();

    // Index by word.
    q.defer(db.words.put, word, phonemeString);

    // Index by phoneme string.
    var phonemeLevel = db.phonemes.sublevel(phonemeString);

    q.defer(phonemeLevel.put, word, word);

    q.awaitAll(done);
  }

  return {
    index: index,
    closeDb: db.close
  };
}


function validateStringArgument(str, name, done) {
  if (!str || str.length < 1) {
    process.nextTick(function reportError() {
      done('createIndexer was given an empty argument for ' + name + '.');
    });
  }
}

module.exports = createIndexer;
