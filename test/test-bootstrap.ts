global._ = require("lodash");
global.$injector = require("../lib/common/yok").injector;
$injector.require("config", "../lib/config");
$injector.require("resources", "../lib/common/resource-loader");
$injector.require("hostInfo", "../lib/common/host-info");

// Our help reporting requires analyticsService. Give it this mock so that errors during test executions can be printed out
$injector.register("analyticsService", {
	checkConsent(featureName: string): IFuture<void> { return undefined; },
	trackFeature(featureName: string): IFuture<void> { return undefined; },
	trackException(exception: any, message: string): IFuture<void> { return undefined; },
	setAnalyticsStatus(enabled: boolean): IFuture<void> { return undefined; },
	disableAnalytics(): IFuture<void> { return undefined; },
	getStatusMessage(): IFuture<string> { return undefined; }
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();

process.on('exit', (code: number) => {
	require("fibers/future").assertNoFutureLeftBehind();
});
