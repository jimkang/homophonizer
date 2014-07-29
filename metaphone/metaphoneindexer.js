var doublemetaphone = require('double-metaphone');
var setUpSubleveledDb = require('./subleveleddb');
var queue = require('queue-async');
var dbsettings = require('./metaphone-db-settings');
var _ = require('lodash');

function createIndexer(opts) {
  // opts:
  //  dbLocation: database file location

  var db = setUpSubleveledDb(_.defaults(opts, dbsettings));

  function index(word, done) {
    if (!word || word.length < 1) {
      process.nextTick(function reportError() {
        done('createIndexer was given an empty word.');
      });
    }

    var metaphones = doublemetaphone(word);
    var q = queue();

    // Index by word.
    q.defer(db.words.put, word, {
      id: word,
      primaryMetaphone: metaphones[0],
      secondaryMetaphone: metaphones[1]
    });
    // Index by primary metaphone and word.
    var primaryLevel = db.primarymetaphones.sublevel(metaphones[0]);

    q.defer(primaryLevel.put, word, {
      doc: 'pm',
      id: metaphones[0],
      word: word
    });

    // Index by secondary metaphone.
    if (metaphones[1]) {
      var secondaryLevel = db.secondarymetaphones.sublevel(metaphones[1]);

      q.defer(secondaryLevel.put, word, {
        doc: 'sm',
        id: metaphones[1],
        word: word
      });
    }

    q.awaitAll(done);
  }

  return {
    index: index,
    closeDb: db.close
  };
}

module.exports = createIndexer;
