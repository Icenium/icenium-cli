global._ = require("lodash");
global.$injector = require("../lib/common/yok").injector;
$injector.require("config", "../lib/config");
$injector.require("resources", "../lib/resource-loader");

process.on('exit', (code: number) => {
	require("fibers/future").assertNoFutureLeftBehind();
});
