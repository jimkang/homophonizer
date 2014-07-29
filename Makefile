test: metaphone/metaphone.db
	mocha --ui tdd -R spec tests/basictests.js

test-indexer:
	mocha --ui tdd -R spec tests/basictests.js -g "index"

test-indexer-debug:
	mocha debug --ui tdd -R spec tests/basictests.js -g "index" -t 60000

test-homophonizer: metaphone/metaphone.db
	mocha --ui tdd -R spec tests/basictests.js -g "homophones"

metaphone/metaphone.db:
	node metaphone/buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone/metaphone.db
