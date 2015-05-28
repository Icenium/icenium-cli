///<reference path="../.d.ts"/>
"use strict";
import semver = require("semver");

export class WebViewService implements IWebViewService {
	
	constructor(private $errors: IErrors,
		private $pluginsService: IPluginsService,
		private $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $options: IOptions) { }
	
	public get supportedWebViews(): IDictionary<IWebView[]> { 
		return {
			'ios': [ 
				{ name: "default", minSupportedVersion: "3.0.0", default: true }, 
				{ name: "WKWebView", minSupportedVersion: "3.7.0", pluginIdentifier: "com.telerik.plugins.wkwebview" }],
			'android': [
				{ name: "default", minSupportedVersion: "3.0.0", default: true }, 
				{ name: "Crosswalk", minSupportedVersion: "4.0.0", pluginIdentifier: "cordova-plugin-crosswalk-webview" }]
		}
	}
	
	public getWebView(platform: string, webViewName: string): IWebView {
		let webViews = this.getWebViews(platform);
		let webViewNameLowerCase = webViewName.toLowerCase();		
		let webView = _.find(webViews, webView => webView.name.toLowerCase() === webViewNameLowerCase);
		return webView;
	}
	
	public getWebViews(platform: string): IWebView[] {
		 return this.supportedWebViews[platform.toLowerCase()];	
	}
	
	public getWebViewNames(platform: string): string[] {
		let webViews = this.getWebViews(platform);
		return _.map(webViews, webView => webView.name.toLowerCase());	
	}
	
	public enableWebView(platform: string, webViewName: string): IFuture<void> {
		let webView = this.getWebView(platform, webViewName);
		if(webView.default) { 
			return this.enableDefaultWebView(platform);
		} 
		
		return this.enableWebViewCore(webView);
	}
	
	private enableWebViewCore(webView: IWebView): IFuture<void> {
		return (() => {
			if(!this.$pluginsService.isPluginInstalled(webView.pluginIdentifier)) {
				this.$options.default = true;				
				this.$pluginsService.configurePlugin(webView.pluginIdentifier).wait();
			}
		}).future<void>()();
	}
	
	private enableDefaultWebView(platform: string): IFuture<void> {
		return (() => {
			_(this.getWebViews(platform))
			.filter(webView => !webView.default && this.$pluginsService.isPluginInstalled(webView.pluginIdentifier))
			.each(webView => this.$pluginsService.removePlugin(webView.pluginIdentifier).wait())
			.value();
		}).future<void>()();
	}
}
$injector.register("webViewService", WebViewService);