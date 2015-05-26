///<reference path="../../.d.ts"/>
"use strict";
import commandParams = require("../../common/command-params");
import semver = require("semver");

export class SetWebViewCommand implements ICommand {
	constructor(private $webViewService: IWebViewService,
		private $injector: IInjector,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject) { }
	
	public execute(args: string[]): IFuture<void> {
		return (() => {		
			this.$webViewService.enableWebView(args[0], args[1]).wait();
			this.$logger.out("WebView has been successfully changed.");
		}).future<void>()();
	}
	
	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			this.$project.ensureCordovaProject(); 			
			
			if(!args[0] || !args[1]) {
				this.$errors.fail(`Platform and WebView name are mandory params.`);
			}
						
			let supportedWebViews = this.$webViewService.supportedWebViews;
			
			// Validate platform
			let platform = args[0].toLowerCase();
			let platforms = _.keys(supportedWebViews);
			if(!_.contains(platforms, platform)) {
				this.$errors.failWithoutHelp(`Invalid platform. The valid platforms that support webView are: ${platforms.join(", ")}`);
			}
			
			// Validate webView
			let webViewName = args[1].toLowerCase();						
			let webViewNames = this.$webViewService.getWebViewNames(platform);
			if(!_.contains(webViewNames, webViewName)) {
				this.$errors.failWithoutHelp(`Invalid WebView. The valid WebViews for ${platform} platform are: ${webViewNames.join(", ")}`);
			}
			
			// Validate project version
			let currentProjectVersion = this.$project.projectData.FrameworkVersion;
			let webView = this.$webViewService.getWebView(platform, webViewName);
			if(semver.lt(currentProjectVersion, webView.minSupportedVersion)) {
				this.$errors.failWithoutHelp(`You are not able to use ${webViewName} WebView with ${currentProjectVersion} version of Cordova. The min supported version of ${webViewName} is ${webView.minSupportedVersion}`);
			}
			
			return true;
			
		}).future<boolean>()();
	}
	
	public allowedParameters: ICommandParameter[] = [];		
}
$injector.registerCommand("web-view|set", SetWebViewCommand);
