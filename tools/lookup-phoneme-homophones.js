var homophonizerFactory = require('../phoneme/phonemehomophonizer');
var homophonizer = homophonizerFactory({
  dbLocation: '../phoneme/phoneme.db'
});

var word = process.argv[2];

if (word.length > 0) {
  homophonizer.getHomophones(word, function showHomophones(error, homophones) {
    if (error) {
      console.log(error);
    }
    else {
      console.log(homophones);
    }
  });
}
