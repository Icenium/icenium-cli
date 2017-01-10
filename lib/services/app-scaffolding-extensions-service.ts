import { ExtensionsServiceBase } from "./extensions-service-base";
import * as path from "path";
import * as semver from "semver";

export class AppScaffoldingExtensionsService extends ExtensionsServiceBase implements IAppScaffoldingExtensionsService {
	private static APP_SCAFFOLDING_NAME = "app-scaffolding";
	private static SCREEN_BUILDER_BUCKET_NAME = "http://s3.amazonaws.com/screenbuilder-cli";
	private static DEFAULT_CACHED_VERSION = "0.0.0";

	constructor(private $childProcess: IChildProcess,
		private $config: IConfiguration,
		private $dependencyConfigService: IDependencyConfigService,
		private $progressIndicator: IProgressIndicator,
		private $sysInfo: ISysInfo,
		protected $fs: IFileSystem,
		protected $httpClient: Server.IHttpClient,
		protected $logger: ILogger,
		protected $options: IOptions) {
		super($options.screenBuilderCacheDir, $fs, $httpClient, $logger, $options);
	}

	public get appScaffoldingPath(): string {
		return this.getExtensionPath(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME);
	}

	public async prepareAppScaffolding(): Promise<void> {
		let appScaffoldingConfig = this.$dependencyConfigService.getAppScaffoldingConfig();
		appScaffoldingConfig.pathToSave = this.$options.screenBuilderCacheDir;
		let afterPrepareAction = async () => {
			let scaffoldingNodeModulesPath = path.join(this.appScaffoldingPath, "node_modules");
			if (this.$fs.exists(scaffoldingNodeModulesPath)) {
				// Call npm install for each dependency that ships with the scaffolding package itself
				// this is done because calling npm install inside the scaffolding directory doesn't install dependencies' dependencies on some versions of npm
				await Promise.all(_.map(this.$fs.readDirectory(scaffoldingNodeModulesPath), async dir => {
					await this.npmInstall(null, path.join(scaffoldingNodeModulesPath, dir));
				}));
			}
			// HACK: Some of screen builder's dependencies generate paths which are too long for Windows OS to handle
			// this is why we pre-install them so that they're at the highest point in the dependency depth.
			// This leads to shortening the paths just enough to be safe about it.
			// Note that if one of these modules' versions is changed this needs to be reflected in the code too!
			await Promise.all(_.map(["vinyl-fs@2.2.1", "gulp-decompress@1.2.0"], async dependency => await this.npmInstall(dependency)));

			let generatorBaseDependencies = require(path.join(this.appScaffoldingPath, "node_modules", "screen-builder-base-generator", "package.json")).dependencies;
			await Promise.all(_.map(generatorBaseDependencies, (value, key) => this.npmInstall(`${key}@${value}`)));
			await this.npmInstall();
			let userNpmVersion = await this.$sysInfo.getNpmVersion();
			// If the user machine has npm 3 we don't need to run `$ npm dedupe` because npm itself dedupes dependencies while installing them.
			if (!userNpmVersion || !semver.valid(userNpmVersion) || semver.major(userNpmVersion) !== 3) {
				await this.npmDedupe();
			}
		};

		await this.prepareDependencyExtension(AppScaffoldingExtensionsService.APP_SCAFFOLDING_NAME, appScaffoldingConfig, afterPrepareAction);
	}

	public async prepareDependencyExtension(dependencyExtensionName: string, dependencyConfig: IDependencyConfig, afterPrepareAction?: () => Promise<void>): Promise<void> {
		let extensionVersion = this.getExtensionVersion(dependencyExtensionName);
		let cachedVersion = extensionVersion || AppScaffoldingExtensionsService.DEFAULT_CACHED_VERSION;
		let downloadUrl = this.$config.ON_PREM ? `${this.$config.AB_SERVER}/downloads/sb/generators/${dependencyExtensionName}/${dependencyConfig.version}` : `${AppScaffoldingExtensionsService.SCREEN_BUILDER_BUCKET_NAME}/v${dependencyConfig.version}/${dependencyExtensionName}.zip`;

		this.$logger.trace("prepareDependencyExtension: Download url: %s, cached version: %s", downloadUrl, cachedVersion);

		if (this.shouldUpdatePackage(cachedVersion, dependencyConfig.version)) {
			this.$logger.out("Please, wait while Screen Builder and its dependencies are being configured.");
			this.$logger.out("Preparing %s", dependencyExtensionName);

			let dependencyExtensionData = {
				packageName: dependencyExtensionName,
				version: dependencyConfig.version,
				downloadUri: downloadUrl,
				pathToSave: dependencyConfig.pathToSave
			};

			await this.$progressIndicator.showProgressIndicator(this.prepareExtensionBase(dependencyExtensionData, cachedVersion, { afterDownloadAction: async () => await this.$progressIndicator.showProgressIndicator(afterPrepareAction(), 100) }), 5000);
		}
	}

	protected async npmInstall(packageToInstall?: string, cwd?: string): Promise<void> {
		packageToInstall = packageToInstall || "";
		let command = `npm install ${packageToInstall} --production`;
		return this.$childProcess.exec(command, { cwd: cwd || this.appScaffoldingPath });
	}

	protected async npmDedupe(): Promise<void> {
		return this.$childProcess.exec("npm dedupe", { cwd: this.appScaffoldingPath });
	}
}

$injector.register("appScaffoldingExtensionsService", AppScaffoldingExtensionsService);
