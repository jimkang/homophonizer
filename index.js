var createMetaphoneHomophonizer = require('./metaphone/metaphonehomophonizer');
var createPhonemeHomophonizer = require('./phoneme/phonemehomophonizer');
var phonemeNavigator = require('./phoneme/phonemeNavigator');

module.exports = {
  phoneme: {
    createHomophonizer: createPhonemeHomophonizer,
    navigator: phonemeNavigator
  },
  metaphone: {
    createHomophonizer: createMetaphoneHomophonizer
  }
};
