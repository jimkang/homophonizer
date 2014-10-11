var createMetaphoneHomophonizer = require('./metaphone/metaphonehomophonizer');
var createPhonemeHomophonizer = require('./phoneme/phonemehomophonizer');
var phonemeNavigator = require('./phoneme/phonemenavigator');

module.exports = {
  phoneme: {
    createHomophonizer: createPhonemeHomophonizer,
    navigator: phonemeNavigator
  },
  metaphone: {
    createHomophonizer: createMetaphoneHomophonizer
  }
};
