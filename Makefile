MOCHACMD = node_modules/mocha/bin/mocha --ui tdd -R spec

test: test-metaphone test-phoneme test-index

test-index: metaphone/metaphone.db phoneme/phoneme.db
	$(MOCHACMD) tests/indextests.js

test-metaphone: metaphone/metaphone.db
	$(MOCHACMD) tests/metaphonetests.js

test-phoneme: test-phoneme-homophonizer test-phoneme-navigator
	$(MOCHACMD) tests/phonemetests.js

test-metaphone-indexer:
	$(MOCHACMD) tests/basictests.js -g "index"

test-phoneme-indexer:
	$(MOCHACMD) tests/phonemetests.js -g "index"

test-metaphone-homophonizer: metaphone/metaphone.db
	$(MOCHACMD) tests/basictests.js -g "homophones"

test-phoneme-homophonizer: phoneme/phoneme.db
	$(MOCHACMD) tests/phoneme-homophones-tests.js

test-phoneme-homophonizer-debug: phoneme/phoneme.db
	mocha debug --ui tdd -R spec tests/phonemetests.js -g "scanner"

test-phoneme-navigator: phoneme/phoneme.db
	$(MOCHACMD) tests/phoneme-navigator-tests.js

metaphone/metaphone.db:
	cd metaphone && node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db

phoneme/phoneme.db:
	cd phoneme && node buildphonemedb.js cmudict.0.7a phoneme.db

builddbs: metaphone/metaphone.db phoneme/phoneme.db

lookup:
	# @cd tools && echo "Metaphone-based:" && node lookup-metaphone-homophones.js $(WORD)
	@cd tools && echo "Phoneme-based:" && node lookup-phoneme-homophones.js $(WORD) --imperfect

pushall:
	git push origin master && npm publish
