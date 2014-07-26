test:
	mocha --ui tdd -R spec tests/basictests.js

metaphone.db:
	node buildmetaphonedb.js cmudict.0.7a-words-only.txt metaphone.db
