var levelwrap = require('basicset-levelwrap');
var queue = require('queue-async');
var path = require('path');

var db;

function createHomophonizer(opts) {
  // opts:
  //  dbLocation: database file location
  
  var dbPath = path.resolve(__dirname, opts.dbLocation);
  console.log(dbPath);
  db = levelwrap.createLevelWrap(dbPath);

  function getHomophones(word, done) {
    // var stream = db.getDocObjectStream('w');

    // stream.pipe(process.stdout);
    // return;

    db.getObject(word.toUpperCase(), 'w', lookupMetaphones);

    function lookupMetaphones(error, wordObject) {
      if (checkError(error, done)) {
        var q = queue();
        // if (wordObject.primaryMetaphone) {
          q.defer(db.getObject, wordObject.primaryMetaphone, 'pm');
        // }
        if (wordObject.secondaryMetaphone) {
          q.defer(db.getObject, wordObject.secondaryMetaphone, 'sm');
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
