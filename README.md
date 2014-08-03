homophonizer
============

This module finds [homophones](http://en.wikipedia.org/wiki/Homophone) for words. For example, here is code to homophones for "acorn":

    var hph = require('homophonizer');
    var homophonizer = hph.metaphone.createHomophonizer();
    homophonizer.getHomophones('acorn', function done(error, results) {
      // Error handling goes here.
      console.log(results);
    });

Results:

    {
      primary: [
        'ACHORN',
        'ACORN',
        'AGOURON',
        'AKRON',
        'EKERN',
        'OGREN',
        'UKRAINE'
      ],
      secondary: [
        'ACHORN',
        'ACORN',
        'AGOURON',
        'AKRON',
        'EICHHORN',
        'EICHORN',
        'EKERN',
        'OGREN',
        'UKRAINE'
      ]
    }


Installation
------------

    npm install homophonizer
    cd node_modules/homophonizer
    make builddbs

That last step is important. There will be nothing in the databases in the it searches without it.

Metaphone and phonemes
----------------------

homophonizer has two ways of generating homophones. The first is via the [Double Metaphone](http://en.wikipedia.org/wiki/Metaphone#Double_Metaphone) algorithm as implemented by the [double-metaphone module](https://github.com/wooorm/double-metaphone). Double Metaphone is a way of phonetically encoding words. homophonizer uses those encodings to find words with the matching phonetic profiles as Double Metaphone sees it.

The other way is via [phonemes](http://en.wikipedia.org/wiki/Phoneme). homophonizer uses the phonemes from the [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) to profile words by their phonemes. Then, it finds phoneme sequences that are similar to each other and maps them back again to words.

The phoneme homophonizer is under the `phoneme` namespace. You can use it like so:

    var hph = require('homophonizer');
    var homophonizer = hph.phoneme.createHomophonizer();
    homophonizer.getImperfectHomophones({
      word: 'shell',
      varyPhonemesAtPositions
    },
    function done(error, results) {
      // Error handling goes here.
      console.log(results);
    });

Results:

    [
      'SCHAAL',
      'SCHOLL',
      'SHOLL',
      'SHALL',
      'SHULL',
      'SCHALL',
      'SHAUL',
      'SHAULL',
      'SHAWL',
      'SHEIL',
      'SHIRL',
      'SHALE',
      'SCHILL',
      'SHILL',
      'SCHEEL',
      'SCHEELE',
      'SCHIEL',
      'SCHIELE',
      'SHE\'LL',
      'SHIEL',
      'SCHAUL',
      'SCHOLLE',
      'SCHUL',
      'SCHULL',
      'SCHUELE'
    ]

API
---

__homophonizer.metaphone__

  - __createHomophonizer:__ Creates an object that'll get you homophones with the following methods:
      - __getHomophones(word, done)__
        - `done` is a callback with this signature: `(error, results)`, where `results` is an object containing two arrays: `primary` and `secondary`, which contain the list of words found by searching [primary metaphone codes](http://en.wikipedia.org/wiki/Metaphone#Double_Metaphone) and and the list of words found by searching secondary metaphone codes, respectively.
      - __shutdown:__ This closes the database that the homophonizer searches. You need to close it before creating another metaphone homophonizer. (Now that I write this out, I'm not sure that the phoneme homophonizer shouldn't be a singleton.)
  - __navigator__
    - __classifyPhoneme(phoneme)__: Tells you how a phoneme is classified. e.g. 'affricate', 'aspirate', etc.
    - __getPhonemesInSameClass(phoneme)__: Tells you what other phonemes are in the same class (or family, if you want to think of it that way) as a phoneme.

__homophonizer.phoneme__

  - __createHomophonizer:__ Creates an object that'll get you homophones with the following methods:
      - __getHomophones(word, done)__: Gets homophones for a word you give it it. `done` is a callback with this signature: `(error, results)`, where `results` is an object containing an array of the homophones. This method uses finds homophones by strictly matching phoneme profiles, so you often will not get that much back.
      - __getImperfectHomophones(opts, done)__:
        - `opts` should contain:
            - word: The word you want to get homophones for.
            - varyPhonemesAtPositions: An array that tells it what phonemes in the word it's OK to not match exactly when looking for homophones. e.g. `[0, 3, 4]` tells it that potential homophones whose first, fourth, and fifth phonemes do not match `word`'s first, fourth, and fifth phonemes.
        - `done`: Will be passed an error and an array of the resulting homophones.
      - __shutdown:__ This closes the database that the homophonizer searches. You need to close it before creating another phoneme homophonizer.

Tests
-----

Run tests with `make test`. You can run them more granularly with some targets in the Makefile and by running the scripts in `tests` directly. Just make sure you use the `--ui tdd` switch with mocha.

Tools
-----

Over in the `tools` directory, there's various scripts you can use to find homophones, metaphones, and phonemes. The most useful ones (looking up homophones by phoneme and metaphone) can be called by a Makefile target:

    make lookup WORD=leafy

License
-------

MIT.
