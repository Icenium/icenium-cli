icenium-cli
===========

Cross Platform Command Line Interface for Icenium.

First steps
===
After cloning the repository, run:

```
   $ npm install
```

This will install all project dependencies.


Writing unit tests
===
To add a test for a new module, do the following:

* add a test file to `test/`, e.g. `test/my-component.js`
* write the test using [mocha][1]'s BDD interface and [chai][3]'s [assertions][2] (preferably)

To run all unit tests, run the following in the console:

```
   $ npm test
```

Before commiting
===
Run the linter:

```
   $ lint
```

Correct any warnings from the linter before commiting.

[1]: http://visionmedia.github.io/mocha/#interfaces
[2]: http://chaijs.com/api/assert/
[3]: http://chaijs.com/guide/styles/#assert

