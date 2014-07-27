test:
	mocha --ui tdd -R spec tests/basictests.js

test-indexer:
	mocha --ui tdd -R spec tests/basictests.js -g "index"

test-indexer-debug:
	mocha debug --ui tdd -R spec tests/basictests.js -g "index" -t 60000

test-homophonizer:
	mocha --ui tdd -R spec tests/basictests.js -g "homophones"

metaphone.db:
	node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db
