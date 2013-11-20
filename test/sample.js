var assert = require("chai").assert

describe("util", function() {
	var util = require("../lib/util")

	describe("nop", function() {
		var nop = util.nop

		it("kind of does nothing", function() {
			assert.equal(123, nop());
		});
	});
})
