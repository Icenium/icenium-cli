///<reference path=".d.ts"/>

import chai = require("chai");
var assert:chai.Assert = chai.assert;

import yok = require("../lib/yok");

class MyClass {
	constructor(private x, public y) {
	}

	public checkX():void {
		assert.strictEqual(this.x, "foo");
	}
}

describe("yok", function() {
	it("resolves pre-constructed singleton", function() {
		var injector = new yok.Yok();
		var obj = {};
		injector.register("foo", obj);

		var resolved = injector.resolve("foo");

		assert.strictEqual(obj, resolved);
	});

	it("resolves given constructor", function() {
		var injector = new yok.Yok();
		var obj;
		injector.register("foo", function() {
			obj = {foo:"foo"};
			return obj;
		});

		var resolved = injector.resolve("foo");

		assert.strictEqual(resolved, obj);
	});

	it("resolves constructed singleton", function() {
		var injector = new yok.Yok();
		injector.register("foo", {foo:"foo"});

		var r1 = injector.resolve("foo");
		var r2 = injector.resolve("foo");

		assert.strictEqual(r1, r2);
	})

	it("injects directly into passed constructor", function() {
		var injector = new yok.Yok();
		var obj = {}
		injector.register("foo", obj);

		function Test(foo) {
			this.foo = foo;
		}

		var result = injector.resolve(Test);

		assert.strictEqual(obj, result.foo);
	});

	it("inject dependency into registered constructor", function() {
		var injector = new yok.Yok();
		var obj = {};
		injector.register("foo", obj);

		function Test(foo) {
			this.foo = foo;
		}

		injector.register("test", Test);

		var result = injector.resolve("test");

		assert.strictEqual(obj, result.foo);
	});

	it("inject dependency with $ prefix", function() {
		var injector = new yok.Yok();
		var obj = {}
		injector.register("foo", obj);

		function Test($foo) {
			this.foo = $foo;
		}

		var result = injector.resolve(Test);

		assert.strictEqual(obj, result.foo);
	});

	it("inject into TS constructor", function() {
		var injector = new yok.Yok();

		injector.register("x", "foo");
		injector.register("y", 123);

		var result = <MyClass> injector.resolve(MyClass);

		assert.strictEqual(result.y, 123);
		result.checkX();
	});

	it("resolves a parameterless constructor", function() {
		var injector = new yok.Yok();

		function Test() {
			this.foo = "foo";
		}

		var result = injector.resolve(Test);

		assert.equal(result.foo, "foo");
	});

	it("returns null when it can't resolve a command", function() {
		var injector = new yok.Yok();
		var command = injector.resolveCommand("command");
		assert.isNull(command);
	})

	it("throws when it can't resolve a registered command", function() {
		var injector = new yok.Yok();

		function Command(whatever) {}

		injector.registerCommand("command", Command);

		assert.throws(() => injector.resolveCommand("command"));
	})
})
