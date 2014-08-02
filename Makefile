test: test-metaphone test-phoneme

test-metaphone: metaphone/metaphone.db
	mocha --ui tdd -R spec tests/metaphonetests.js

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

test-phoneme-homophonizer-debug: phoneme/phoneme.db
	mocha debug --ui tdd -R spec tests/phonemetests.js -g "scanner"

test-phoneme-navigator: phoneme/phoneme.db
	mocha --ui tdd -R spec tests/phonemetests.js -g "navigator"

metaphone/metaphone.db:
	cd metaphone && node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db

phoneme/phoneme.db:
	cd phoneme && node buildphonemedb.js cmudict.0.7a phoneme.db

lookup:
	@cd tools && echo "Metaphone-based:" && node lookup-metaphone-homophones.js $(WORD)
	@cd tools && echo "Phoneme-based:" && node lookup-phoneme-homophones.js $(WORD) --imperfect
