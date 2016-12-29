//
// automatically generated code; do not edit manually!
//
declare module Server{
	interface Tenant{
		id: string;
		name: string;
		expSoft: Date;
		expStrict: Date;
		edition: string;
		editionType: string;
		status: string;
		projectSlots: number;
		license: string;
		features: IDictionary<boolean>;
	}
	interface IUser{
		Email: string;
		UniqueIdentifier: string;
		UserName: string;
		HasAgreedToEula: boolean;
		Tenant: Server.Tenant;
	}
	const enum EditionType{
		Starter,
		Developer,
		DeveloperPlus,
		Professional,
		Business,
	}
	const enum TenantStatus{
		Active,
		Suspended,
		Disabled,
		Incomplete,
	}
	const enum LicenseType{
		Purchase,
		Trial,
	}
	interface IAuthenticationServiceContract{
		login(simpleWebToken: string): Promise<Server.IUser>;
		logout(): Promise<void>;
		getLoggedInUser(): Promise<Server.IUser>;
		getTenants(): Promise<Server.Tenant[]>;
		setActiveTenant(tenantId: string): Promise<Server.IUser>;
		agreeToEula(): Promise<void>;
	}
	interface ApplicationProjectInfo{
		AppId: string;
		ProjectName: string;
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface PropertyMigration{
		BaseValue: string;
		Type: string;
		Values: IDictionary<string>;
	}
	interface MigrationResult{
		MigratedFileEntries: IDictionary<MigrationType>;
		MigratedProperties: IDictionary<PropertyMigration>;
	}
	interface CordovaPluginData{
		Assets: string[];
		AndroidRequiredPermissions: string[];
		Name: string;
		Identifier: string;
		Version: string;
		Description: string;
		Url: string;
		Platforms: Server.DevicePlatform[];
		Variables: string[];
	}
	interface CordovaPluginVariablesData{
		BaseVariables: any;
		PerConfigurationVariables: any;
	}
	const enum MigrationType{
		Create,
		Update,
		Delete,
	}
	const enum DevicePlatform{
		iOS,
		Android,
		WP8,
	}
	interface IAppsCordovaServiceContract{
		getLiveSyncToken(appId: string, projectName: string): Promise<string>;
		getCurrentPlatforms(appId: string, projectName: string): Promise<Server.DevicePlatform[]>;
		addPlatform(appId: string, projectName: string, platform: Server.DevicePlatform): Promise<Server.MigrationResult>;
		migrate(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>;
		getProjectCordovaPlugins(appId: string, projectName: string): Promise<Server.CordovaPluginData[]>;
		getCordovaPluginVariables(appId: string, projectName: string): Promise<Server.CordovaPluginVariablesData>;
		setCordovaPluginVariable(appId: string, projectName: string, pluginId: string, variableName: string, configuration: string, value: string): Promise<void>;
	}
	interface ProjectInfo{
		ProjectName: string;
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface CordovaRenamedPlugin{
		Version: string;
		OldName: string;
		NewName: string;
	}
	interface FrameworkVersion{
		Version: string;
		BuildTools: any;
		DisplayName: string;
	}
	interface CordovaMigrationData{
		RenamedPlugins: Server.CordovaRenamedPlugin[];
		SupportedVersions: string[];
		SupportedFrameworkVersions: Server.FrameworkVersion[];
		IntegratedPlugins: any;
	}
	interface MarketplacePluginPublisher{
		Name: string;
		Url: string;
	}
	interface MarketplacePluginData{
		Name: string;
		Identifier: string;
		Version: string;
		Description: string;
		Url: string;
		Platforms: Server.DevicePlatform[];
		Variables: string[];
		Publisher: Server.MarketplacePluginPublisher;
		Authors: string[];
		DownloadsCount: number;
		SupportedVersion: string;
		Assets: string[];
		AndroidRequiredPermissions: string[];
	}
	interface MarketplacePluginVersionsData{
		Identifier: string;
		DefaultVersion: string;
		Framework: string;
		Versions: Server.MarketplacePluginData[];
	}
	interface CordovaMarketplacePluginData{
		Publisher: Server.MarketplacePluginPublisher;
		Authors: string[];
		DownloadsCount: number;
		SupportedVersion: string;
		Assets: string[];
		AndroidRequiredPermissions: string[];
		Name: string;
		Identifier: string;
		Version: string;
		Description: string;
		Url: string;
		Platforms: Server.DevicePlatform[];
		Variables: string[];
	}
	interface CordovaMarketplacePluginVersionsData{
		Versions: Server.CordovaMarketplacePluginData[];
		Identifier: string;
		DefaultVersion: string;
		Framework: string;
		PageUrl: string;
		VersionsRetrievalFailed: boolean;
	}
	interface ICordovaServiceContract{
		getLiveSyncToken(solutionName: string, projectName: string): Promise<string>;
		getLiveSyncUrl(longUrl: string): Promise<string>;
		getPlugins(version: string): Promise<Server.CordovaPluginData[]>;
		getJs(version: string, platform: Server.DevicePlatform, $resultStream: any): Promise<void>;
		getMigrationData(): Promise<Server.CordovaMigrationData>;
		getPluginsPackage($resultStream: any): Promise<void>;
		getCordovaVersions(): Promise<string[]>;
		getCordovaFrameworkVersions(): Promise<Server.FrameworkVersion[]>;
		getMarketplacePluginData(pluginId: string, version: string): Promise<Server.CordovaPluginData>;
		getMarketplacePluginsData(framework: string): Promise<Server.MarketplacePluginVersionsData[]>;
		getMarketplacePluginVersionsData(): Promise<Server.CordovaMarketplacePluginVersionsData[]>;
		getCurrentPlatforms(solutionName: string, projectName: string): Promise<Server.DevicePlatform[]>;
		addPlatform(platform: Server.DevicePlatform, solutionName: string, projectName: string): Promise<Server.MigrationResult>;
		migrate(solutionName: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>;
		getProjectCordovaPlugins(solutionName: string, projectName: string): Promise<Server.CordovaPluginData[]>;
		getCordovaPluginVariables(solutionName: string, projectName: string): Promise<Server.CordovaPluginVariablesData>;
		setCordovaPluginVariable(solutionName: string, projectName: string, pluginId: string, variableName: string, configuration: string, value: string): Promise<void>;
	}
	interface CryptographicIdentityData{
		Alias: string;
		Attributes: IDictionary<string>;
		Certificate: string;
		Thumbprint: string;
		ExpirationDate: Date;
	}
	interface IdentityGenerationData{
		SubjectNameValues: IDictionary<string>;
		Attributes: IDictionary<string>;
		StartDate: Date;
		EndDate: Date;
	}
	interface CertificateRequestData{
		UniqueName: string;
		Subject: string;
	}
	const enum ImportType{
		Pkcs12,
		X509Certificate,
	}
	interface IIdentityStoreServiceContract{
		getIdentities(): Promise<Server.CryptographicIdentityData[]>;
		generateSelfSignedIdentity(generationData: Server.IdentityGenerationData): Promise<Server.CryptographicIdentityData>;
		importIdentity(importType: Server.ImportType, password: string, stream: any): Promise<Server.CryptographicIdentityData[]>;
		removeIdentity(identityAlias: string): Promise<void>;
		getIdentity(identityAlias: string, password: string, $resultStream: any): Promise<void>;
		getCertificateRequests(): Promise<Server.CertificateRequestData[]>;
		generateCertificationRequest(subjectNameValues: IDictionary<string>): Promise<Server.CertificateRequestData>;
		removeCertificateRequest(uniqueName: string): Promise<void>;
		getCertificateRequest(uniqueName: string, $resultStream: any): Promise<void>;
	}
	interface EverliveApplicationData{
		originalId: string;
		name: string;
	}
	interface IEverliveServiceContract{
		getAuthorizationHeader(): Promise<string>;
		getEverliveApplications(accountId: string): Promise<Server.EverliveApplicationData[]>;
	}
	interface Object{
	}
	interface IExtensionsServiceContract{
		getExtensions(frameworkVersion: string): Promise<any>;
		getFile(path: string, $resultStream: any): Promise<void>;
	}
	interface IUploadServiceContract{
		completeUpload(path: string, originalFileHash: string): Promise<void>;
		initUpload(path: string): Promise<void>;
		uploadChunk(path: string, content: any): Promise<void>;
	}
	interface ApplicationInfo{
		AppId: string;
		IsMigrated: boolean;
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface IAppsFilesServiceContract{
		getFile(appId: string, path: string, $resultStream: any): Promise<void>;
		save(appId: string, path: string, content: any): Promise<void>;
		createDirectory(appId: string, path: string): Promise<void>;
		remove(appId: string, path: string): Promise<void>;
	}
	interface SolutionInfo{
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface IFilesystemServiceContract{
		getContent(solutionName: string, path: string, $resultStream: any): Promise<void>;
		getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): Promise<void>;
		save(solutionName: string, path: string, content: any): Promise<void>;
		createDirectory(solutionName: string, path: string): Promise<void>;
		remove(solutionName: string, path: string): Promise<void>;
	}
	interface Size{
		Width: number;
		Height: number;
	}
	const enum ImageType{
		Icon,
		SplashScreen,
		NinePatch,
	}
	interface IAppsImagesServiceContract{
		resizeImage(appId: string, path: string, size: Server.Size): Promise<void>;
		generate(appId: string, projectName: string, type: Server.ImageType, image: any): Promise<string[]>;
	}
	interface IImagesServiceContract{
		resizeImage(solutionName: string, path: string, size: Server.Size): Promise<void>;
		generate(solutionName: string, projectName: string, type: Server.ImageType, image: any): Promise<string[]>;
		generateArchive(type: Server.ImageType, image: any, $resultStream: any): Promise<void>;
	}
	interface IAppsItmstransporterServiceContract{
		uploadApplicationFromUri(appId: string, projectName: string, adamId: number, packageUri: string, username: string, password: string): Promise<void>;
		uploadApplication(appId: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): Promise<void>;
	}
	interface Application{
		AppleID: number;
		ReservedBundleIdentifier: string;
		Application: string;
		SKUNumber: string;
		VersionNumber: string;
		IconURL: string;
	}
	interface IItmstransporterServiceContract{
		getApplicationsReadyForUpload(username: string, password: string): Promise<Server.Application[]>;
		uploadApplicationFromUri(solutionName: string, projectName: string, adamId: number, packageUri: string, username: string, password: string): Promise<void>;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): Promise<void>;
	}
	interface KendoDownloadablePackageData{
		Id: string;
		DownloadUrl: string;
		ReleaseNotesUrl: string;
		NeedPurchase: boolean;
		VersionTags: string[];
		HasReleaseNotes: boolean;
		Name: string;
		Version: string;
	}
	interface KendoPackageData{
		Name: string;
		Version: string;
	}
	interface IKendoServiceContract{
		getPackages(): Promise<Server.KendoDownloadablePackageData[]>;
		changeKendoPackage(solutionName: string, projectName: string, packageId: string): Promise<void>;
		getCurrentPackage(solutionName: string, projectName: string): Promise<Server.KendoPackageData>;
	}
	interface IAppsKendoServiceContract{
		changeKendoPackage(appId: string, projectName: string, packageId: string): Promise<void>;
		getCurrentPackage(appId: string, projectName: string): Promise<Server.KendoPackageData>;
	}
	interface ProvisionData{
		Identifier: string;
		Name: string;
		ApplicationIdentifierPrefix: string;
		ApplicationIdentifier: string;
		ProvisionType: string;
		ExpirationDate: Date;
		Certificates: string[];
		ProvisionedDevices: string[];
		ApplicationGroups: string[];
	}
	const enum ProvisionType{
		Development,
		AppStore,
		AdHoc,
		Enterprise,
	}
	interface IMobileprovisionsServiceContract{
		getProvisions(): Promise<Server.ProvisionData[]>;
		importProvision(provision: any): Promise<Server.ProvisionData>;
		getProvision(identifier: string, $resultStream: any): Promise<void>;
		removeProvision(identifier: string): Promise<void>;
	}
	interface NativeScriptMarketplacePluginData{
		Publisher: Server.MarketplacePluginPublisher;
		Authors: string[];
		DownloadsCount: number;
		SupportedVersion: string;
		Name: string;
		Identifier: string;
		Version: string;
		Description: string;
		Url: string;
		Platforms: Server.DevicePlatform[];
		Variables: string[];
	}
	interface NativeScriptMarketplacePluginVersionsData{
		Versions: Server.NativeScriptMarketplacePluginData[];
		Identifier: string;
		DefaultVersion: string;
		Framework: string;
		PageUrl: string;
		VersionsRetrievalFailed: boolean;
	}
	interface INativescriptServiceContract{
		migrate(solutionName: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>;
		getMarketplacePluginVersionsData(): Promise<Server.NativeScriptMarketplacePluginVersionsData[]>;
	}
	interface IAppsNativescriptServiceContract{
		migrate(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>;
		migrate1(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>;
	}
	interface ProjectItemInfo{
		Project: Server.ProjectInfo;
		Type: string;
		Identifier: string;
	}
	interface NodeModulesInfo{
		CombinedDtsUrl: string;
		NodeModules: Server.ProjectItemInfo[];
		OperationStatus: string;
		Log: string;
		OperationId: string;
	}
	interface ProjectTemplateExpansionData{
		ProjectName: string;
		TemplateIdentifier: string;
		Framework: string;
		Arguments: IDictionary<string>;
	}
	interface ItemTemplateExpansionData{
		TemplateIdentifier: string;
		Framework: string;
		Arguments: IDictionary<string>;
	}
	const enum NpmInstallStatus{
		Unknown,
		NotSupported,
		Installing,
		FetchingDefinitions,
		Uploading,
		Completed,
		Failed,
	}
	interface IAppsProjectsServiceContract{
		exportProject(appId: string, projectName: string, skipMetadata: boolean, $resultStream: any): Promise<void>;
		importPackage(appId: string, projectName: string, parentIdentifier: string, archivePackage: any): Promise<void>;
		importProject(appId: string, projectName: string, cleanImport: boolean, package_: any): Promise<void>;
		importLocalProject(appId: string, projectName: string, bucketKey: string, cleanImport: boolean): Promise<void>;
		getProjectContents(appId: string, projectName: string): Promise<string>;
		saveProjectContents(appId: string, projectName: string, projectContents: string): Promise<void>;
		getProjectConfiguraitons(appId: string, projectName: string): Promise<string[]>;
		getNodeModules(appId: string, projectName: string, operationId: string): Promise<Server.NodeModulesInfo>;
		createProject(appId: string, projectName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>;
		deleteProject(appId: string, projectName: string): Promise<void>;
		setProjectProperty(appId: string, projectName: string, configuration: string, changeset: IDictionary<string>): Promise<void>;
		renameProject(appId: string, projectName: string, newProjectName: string): Promise<void>;
		createNewProjectItem(appId: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): Promise<Server.ProjectItemInfo[]>;
	}
	interface ProjectTemplateData{
		CanCreateProject: boolean;
		ProjectSubType: string;
		Name: string;
		Description: string;
		Category: string;
		Group: string;
		Identifier: string;
		Icon: string;
		DownloadUri: string;
		DefaultName: string;
		SortOrder: number;
		Hidden: boolean;
		ShortDescription: string;
	}
	interface ItemTemplateData{
		LanguageName: string;
		Name: string;
		Description: string;
		Category: string;
		Group: string;
		Identifier: string;
		Icon: string;
		DownloadUri: string;
		DefaultName: string;
		SortOrder: number;
		ProjectSubType: string;
		Hidden: boolean;
		ShortDescription: string;
	}
	interface IWorkspaceItemData{
		Name: string;
		Framework: string;
	}
	interface WorkspaceUpgradeInfo{
		Name: string;
		Description: string;
		DocumentationUrl: string;
		Mandatory: boolean;
	}
	interface SolutionData{
		Name: string;
		Items: Server.IWorkspaceItemData[];
		IsUpgradeable: boolean;
		UpgradeDetails: Server.WorkspaceUpgradeInfo[];
	}
	interface IProjectsServiceContract{
		getProjectTemplates(): Promise<Server.ProjectTemplateData[]>;
		getItemTemplates(): Promise<Server.ItemTemplateData[]>;
		exportSolution(solutionSpaceName: string, solutionName: string, skipMetadata: boolean, $resultStream: any): Promise<void>;
		exportProject(solutionSpaceName: string, solutionName: string, projectName: string, skipMetadata: boolean, $resultStream: any): Promise<void>;
		importPackage(solutionName: string, projectName: string, parentIdentifier: string, archivePackage: any): Promise<void>;
		importProject(solutionName: string, projectName: string, cleanImport: boolean, package_: any): Promise<void>;
		importLocalProject(solutionName: string, projectName: string, bucketKey: string, cleanImport: boolean): Promise<void>;
		getProjectContents(solutionName: string, projectName: string): Promise<string>;
		saveProjectContents(solutionName: string, projectName: string, projectContents: string): Promise<void>;
		getProjectConfiguraitons(solutionName: string, projectName: string): Promise<string[]>;
		upgradeSolution(solutionName: string, mandatoryOnly: boolean): Promise<void>;
		getSolution(solutionName: string): Promise<Server.SolutionData>;
		canLoadSolution(solutionName: string): Promise<boolean>;
		deleteSolution(solutionName: string): Promise<void>;
		createSolution(solutionName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>;
		getSolutionType(solutionName: string): Promise<string>;
		renameSolution(solutionName: string, newSolutionName: string): Promise<void>;
		createProject(solutionName: string, projectName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>;
		deleteProject(solutionName: string, projectName: string): Promise<void>;
		setProjectProperty(solutionName: string, projectName: string, configuration: string, changeset: IDictionary<string>): Promise<void>;
		renameProject(solutionName: string, projectName: string, newProjectName: string): Promise<void>;
		createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): Promise<Server.ProjectItemInfo[]>;
	}
	interface ApplicationCreationData{
		AccountId: string;
		AppData: IDictionary<Object>;
		ProjectName: string;
		TemplateIdentifier: string;
		Framework: string;
		Arguments: IDictionary<string>;
	}
	interface ApplicationServiceData{
		Type: string;
		Comparer: any;
		Count: number;
		Keys: string[];
		Values: Server.Object[];
		Item: Server.Object;
	}
	interface IAppsServiceContract{
		exportApplication(appId: string, skipMetadata: boolean, $resultStream: any): Promise<void>;
		createApplication(applicationData: Server.ApplicationCreationData): Promise<IDictionary<Object>>;
		enableApplication(appId: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>;
		getApplication(appId: string): Promise<Server.SolutionData>;
		canLoadApplication(appId: string): Promise<boolean>;
		deleteApplication(appId: string): Promise<void>;
		upgradeApplication(appId: string, mandatoryOnly: boolean): Promise<void>;
		getApplicationServices(appId: string, serviceNames: string[]): Promise<Server.ApplicationServiceData[]>;
		enableApplicationService(appId: string, serviceData: IDictionary<Object>): Promise<IDictionary<Object>>;
		getApplicationType(appId: string): Promise<string>;
		deleteApplicationCache(appId: string): Promise<void>;
	}
	interface PackageData{
		Name: string;
		Version: string;
	}
	interface BowerPackagesFilters{
		Blacklist: string[];
		DuplicatesList: IDictionary<string>;
	}
	interface IBowerServiceContract{
		installDependencies(solutionName: string, projectName: string): Promise<void>;
		installPackage(solutionName: string, projectName: string, packageName: string, version: string): Promise<void>;
		getInstalledPackages(solutionName: string, projectName: string): Promise<Server.PackageData[]>;
		getFilters(): Promise<Server.BowerPackagesFilters>;
	}
	interface IAppsBowerServiceContract{
		installDependencies(appId: string, projectName: string): Promise<void>;
		installPackage(appId: string, projectName: string, packageName: string, version: string): Promise<void>;
		getInstalledPackages(appId: string, projectName: string): Promise<Server.PackageData[]>;
	}
	interface BuildIssueData{
		Code: string;
		File: string;
		ProjectFile: string;
		Target: string;
		Message: string;
		LineNumber: number;
		ColumnNumber: number;
		EndLineNumber: number;
		EndColumnNumber: number;
		IsRealError: boolean;
	}
	interface TaskItemData{
		ItemSpec: string;
		Properties: IDictionary<string>;
		Comparer: any;
		Count: number;
		Keys: string[];
		Values: string[];
		Item: string;
	}
	interface TargetResultData{
		Status: string;
		Items: Server.TaskItemData[];
	}
	interface BuildResultData{
		Errors: Server.BuildIssueData[];
		Warnings: Server.BuildIssueData[];
		Output: string;
		ResultsByTarget: IDictionary<TargetResultData>;
	}
	interface BuildRequestData{
		Targets: string[];
		Properties: IDictionary<string>;
	}
	const enum TargetResultStatus{
		Failure,
		Skipped,
		Success,
	}
	interface IBuildServiceContract{
		buildProject(solutionName: string, projectName: string, buildRequest: Server.BuildRequestData): Promise<Server.BuildResultData>;
	}
	interface IAppsBuildServiceContract{
		buildProject(appId: string, projectName: string, buildRequest: Server.BuildRequestData): Promise<Server.BuildResultData>;
	}
	interface NpmSearchPackageEntry{
		Name: string;
		Description: string;
		Authors: string[];
		HomePage: string;
		Licenses: string[];
		Modified: Date;
		Version: string;
		KeyWords: string[];
		Rating: number;
	}
	interface NpmSearchResult{
		Results: Server.NpmSearchPackageEntry[];
		Total: number;
	}
	interface Repository{
		Type: string;
		Url: string;
	}
	interface NpmPluginVariablesData{
		DefaultValue: string;
	}
	interface NpmPluginNativeScriptData{
		Platforms: IDictionary<string>;
		Variables: IDictionary<NpmPluginVariablesData>;
	}
	interface NpmVersion{
		Name: string;
		Description: string;
		HomePage: string;
		Repository: Server.Repository;
		Version: string;
		NativeScriptData: Server.NpmPluginNativeScriptData;
	}
	interface NpmPackage{
		Name: string;
		Description: string;
		HomePage: string;
		Repository: Server.Repository;
		Versions: IDictionary<NpmVersion>;
		DistTags: IDictionary<string>;
		LatestVersion: string;
	}
	const enum SortOrder{
		Default,
		RatingAscending,
		RatingDescending,
	}
	interface INpmServiceContract{
		queryNpmSearch(packageName: string, size: number, sortOrder: Server.SortOrder, start: number): Promise<Server.NpmSearchResult>;
		getNpmPackageInfo(packageName: string): Promise<Server.NpmPackage>;
		getNpmPackageDownloads(packageName: string): Promise<number>;
	}
	interface FtpConnectionData{
		RemoteUrl: string;
		ShouldPurge: boolean;
		Username: string;
		Password: string;
	}
	interface IPublishServiceContract{
		publishFtp(solutionName: string, projectName: string, ftpConnectionData: Server.FtpConnectionData): Promise<void>;
	}
	interface IAppsPublishServiceContract{
		publishFtp(appId: string, projectName: string, ftpConnectionData: Server.FtpConnectionData): Promise<void>;
	}
	interface IRawSettingsServiceContract{
		getUserSettings(file: string, $resultStream: any): Promise<void>;
		saveUserSettings(file: string, content: any): Promise<void>;
		getSolutionUserSettings(solutionName: string, $resultStream: any): Promise<void>;
		saveSolutionUserSettings(solutionName: string, content: any): Promise<void>;
	}
	interface IAppsRawSettingsServiceContract{
		getSolutionUserSettings(appId: string, $resultStream: any): Promise<void>;
		saveSolutionUserSettings(appId: string, content: any): Promise<void>;
	}
	interface DevicePlatformIdentityAliasDictionary{
		Comparer: any;
		Count: number;
		Keys: Server.DevicePlatform[];
		Values: string[];
		Item: string;
	}
	interface ICodesigningIdentitySettings{
		ProjectCodesigningIdentity: IDictionary<DevicePlatformIdentityAliasDictionary>;
	}
	interface IMobileProjectProvisionSettings{
		ProjectProvision: IDictionary<string>;
	}
	interface ISolutionSettings{
		StartUpProject: string;
		BuildConfiguration: string;
	}
	interface SettingsData{
		CodesigningSettings: Server.ICodesigningIdentitySettings;
		ProvisionSettings: Server.IMobileProjectProvisionSettings;
		SolutionSettings: Server.ISolutionSettings;
	}
	interface ISettingsServiceContract{
		getSettings(solutionName: string): Promise<Server.SettingsData>;
		setCodesignIdentity(solutionName: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): Promise<void>;
		setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: string): Promise<void>;
		setActiveBuildConfiguration(buildConfiguration: string, solutionName: string): Promise<void>;
		updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: string): Promise<void>;
	}
	interface IAppsSettingsServiceContract{
		getSettings(appId: string): Promise<Server.SettingsData>;
		setCodesignIdentity(appId: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): Promise<void>;
		setMobileProvision(appId: string, projectIdentity: string, provisionIdentifier: string): Promise<void>;
		setActiveBuildConfiguration(appId: string, buildConfiguration: string): Promise<void>;
		updateSettingsProjectIdentifier(appId: string, projectIdentity: string, newProjectIdentity: string): Promise<void>;
	}
	interface UploadedAppData{
		InstallUrl: string;
		Id: string;
	}
	interface PublishSettings{
		IsPublished: boolean;
		IsPublic: boolean;
		NotifyByPush: boolean;
		NotifyByEmail: boolean;
		Groups: string[];
	}
	interface PatchData{
		Platforms: Server.DevicePlatform[];
		IsMandatory: boolean;
		ProjectConfiguration: string;
	}
	interface IAppsTamServiceContract{
		uploadApplicationFromUri(appId: string, projectName: string, packageUri: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>;
		uploadPatch(appId: string, projectName: string, patchData: Server.PatchData): Promise<void>;
		uploadApplication(appId: string, projectName: string, relativePackagePath: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>;
	}
	interface TamGroupData{
		Name: string;
		Id: string;
	}
	interface FeatureStatus{
		IsAvailable: boolean;
		IsAccountUpgradeRequired: boolean;
		StatusMessage: string;
	}
	interface ITamServiceContract{
		verifyStoreCreated(): Promise<void>;
		getGroups(): Promise<Server.TamGroupData[]>;
		uploadApplicationFromUri(solutionName: string, projectName: string, packageUri: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>;
		uploadPatch(solutionName: string, projectName: string, patchData: Server.PatchData): Promise<void>;
		getAccountStatus(): Promise<Server.FeatureStatus>;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>;
	}
	interface IAppsTapServiceContract{
		getRemote(appId: string): Promise<string>;
		setRemote(appId: string, remoteUrl: string): Promise<void>;
		initCurrentUserSharedRepository(appId: string): Promise<boolean>;
	}
	interface TapSolutionData{
		id: string;
		name: string;
		accountId: string;
		workspaceId: string;
		description: string;
	}
	interface Collaborator{
		email: string;
		role: string;
		id: string;
		name: string;
	}
	interface TapWorkspaceData{
		id: string;
		name: string;
	}
	interface TapNotificationData{
		Message: string;
		Date: Date;
		Url: string;
		Unread: boolean;
	}
	interface TapNotificationSummaryData{
		FirstUnreadNotification: Server.TapNotificationData;
		UnreadNotificationsCount: number;
	}
	interface ITapServiceContract{
		getFeatures(accountId: string, serviceType: string): Promise<string[]>;
		getExistingClientSolutions(): Promise<Server.TapSolutionData[]>;
		getRemote(solutionName: string): Promise<string>;
		setRemote(solutionName: string, remoteUrl: string): Promise<void>;
		getUsersForProject(solutionName: string): Promise<Server.Collaborator[]>;
		initCurrentUserSharedRepository(solutionName: string): Promise<boolean>;
		migrate(solutionName: string, appId: string): Promise<void>;
		getWorkspaces(accountId: string): Promise<Server.TapWorkspaceData[]>;
		getServiceApplications(serviceType: string, accountId: string): Promise<Server.TapSolutionData[]>;
		getServiceApplicationProjectKey(serviceType: string, id: string): Promise<string>;
		createServiceApplication(serviceType: string, workspaceId: string, applicationName: string, description: string): Promise<string>;
		getNotificationSummary(accountId: string): Promise<Server.TapNotificationSummaryData>;
		getUnreadNotifications(accountId: string): Promise<Server.TapNotificationData[]>;
		getReadNotifications(accountId: string, fromDate: Date): Promise<Server.TapNotificationData[]>;
	}
	interface BranchItemData{
		BranchName: string;
		LocalName: string;
		RemoteName: string;
		CommitsCount: number;
		CommitsAhead: number;
		CommitsBehind: number;
		VersionName: string;
		ShortText: string;
		CommentText: string;
		CommitTime: Date;
		AuthorName: string;
		AuthorEmail: string;
		CommitterName: string;
		CommitterEmail: string;
	}
	interface GitRemoteData{
		RemoteUrl: string;
		RemoteName: string;
	}
	interface VersionControlData{
		CanCommit: boolean;
		CanCheckout: boolean;
		CanRevert: boolean;
		CanReset: boolean;
		IsMerging: boolean;
		CommentText: string;
	}
	interface ChangeItemData{
		FilePath: string;
		LastPath: string;
		ChangeType: string;
	}
	interface DiffLineData{
		OldLineNumber: number;
		NewLineNumber: number;
		BlockContainerType: string;
		LineContents: string;
	}
	interface DiffLineResultData{
		DiffLineBlock: Server.DiffLineData[];
		Error: string;
	}
	interface ChangeSetData{
		VersionName: string;
		ShortText: string;
		CommentText: string;
		CommitTime: Date;
		AuthorName: string;
		AuthorEmail: string;
		CommitterName: string;
		CommitterEmail: string;
	}
	interface HistoryItemData{
		VersionName: string;
		ShortText: string;
		CommentText: string;
		CommitTime: Date;
		AuthorName: string;
		AuthorEmail: string;
		CommitterName: string;
		CommitterEmail: string;
		FilePath: string;
		LastPath: string;
		ChangeType: string;
	}
	const enum ChangeType{
		None,
		Added,
		Modified,
		Deleted,
		Renamed,
		Conflict,
	}
	const enum DiffBlockType{
		Unchanged,
		Inserted,
		Modified,
		Deleted,
		Imaginary,
		Conflict,
		Local,
		Remote,
		Error,
	}
	const enum ResetMode{
		Hard,
		Soft,
	}
	interface IVersioncontrolServiceContract{
		init(solutionName: string): Promise<void>;
		rollback(solutionName: string, versionName: string): Promise<void>;
		reset(solutionName: string, resetMode: Server.ResetMode, versionName: string): Promise<void>;
		merge(solutionName: string, versionName: string): Promise<Server.BranchItemData>;
		revert(solutionName: string, versionName: string, filePaths: string[]): Promise<void>;
		resolve(solutionName: string, versionName: string, filePaths: string[]): Promise<void>;
		checkout(solutionName: string, versionName: string, filePaths: string[]): Promise<void>;
		add(solutionName: string, filePaths: string[]): Promise<void>;
		remove(solutionName: string, filePaths: string[]): Promise<void>;
		getBranches(solutionName: string): Promise<Server.BranchItemData[]>;
		getCurrentBranch(solutionName: string): Promise<Server.BranchItemData>;
		checkoutBranch(solutionName: string, branchName: string, createBranch: boolean, versionName: string): Promise<Server.BranchItemData>;
		createBranch(solutionName: string, branchName: string, versionName: string): Promise<Server.BranchItemData>;
		deleteBranch(solutionName: string, branchName: string, forceDelete: boolean): Promise<void>;
		getRemote(solutionName: string): Promise<string>;
		setRemote(solutionName: string, remoteData: Server.GitRemoteData): Promise<void>;
		getInfo(solutionName: string): Promise<Server.VersionControlData>;
		track(solutionName: string): Promise<Server.ChangeItemData[]>;
		getStatus(solutionName: string, filePaths: string[]): Promise<Server.ChangeItemData[]>;
		getDiff(solutionName: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): Promise<Server.DiffLineResultData[]>;
		getConflicts(solutionName: string, contextSize: number, filePaths: string[]): Promise<Server.DiffLineResultData[]>;
		getCommits(solutionName: string, endDate: Date, startDate: Date): Promise<Server.ChangeSetData[]>;
		getCommit(solutionName: string, versionName: string): Promise<Server.ChangeSetData>;
		getChanges(solutionName: string, versionName: string): Promise<Server.ChangeItemData[]>;
		getContents(solutionName: string, versionName: string, filePath: string): Promise<string>;
		getHistory(solutionName: string, versionName: string, filePath: string): Promise<Server.HistoryItemData[]>;
	}
	interface IAppsVersioncontrolServiceContract{
		init(appId: string): Promise<void>;
		rollback(appId: string, versionName: string): Promise<void>;
		reset(appId: string, resetMode: Server.ResetMode, versionName: string): Promise<void>;
		merge(appId: string, versionName: string): Promise<Server.BranchItemData>;
		revert(appId: string, versionName: string, filePaths: string[]): Promise<void>;
		resolve(appId: string, versionName: string, filePaths: string[]): Promise<void>;
		checkout(appId: string, versionName: string, filePaths: string[]): Promise<void>;
		add(appId: string, filePaths: string[]): Promise<void>;
		remove(appId: string, filePaths: string[]): Promise<void>;
		getBranches(appId: string): Promise<Server.BranchItemData[]>;
		getCurrentBranch(appId: string): Promise<Server.BranchItemData>;
		checkoutBranch(appId: string, branchName: string, createBranch: boolean, versionName: string): Promise<Server.BranchItemData>;
		createBranch(appId: string, branchName: string, versionName: string): Promise<Server.BranchItemData>;
		deleteBranch(appId: string, branchName: string, forceDelete: boolean): Promise<void>;
		getRemote(appId: string): Promise<string>;
		setRemote(appId: string, remoteData: Server.GitRemoteData): Promise<void>;
		getInfo(appId: string): Promise<Server.VersionControlData>;
		track(appId: string): Promise<Server.ChangeItemData[]>;
		getStatus(appId: string, filePaths: string[]): Promise<Server.ChangeItemData[]>;
		getDiff(appId: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): Promise<Server.DiffLineResultData[]>;
		getConflicts(appId: string, contextSize: number, filePaths: string[]): Promise<Server.DiffLineResultData[]>;
		getCommits(appId: string, endDate: Date, startDate: Date): Promise<Server.ChangeSetData[]>;
		getCommit(appId: string, versionName: string): Promise<Server.ChangeSetData>;
		getChanges(appId: string, versionName: string): Promise<Server.ChangeItemData[]>;
		getContents(appId: string, versionName: string, filePath: string): Promise<string>;
		getHistory(appId: string, versionName: string, filePath: string): Promise<Server.HistoryItemData[]>;
	}
	interface IServer{
		authentication: Server.IAuthenticationServiceContract;
		appsCordova: Server.IAppsCordovaServiceContract;
		cordova: Server.ICordovaServiceContract;
		identityStore: Server.IIdentityStoreServiceContract;
		everlive: Server.IEverliveServiceContract;
		extensions: Server.IExtensionsServiceContract;
		upload: Server.IUploadServiceContract;
		appsFiles: Server.IAppsFilesServiceContract;
		filesystem: Server.IFilesystemServiceContract;
		appsImages: Server.IAppsImagesServiceContract;
		images: Server.IImagesServiceContract;
		appsItmstransporter: Server.IAppsItmstransporterServiceContract;
		itmstransporter: Server.IItmstransporterServiceContract;
		kendo: Server.IKendoServiceContract;
		appsKendo: Server.IAppsKendoServiceContract;
		mobileprovisions: Server.IMobileprovisionsServiceContract;
		nativescript: Server.INativescriptServiceContract;
		appsNativescript: Server.IAppsNativescriptServiceContract;
		appsProjects: Server.IAppsProjectsServiceContract;
		projects: Server.IProjectsServiceContract;
		apps: Server.IAppsServiceContract;
		bower: Server.IBowerServiceContract;
		appsBower: Server.IAppsBowerServiceContract;
		build: Server.IBuildServiceContract;
		appsBuild: Server.IAppsBuildServiceContract;
		npm: Server.INpmServiceContract;
		publish: Server.IPublishServiceContract;
		appsPublish: Server.IAppsPublishServiceContract;
		rawSettings: Server.IRawSettingsServiceContract;
		appsRawSettings: Server.IAppsRawSettingsServiceContract;
		settings: Server.ISettingsServiceContract;
		appsSettings: Server.IAppsSettingsServiceContract;
		appsTam: Server.IAppsTamServiceContract;
		tam: Server.ITamServiceContract;
		appsTap: Server.IAppsTapServiceContract;
		tap: Server.ITapServiceContract;
		versioncontrol: Server.IVersioncontrolServiceContract;
		appsVersioncontrol: Server.IAppsVersioncontrolServiceContract;
	}
}

