var level = require('level');
var sublevel = require('level-sublevel');
var checks = require('./checks');

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

function readAllValuesFromSublevel(sublevel, done) {
  var values = [];
  var valueStream = sublevel.createValueStream();
  valueStream.on('data', function addValue(value) {
    values.push(value);
  });

  function passBackValues(error) {
    if (checks.checkError(error)) {
      done(error, values);
    }
  }

  valueStream.on('close', passBackValues);
}

module.exports = {
  setUpSubleveledDB: setUpSubleveledDB,
  readAllValuesFromSublevel: readAllValuesFromSublevel
};

