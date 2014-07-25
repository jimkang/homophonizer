homonymizer
===========

This module finds homonyms for words. For example:

    code and what not

Etc.!

Installation
------------

    npm install homonymizer

Usage
-----

Load the module somehow.

    var someFactory = require('homonymizer');

Create a thing from the module.

    var thing = someFactory();

Use that thing.

    thing.use();

Success!

__In the browser__

    make browserify

Then:

    make minbrowserify

After that, include `<script src="yetanothermodule-browserified.min.js">` in your html file. Then, in your JavaScript file:

    var thing = exportname.createThing();

[Here's a working example.](http://jimkang.com/homonymizer/example)

Tests
-----

Run tests with `make test`.

License
-------

MIT.
