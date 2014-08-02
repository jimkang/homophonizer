var subleveled = require('../subleveleddb');
var queue = require('queue-async');
var path = require('path');
var _ = require('lodash');
var dbsettings = require('./metaphone-db-settings');
var checks = require('../checks');

var db;

function createHomophonizer(opts) {
  // opts:
  //  dbLocation: database file location
  opts = _.defaults(opts ? opts : {}, {
    dbLocation: 'metaphone/metaphone.db'
  });
  var db = subleveled.setUpSubleveledDB(_.defaults(opts, dbsettings));

  function getHomophones(word, done) {
    db.words.get(word.toUpperCase(), lookupMetaphones);

    function lookupMetaphones(error, wordObject) {
      if (checks.checkError(error, done)) {
        var q = queue();

        var primaryLevel = db.primarymetaphones.sublevel(
          wordObject.primaryMetaphone);

        q.defer(subleveled.readAllValuesFromSublevel, primaryLevel);

        if (wordObject.secondaryMetaphone) {
          var secondaryLevel = db.secondarymetaphones.sublevel(
            wordObject.secondaryMetaphone);
          q.defer(subleveled.readAllValuesFromSublevel, secondaryLevel);
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

module.exports = createHomophonizer;
