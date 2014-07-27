test:
	mocha --ui tdd -R spec tests/basictests.js

test-homophonizer:
	mocha --ui tdd -R spec tests/basictests.js -g "homophones"

metaphone.db:
	node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db
