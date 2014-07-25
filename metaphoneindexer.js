var doublemetaphone = require('double-metaphone');
var levelwrap = require('basicset-levelwrap');
var queue = require('queue-async');

function createIndexer(opts) {
  // opts:
  //  dbLocation: database file location
  var db = levelwrap.createLevelWrap(opts.dbLocation);

  function index(word, done) {
    debugger;
    if (!word || word.length < 1) {
      process.nextTick(done);
    }

    var metaphones = doublemetaphone(word);
    console.log(metaphones);

    var q = queue();

    // Index by word.
    q.defer(db.saveObject, {
      doc: 'w',
      id: word,
      primaryMetaphone: metaphones[0],
      secondaryMetaphone: metaphones[1]
    });
    // Index by primary metaphone.
    q.defer(db.saveObject, {
      doc: 'pm',
      id: metaphones[0],
      word: word
    });
    // Index by secondary metaphone.
    q.defer(db.saveObject, {
      doc: 'sm',
      id: metaphones[1],
      word: word
    });

    q.awaitAll(done);
  }

  function closeDb(done) {
    db.close(done);
  }

  return {
    index: index,
    closeDb: closeDb
  };
}

module.exports = createIndexer;
