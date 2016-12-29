import semver = require("semver");

export class SetWebViewCommand implements ICommand {
	constructor(private $webViewService: IWebViewService,
		private $injector: IInjector,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject) { }

	public async execute(args: string[]): Promise<void> {
			await this.$webViewService.enableWebView(args[0], args[1], this.$project.projectData.FrameworkVersion);
			this.$logger.out(`Operation completed successfully. Your project now uses the ${args[1]} web view for ${args[0]}.`);
	}

	public async canExecute(args: string[]): Promise<boolean> {
			this.$project.ensureCordovaProject();

			if (!args[0] || !args[1]) {
				this.$errors.fail(`You must specify target platform and web view name.`);
			}

			let supportedWebViews = this.$webViewService.supportedWebViews;

			// Validate platform
			let platform = args[0].toLowerCase();
			let platforms = _.keys(supportedWebViews);
			if (!_.includes(platforms, platform)) {
				this.$errors.failWithoutHelp(`Invalid platform. You can set the web view for the following platforms: ${platforms.join(", ")}`);
			}

			// Validate webView
			let webViewName = args[1].toLowerCase();
			let webViewNames = this.$webViewService.getWebViewNames(platform);
			if (!_.includes(webViewNames, webViewName)) {
				this.$errors.failWithoutHelp(`Invalid web view. The valid ${platform} web views are: ${webViewNames.join(", ")}`);
			}

			// Validate project version
			let currentProjectVersion = this.$project.projectData.FrameworkVersion;
			let webView = this.$webViewService.getWebView(platform, webViewName, this.$project.projectData.FrameworkVersion);
			if (semver.lt(currentProjectVersion, webView.minSupportedVersion)) {
				this.$errors.failWithoutHelp(`You cannot set the ${webViewName} web view for projects that target Apache Cordova ${currentProjectVersion}. Your project must target Apache Cordova ${webView.minSupportedVersion} or later. Run \`$ appbuilder mobileframework\` set to change your target framework version.`);
			}

			return true;
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("webview|set", SetWebViewCommand);
