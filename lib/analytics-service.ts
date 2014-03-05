///<reference path=".d.ts"/>

import util = require("util");
import path = require("path");
import helpers = require("./helpers");
import options = require("./options");
import os = require("os");
require("colors");

enum AnalyticsCommandType {
	enable,
	disable,
	status
}

export class AnalyticsService implements IAnalyticsService {
    private _eqatecMonitor: any = null;
	private static PRODUCT_KEY = "750a46a45109453c8b05b11de0d3a80b";

    constructor(private $config: IConfiguration,
        private $logger: ILogger,
		private $prompter: IPrompter,
		private $userSettingsService: IUserSettingsService,
		private $userDataStore: IUserDataStore) { }

    private start(): IFuture<void> {
		return(() => {
			global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
			global.userAgent = this.getUserAgentString();
			var eqatec = require("./../vendor/EqatecMonitor");

			if(this._eqatecMonitor) {
				return;
			}

			var trackFeatureUsage = this.$userSettingsService.getValue("TrackFeatureUsage").wait();

			if(trackFeatureUsage === null || trackFeatureUsage === undefined){
				var message = "We're constantly looking for ways to make" +  " Appbuilder CLI ".red + "better!. May we anonymously report usage statistics to improve the tool over time?";

				trackFeatureUsage = this.$prompter.confirm(message, () => { return "y"; }).wait();
				this.$userSettingsService.saveSettings({"TrackFeatureUsage": trackFeatureUsage}).wait();
			}

			if(trackFeatureUsage) {
				var settings = global._eqatec.createSettings(AnalyticsService.PRODUCT_KEY);
				settings.version = this.$config.version;

				this._eqatecMonitor = global._eqatec.createMonitor(settings);

				var user = this.$userDataStore.getUser().wait();

				if(user) {
					this._eqatecMonitor.setInstallationID(user.email.toLowerCase());
					this._eqatecMonitor.setUserID(user.uid);
				}

				this._eqatecMonitor.start();
			}
		}).future<void>()();
    }

	public trackFeature(featureName: string): IFuture<void> {
		return(() => {
			try {
				if(!this._eqatecMonitor) {
					this.start().wait();
				}

				var category = options.client || "CLI";
				if(this._eqatecMonitor) {
					this._eqatecMonitor.trackFeature(category + "." + featureName);
				}
			} catch(e) {
				this.$logger.trace("Analytics exception: '%s'", e);
			}
		}).future<void>()();
	}

	public trackException(exception: any, message: string) {
		return(() => {
			try {
				if(!this._eqatecMonitor) {
					this.start().wait();
				}

				if(this._eqatecMonitor) {
					this._eqatecMonitor.trackException(exception, message);
				}

			} catch(e) {
				this.$logger.trace("Analytics exception: '%s'", e);
			}
		}).future<void>()();
	}

	private getUserAgentString(): string {
		var userAgentString = null;
		var osType = os.type();
		if(osType === "Windows_NT") {
			userAgentString = "(Windows NT " + os.release() + ")";
		} else if(osType === "Darwin") {
			userAgentString = "(Mac OS X " + os.release() + ")";
		}

		return userAgentString;
	}

	private enableAnalytics(): IFuture<void> {
		return this.$userSettingsService.saveSettings({"TrackFeatureUsage": true});
	}

	private disableAnalytics(): IFuture<void> {
		return(() => {
			this.$userSettingsService.saveSettings({"TrackFeatureUsage": false}).wait();

			if(this._eqatecMonitor) {
				this._eqatecMonitor.stop();
			}
		}).future<void>()();
	}

	private status(): IFuture<boolean> {
		return this.$userSettingsService.getValue("TrackFeatureUsage");
	}

	public analyticsCommand(arg: string): IFuture<any> {
		return(() => {
			if(arg === AnalyticsCommandType[AnalyticsCommandType.status]) {
				var status = this.status().wait();
				var statusMessage = status === null ? "undeterminated" : (status ? "enabled" : "disabled");
				this.$logger.out("The current status of analytics is: '%s'", statusMessage);
				return status;
			} else if(arg === AnalyticsCommandType[AnalyticsCommandType.enable]) {
				this.enableAnalytics().wait();
				this.$logger.out("The analytics has been successfully enabled");
			} else if(arg === AnalyticsCommandType[AnalyticsCommandType.disable]) {
				this.disableAnalytics().wait();
				this.$logger.out("The analytics has been successfully disabled");
			}
		}).future<any>()();
	}
}
$injector.register("analyticsService", AnalyticsService);

helpers.registerCommand("analyticsService", "analytics", (analyticsService, args) => analyticsService.analyticsCommand(args[0]), true);