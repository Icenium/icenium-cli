///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import path = require("path");
import helpers = require("./../helpers");
import options = require("./../options");
import os = require("os");

var TRACK_FEATURE_USAGE_SETTING_NAME = "AnalyticsSettings.TrackFeatureUsage";

export class AnalyticsService implements IAnalyticsService {
	private _eqatecMonitor;
	private trackFeatureUsage: boolean = false;

	private excluded = ["help", "feature-usage-tracking"];

	constructor(private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $errors: IErrors,
		private $prompter: IPrompter,
		private $clientSpecificUserSettingsService: IUserSettingsService,
		private $sharedUserSettingsService: IUserSettingsService,
		private $userDataStore: IUserDataStore,
		private $loginManager: ILoginManager) { }

	public checkConsent(featureName: string): IFuture<void> {
		return ((): void => {
			var trackFeatureUsage = null;

			if (this.$loginManager.isLoggedIn().wait()) {
				trackFeatureUsage = this.$sharedUserSettingsService.getValue(TRACK_FEATURE_USAGE_SETTING_NAME).wait();

				if(helpers.isInteractive() && !_.contains(this.excluded, featureName) && trackFeatureUsage === null) {
					var message = "Do you want to help us improve " +
						"Telerik".white.bold + " " + "AppBuilder".cyan.bold
						+ " by automatically sending anonymous usage statistics? We will not use this information to identify or contact you."
						+ " You can read our official Privacy Policy at\nhttp://www.telerik.com/company/privacy-policy";

					trackFeatureUsage = this.$prompter.confirm(message, () => "y").wait();
					this.$sharedUserSettingsService.saveSettings(this.createSettingsObject(trackFeatureUsage)).wait();
				}
			}

			this.trackFeatureUsage = helpers.toBoolean(trackFeatureUsage);
		}).future<void>()();
	}

	private createSettingsObject(trackFeatureUsage: boolean): {[key: string]: {}} {
		var settingsObject: any = {};
		settingsObject[TRACK_FEATURE_USAGE_SETTING_NAME] = trackFeatureUsage;
		return settingsObject;
	}

	private start(): IFuture<void> {
		return(() => {
			if(this._eqatecMonitor || !this.trackFeatureUsage) {
				return;
			}

			global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
			global.userAgent = this.getUserAgentString();

			require("../../vendor/EqatecMonitor");

			var settings = global._eqatec.createSettings(this.$staticConfig.ANALYTICS_API_KEY);
			settings.version = this.$staticConfig.version;
			settings.loggingInterface = {
				logMessage: this.$logger.trace.bind(this.$logger),
				logError: this.$logger.debug.bind(this.$logger)
			};

			this._eqatecMonitor = global._eqatec.createMonitor(settings);

			var guid = this.$clientSpecificUserSettingsService.getValue("AnalyticsInstallationID").wait();
			if (!guid) {
				guid = require("node-uuid").v4();
				this.$clientSpecificUserSettingsService.saveSettings({AnalyticsInstallationID: guid}).wait();
			}
			this.$logger.trace("AnalyticsInstallationID: %s", guid);
			this._eqatecMonitor.setInstallationID(guid);

			try {
				var user = this.$userDataStore.getUser().wait();
				this._eqatecMonitor.setUserID(user.uid);
			} catch (e) {
				// user not logged in. don't care.
			}

			this._eqatecMonitor.start();
		}).future<void>()();
	}

	public trackFeature(featureName: string): IFuture<void> {
		return (() => {
			try {
				this.start().wait();

				if (this._eqatecMonitor) {
					var category = options.client ||
						(helpers.isInteractive() ? "CLI" : "Non-interactive");
					this._eqatecMonitor.trackFeature(category + "." + featureName);
				}
			} catch(e) {
				this.$logger.trace("Analytics exception: '%s'", e.toString());
			}
		}).future<void>()();
	}

	public trackException(exception: any, message: string): IFuture<void> {
		return (() => {
			try {
				this.start().wait();

				if(this._eqatecMonitor) {
					this._eqatecMonitor.trackException(exception, message);
				}

			} catch(e) {
				this.$logger.trace("Analytics exception: '%s'", e.toString());
			}
		}).future<void>()();
	}

	private getUserAgentString(): string {
		var userAgentString: string;
		var osType = os.type();
		if(osType === "Windows_NT") {
			userAgentString = "(Windows NT " + os.release() + ")";
		} else if(osType === "Darwin") {
			userAgentString = "(Mac OS X " + os.release() + ")";
		}

		return userAgentString;
	}

	public analyticsCommand(arg: string): IFuture<any> {
		return(() => {
			switch(arg) {
				case "enable":
					this.enableAnalytics().wait();
					this.$logger.info("Feature usage tracking is now enabled.");
					break;
				case "disable":
					this.disableAnalytics().wait();
					this.$logger.info("Feature usage tracking is now disabled.");
					break;
				case "status":
				case undefined:
					var status = this.getStatus().wait();
					this.$logger.out(this.getStatusMessage(status));
					break;
				default:
					this.$errors.fail("Invalid parameter");
					break;
			}
		}).future<any>()();
	}

	private enableAnalytics(): IFuture<void> {
		return this.setAnalytics(true);
	}

	private disableAnalytics(): IFuture<void> {
		return(() => {
			this.setAnalytics(false).wait();

			if(this._eqatecMonitor) {
				this._eqatecMonitor.stop();
			}
		}).future<void>()();
	}

	private setAnalytics(enabled: boolean): IFuture<void> {
		return this.$sharedUserSettingsService.saveSettings({"AnalyticsSettings.TrackFeatureUsage": enabled});
	}

	private getStatus(): IFuture<boolean> {
		return (() => {
			var trackFeatureUsage = this.$sharedUserSettingsService.getValue(TRACK_FEATURE_USAGE_SETTING_NAME).wait();
			if (trackFeatureUsage) {
				return helpers.toBoolean(trackFeatureUsage);
			}
			return undefined;
		}).future<boolean>()();
	}

	private getStatusMessage(trackFeatureUsage?: boolean): string {
		if (options.json) {
			return this.getJsonStatusMessage(trackFeatureUsage);
		} else {
			return this.getHumanReadableStatusMessage(trackFeatureUsage);
		}
	}

	private getHumanReadableStatusMessage(trackFeatureUsage?: boolean): string {
		var status: string;
		if (trackFeatureUsage) {
			status = "enabled";
		} else if (trackFeatureUsage === undefined) {
			status = "disabled until confirmed";
		} else {
			status = "disabled";
		}
		return util.format("Feature usage tracking is %s.", status);
	}

	private getJsonStatusMessage(trackFeatureUsage?: boolean): string {
		return JSON.stringify({ enabled: trackFeatureUsage !== undefined ? trackFeatureUsage : null });
	}
}
$injector.register("analyticsService", AnalyticsService);

helpers.registerCommand("analyticsService", "feature-usage-tracking",
	(analyticsService: AnalyticsService, args: string[]) => analyticsService.analyticsCommand(args[0]));
