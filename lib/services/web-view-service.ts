import * as semver from "semver";

export class WebViewService implements IWebViewService {
	private static CORDOVA_VERSION_FIVE = "5.0.0";

	constructor(private $errors: IErrors,
		private $pluginsService: IPluginsService,
		private $projectConstants: Project.IConstants,
		private $options: IOptions) { }

	public get supportedWebViews(): IDictionary<IWebView[]> {
		return {
			'ios': [
				{ name: "Default", minSupportedVersion: "3.0.0", default: true },
				{ name: "WKWebView", minSupportedVersion: "3.7.0", pluginIdentifier: "com.telerik.plugins.wkwebview", frameworkVersionCondition: `<${WebViewService.CORDOVA_VERSION_FIVE}` },
				{ name: "WKWebView", minSupportedVersion: WebViewService.CORDOVA_VERSION_FIVE, pluginIdentifier: "cordova-plugin-wkwebview-engine", frameworkVersionCondition: `>=${WebViewService.CORDOVA_VERSION_FIVE}` }],
			'android': [
				{ name: "Default", minSupportedVersion: "3.0.0", default: true },
				{ name: "Crosswalk", minSupportedVersion: "4.0.0", pluginIdentifier: "cordova-plugin-crosswalk-webview" }]
		};
	}

	public getWebView(platform: string, webViewName: string, frameworkVersion: string): IWebView {
		let webViews = this.getWebViews(platform);
		let webViewNameLowerCase = webViewName.toLowerCase();
		let webView = _.find(webViews, _webView => {
			let hasTheSameName = _webView.name.toLowerCase() === webViewNameLowerCase;
			let hasTheRequiredFrameworkVersion = true;
			if (_webView.frameworkVersionCondition) {
				hasTheRequiredFrameworkVersion = semver.satisfies(frameworkVersion, _webView.frameworkVersionCondition);
			}

			return hasTheSameName && hasTheRequiredFrameworkVersion;
		});
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

	public async enableWebView(platform: string, webViewName: string, frameworkVersion: string): Promise<void> {
		let webView = this.getWebView(platform, webViewName, frameworkVersion);
		if (webView.default) {
			return this.enableDefaultWebView(platform);
		}

		return this.enableWebViewCore(webView);
	}

	private async enableWebViewCore(webView: IWebView): Promise<void> {
			if (!this.$pluginsService.isPluginInstalled(webView.pluginIdentifier)) {
				this.$options.default = true;
				await this.$pluginsService.addPlugin(webView.pluginIdentifier);
			}
	}

	private async enableDefaultWebView(platform: string): Promise<void> {
			_(this.getWebViews(platform))
				.filter(webView => !webView.default && this.$pluginsService.isPluginInstalled(webView.pluginIdentifier))
				.each(webView => await  this.$pluginsService.removePlugin(webView.pluginIdentifier));
	}
}
$injector.register("webViewService", WebViewService);
