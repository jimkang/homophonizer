var homophonizerFactory = require('../metaphone/metaphonehomophonizer');
var homophonizer = homophonizerFactory({
  dbLocation: '../metaphone/metaphone.db'
});

var word = process.argv[2];

if (word.length > 0) {
  homophonizer.getHomophones(word, showHomophones);
}

function showHomophones(error, homophones) {
  if (error) {
    console.log(error);
  }
  else {
    console.log(homophones);
  }
}