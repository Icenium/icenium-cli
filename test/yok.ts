///<reference path=".d.ts"/>
"use strict";
import chai = require("chai");
let assert:chai.Assert = chai.assert;
import yok = require("../lib/common/yok");

class MyClass {
	constructor(private x:string, public y:any) {
	}

	public checkX():void {
		assert.strictEqual(this.x, "foo");
	}
}

describe("yok", () => {
	it("resolves pre-constructed singleton", () => {
		let injector = new yok.Yok();
		let obj = {};
		injector.register("foo", obj);

		let resolved = injector.resolve("foo");

		assert.strictEqual(obj, resolved);
	});

	it("resolves given constructor", () => {
		let injector = new yok.Yok();
		let obj:any;
		injector.register("foo", () => {
			obj = {foo:"foo"};
			return obj;
		});

		let resolved = injector.resolve("foo");

		assert.strictEqual(resolved, obj);
	});

	it("resolves constructed singleton", () => {
		let injector = new yok.Yok();
		injector.register("foo", {foo:"foo"});

		let r1 = injector.resolve("foo");
		let r2 = injector.resolve("foo");

		assert.strictEqual(r1, r2);
	});

	it("injects directly into passed constructor", () => {
		let injector = new yok.Yok();
		let obj = {};
		injector.register("foo", obj);

		function Test(foo:any) {
			this.foo = foo;
		}

		let result = injector.resolve(Test);

		assert.strictEqual(obj, result.foo);
	});

	it("inject dependency into registered constructor", () => {
		let injector = new yok.Yok();
		let obj = {};
		injector.register("foo", obj);

		function Test(foo:any) {
			this.foo = foo;
		}

		injector.register("test", Test);

		let result = injector.resolve("test");

		assert.strictEqual(obj, result.foo);
	});

	it("inject dependency with $ prefix", () => {
		let injector = new yok.Yok();
		let obj = {};
		injector.register("foo", obj);

		function Test($foo:any) {
			this.foo = $foo;
		}

		let result = injector.resolve(Test);

		assert.strictEqual(obj, result.foo);
	});

	it("inject into TS constructor", () => {
		let injector = new yok.Yok();

		injector.register("x", "foo");
		injector.register("y", 123);

		let result = <MyClass> injector.resolve(MyClass);

		assert.strictEqual(result.y, 123);
		result.checkX();
	});

	it("resolves a parameterless constructor", () => {
		let injector = new yok.Yok();

		function Test() {
			this.foo = "foo";
		}

		let result = injector.resolve(Test);

		assert.equal(result.foo, "foo");
	});

	it("returns null when it can't resolve a command", () => {
		let injector = new yok.Yok();
		let command = injector.resolveCommand("command");
		assert.isNull(command);
	});

	it("throws when it can't resolve a registered command", () => {
		let injector = new yok.Yok();

		function Command(whatever:any) {}

		injector.registerCommand("command", Command);

		assert.throws(() => injector.resolveCommand("command"));
	});

	it("disposes", () => {
		let injector = new yok.Yok();

		function Thing() {}

		Thing.prototype.dispose = function() {
			this.disposed = true;
		};

		injector.register("thing", Thing);
		let thing = injector.resolve("thing");
		injector.dispose();

		assert.isTrue(thing.disposed);
	});
});
