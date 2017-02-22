import * as semver from "semver";

export class WebViewService implements IWebViewService {
	private static CORDOVA_VERSION_FIVE = "5.0.0";

	constructor(private $pluginsService: IPluginsService,
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

	public async getCurrentWebViewName(platform: string): Promise<string> {
		let webViews = this.getWebViews(platform);
		let webViewsToFilter = await Promise.all(_.map(webViews, async _webView => {
			return !_webView.default && await this.$pluginsService.isPluginInstalled(_webView.pluginIdentifier) ? _webView : null;
		}));
		let webView = _(webViewsToFilter)
			.filter(w => !!w)
			.first();

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
		if (!await this.$pluginsService.isPluginInstalled(webView.pluginIdentifier)) {
			this.$options.default = true;
			await this.$pluginsService.addPlugin(webView.pluginIdentifier);
		}
	}

	private async enableDefaultWebView(platform: string): Promise<void> {
		let webViews = this.getWebViews(platform);
		let webViewsToFilter = await Promise.all(_.map(webViews, async webView => {
			return !webView.default && await this.$pluginsService.isPluginInstalled(webView.pluginIdentifier) ? webView : null;
		}));
		let filteredWebViews = _.filter(webViewsToFilter);

		await Promise.all(_.map(filteredWebViews, async webView => await this.$pluginsService.removePlugin(webView.pluginIdentifier)));
	}
}

$injector.register("webViewService", WebViewService);
