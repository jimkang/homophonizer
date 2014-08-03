var subleveled = require('../subleveleddb');
var queue = require('queue-async');
var path = require('path');
var _ = require('lodash');
var dbsettings = require('./metaphone-db-settings');
var checks = require('../checks');
var path = require('path');

var db;

function createHomophonizer(opts) {
  var dir = path.dirname(module.filename);
  var dbPath = path.resolve(dir + '/metaphone.db');
  var opts = _.defaults({dbLocation: dbPath}, dbsettings);
  var db = subleveled.setUpSubleveledDB(opts);

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
