var createMetaphoneHomophonizer = require('./metaphone/metaphonehomophonizer');
var createPhonemeHomophonizer = require('./phoneme/phonemehomophonizer');
var phonemeTypes = require('phoneme-types');

module.exports = {
  phoneme: {
    createHomophonizer: createPhonemeHomophonizer,
    navigator: phonemeTypes
  },
  metaphone: {
    createHomophonizer: createMetaphoneHomophonizer
  }
};
