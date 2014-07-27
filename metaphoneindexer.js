var doublemetaphone = require('double-metaphone');
var setUpSubleveledDb = require('./subleveleddb');
var queue = require('queue-async');

function createIndexer(opts) {
  // opts:
  //  dbLocation: database file location
  var db = setUpSubleveledDb(opts);

  function index(word, done) {
    if (!word || word.length < 1) {
      process.nextTick(function reportError() {
        done('createIndexer was given an empty word.');
      });
    }

    var metaphones = doublemetaphone(word);
    var q = queue();
    // console.log(metaphones);

    // Index by word.
    q.defer(db.words.put, word, {
      id: word,
      primaryMetaphone: metaphones[0],
      secondaryMetaphone: metaphones[1]
    });
    // Index by primary metaphone.
    q.defer(db.primarymetaphones.put, metaphones[0], {
      doc: 'pm',
      id: metaphones[0],
      word: word
    });
    // Index by secondary metaphone.
    q.defer(db.secondarymetaphones.put, metaphones[1], {
      doc: 'sm',
      id: metaphones[1],
      word: word
    });

    q.awaitAll(done);
  }

  return {
    index: index,
    closeDb: db.close
  };
}

module.exports = createIndexer;
