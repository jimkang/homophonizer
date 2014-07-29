var level = require('level');
var sublevel = require('level-sublevel');

function setUpSubleveledDB(opts) {
  // opts:
  //  dbLocation: Database file location
  //  sublevels: Dictionary of immediate sublevel names and their 
  //    delimiters. e.g. {words: 'w'}
  //  valueEncoding: e.g. 'json', 'utf8'

  var levelOpts;
  if (opts.valueEncoding) {
    levelOpts = {
      valueEncoding: opts.valueEncoding
    }
  }

  var leveldb = level(opts.dbLocation, levelOpts);
  var subleveldb = sublevel(leveldb);

  function closeDb(done) {
    subleveldb.close(function closeLevelDb() {
      leveldb.close(done);
    });
  }

  var db = {
    close: closeDb
  };

  for (var levelname in opts.sublevels) {
    db[levelname] = subleveldb.sublevel(opts.sublevels[levelname]);
  }

  return db;
}

module.exports = setUpSubleveledDB;
