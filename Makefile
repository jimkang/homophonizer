test: metaphone/metaphone.db
	mocha --ui tdd -R spec tests/basictests.js

test-phoneme: phoneme/phoneme.db
	mocha --ui tdd -R spec tests/phonemetests.js

test-metaphone-indexer:
	mocha --ui tdd -R spec tests/basictests.js -g "index"

test-phoneme-indexer:
	mocha --ui tdd -R spec tests/phonemetests.js -g "index"

test-metaphone-homophonizer: metaphone/metaphone.db
	mocha --ui tdd -R spec tests/basictests.js -g "homophones"

test-phoneme-homophonizer: phoneme/phoneme.db
	mocha --ui tdd -R spec tests/phonemetests.js -g "homophones"

metaphone/metaphone.db:
	cd metaphone && node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db

phoneme/phoneme.db:
	cd phoneme && node buildphonemedb.js cmudict.0.7a phoneme.db
