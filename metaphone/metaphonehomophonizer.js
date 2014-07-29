var setUpSubleveledDb = require('../subleveleddb');
var queue = require('queue-async');
var path = require('path');
var _ = require('lodash');
var dbsettings = require('./metaphone-db-settings');

var db;

function createHomophonizer(opts) {
  // opts:
  //  dbLocation: database file location
  var dbPath = path.resolve(__dirname, opts.dbLocation);
  var db = setUpSubleveledDb(_.defaults(opts, dbsettings));

  function getHomophones(word, done) {
    db.words.get(word.toUpperCase(), lookupMetaphones);

    function lookupMetaphones(error, wordObject) {
      if (checkError(error, done)) {
        var q = queue();

        var primaryLevel = db.primarymetaphones.sublevel(
          wordObject.primaryMetaphone);

        q.defer(readAllValuesFromSublevel, primaryLevel);

        if (wordObject.secondaryMetaphone) {
          var secondaryLevel = db.secondarymetaphones.sublevel(
            wordObject.secondaryMetaphone);
          q.defer(readAllValuesFromSublevel, secondaryLevel);
        }

        q.await(function pickMetaphoneWords(error, primary, secondary) {
            done(error, {
              primary: _.pluck(primary, 'word'),
              secondary: _.pluck(secondary, 'word')
            });
          }
        );
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

function readAllValuesFromSublevel(sublevel, done) {
  var values = [];
  var valueStream = sublevel.createValueStream();
  valueStream.on('data', function addValue(value) {
    values.push(value);
  });

  function passBackValues(error) {
    if (checkError(error)) {
      done(error, values);
    }
  }

  valueStream.on('close', passBackValues);//close);
}

function checkError(error, done) {
  var noError = true;
  if (error) {
    done(error);
    noError = false;
  }
  return noError;
}

module.exports = createHomophonizer;
