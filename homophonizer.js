var setUpSubleveledDb = require('./subleveleddb');
var queue = require('queue-async');
var path = require('path');

var db;

function createHomophonizer(opts) {
  // opts:
  //  dbLocation: database file location
  
  var dbPath = path.resolve(__dirname, opts.dbLocation);
  console.log(dbPath);
  var db = setUpSubleveledDb(opts);

  function getHomophones(word, done) {
    db.words.get(word.toUpperCase(), lookupMetaphones);

    function lookupMetaphones(error, wordObject) {
      if (checkError(error, done)) {
        var q = queue();
        // if (wordObject.primaryMetaphone) {
          q.defer(db.primarymetaphones.get, wordObject.primaryMetaphone);
        // }
        if (wordObject.secondaryMetaphone) {
          q.defer(db.secondarymetaphones.get, wordObject.secondaryMetaphone);
        }
        q.await(function pickMetaphoneWords(error, primary, secondary) {
            console.log(error, primary, secondary);
            done(error, {
              primary: [primary.word],
              secondary: [secondary.word]
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

function checkError(error, done) {
  var noError = true;
  if (error) {
    done(error);
    noError = false;
  }
  return noError;
}

module.exports = createHomophonizer;
