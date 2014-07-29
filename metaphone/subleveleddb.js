var level = require('level');
var sublevel = require('level-sublevel');

function setUpSubleveledDB(opts) {
  // opts:
  //  dbLocation: database file location
  var leveldb = level(opts.dbLocation, {valueEncoding: 'json'});
  var subleveldb = sublevel(leveldb);
  var wordlevel = subleveldb.sublevel('w');
  var pmlevel = subleveldb.sublevel('pm');
  var smlevel = subleveldb.sublevel('sm');

  function closeDb(done) {
    subleveldb.close(function closeLevelDb() {
      leveldb.close(done);
    });
  }

  return {
    words: wordlevel,
    primarymetaphones: pmlevel,
    secondarymetaphones: smlevel,
    close: closeDb
  };
}

module.exports = setUpSubleveledDB;
