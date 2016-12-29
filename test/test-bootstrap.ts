global._ = require("lodash");
global.$injector = require("../lib/common/yok").injector;
$injector.require("config", "../lib/config");
$injector.require("resources", "../lib/common/resource-loader");
$injector.require("hostInfo", "../lib/common/host-info");

// Our help reporting requires analyticsService. Give it this mock so that errors during test executions can be printed out
$injector.register("analyticsService", {
	async checkConsent(featureName: string): Promise<void> { return undefined; },
	async trackFeature(featureName: string): Promise<void> { return undefined; },
	async trackException(exception: any, message: string): Promise<void> { return undefined; },
	async setAnalyticsStatus(enabled: boolean): Promise<void> { return undefined; },
	async disableAnalytics(): Promise<void> { return undefined; },
	async getStatusMessage(): Promise<string> { return undefined; }
});

// Converts the js callstack to typescript
import errors = require("../lib/common/errors");
errors.installUncaughtExceptionListener();

process.on('exit', (code: number) => {
	require("fibers/future").assertNoFutureLeftBehind();
});
