export class WebViewService implements IWebViewService {

	constructor(private $errors: IErrors,
		private $pluginsService: IPluginsService,
		private $project: Project.IProject,
		private $projectConstants: Project.IConstants,
		private $options: IOptions) { }

	public get supportedWebViews(): IDictionary<IWebView[]> {
		return {
			'ios': [
				{ name: "Default", minSupportedVersion: "3.0.0", default: true },
				{ name: "WKWebView", minSupportedVersion: "3.7.0", pluginIdentifier: "com.telerik.plugins.wkwebview" }],
			'android': [
				{ name: "Default", minSupportedVersion: "3.0.0", default: true },
				{ name: "Crosswalk", minSupportedVersion: "4.0.0", pluginIdentifier: "cordova-plugin-crosswalk-webview" }]
		};
	}

	public getWebView(platform: string, webViewName: string): IWebView {
		let webViews = this.getWebViews(platform);
		let webViewNameLowerCase = webViewName.toLowerCase();
		let webView = _.find(webViews, _webView => _webView.name.toLowerCase() === webViewNameLowerCase);
		return webView;
	}

	public getWebViews(platform: string): IWebView[] {
		 return this.supportedWebViews[platform.toLowerCase()];
	}

	public getWebViewNames(platform: string): string[] {
		let webViews = this.getWebViews(platform);
		return _.map(webViews, webView => webView.name.toLowerCase());
	}

	public getCurrentWebViewName(platform: string): string {
		let webViews = this.getWebViews(platform);
		let webView = _.find(webViews, _webView => !_webView.default && this.$pluginsService.isPluginInstalled(_webView.pluginIdentifier));
		if (webView) {
			return webView.name;
		}

		return _.find(webViews, _webView => _webView.default).name;
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
				this.$pluginsService.addPlugin(webView.pluginIdentifier).wait();
			}
		}).future<void>()();
	}

	private enableDefaultWebView(platform: string): IFuture<void> {
		return (() => {
			_(this.getWebViews(platform))
			.filter(webView => !webView.default && this.$pluginsService.isPluginInstalled(webView.pluginIdentifier))
			.each(webView => this.$pluginsService.removePlugin(webView.pluginIdentifier).wait());
		}).future<void>()();
	}
}
$injector.register("webViewService", WebViewService);
