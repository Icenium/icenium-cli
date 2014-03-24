//
// automatically generated code; do not edit manually!
//
///<reference path=".d.ts"/>
declare module Server{
	interface AnalyticsApplicationData{
		Id: string;
		Name: string;
		Description: string;
		WorkspaceId: string;
	}
	interface IAnalyticsServiceContract{
		getApplications(accountId: string): IFuture<Server.AnalyticsApplicationData[]>;
		getProjectKey(id: string): IFuture<string>;
		createAnalyticsApp(workspaceId: string, applicationName: string, description: string): IFuture<string>;
	}
	interface Tenant{
		Id: string;
		Name: string;
		ExpirationUtcSoft: Date;
		ExpirationUtcStrict: Date;
		EditionType: string;
		Status: string;
		ProjectSlots: number;
		LicenseType: string;
		Features: StringMap<boolean>;
	}
	interface IUser{
		Email: string;
		UniqueIdentifier: string;
		UserName: string;
		HasAgreedToEula: boolean;
		IsAuthenticated: boolean;
		Tenant: Server.Tenant;
		Properties: StringMap<string>;
	}
	enum EditionType{
		Starter,
		Developer,
		DeveloperPlus,
		Professional,
		Business,
	}
	enum TenantStatus{
		Active,
		Suspended,
		Disabled,
		Incomplete,
	}
	enum LicenseType{
		Purchase,
		Trial,
	}
	interface IAuthenticationServiceContract{
		login(simpleWebToken: string): IFuture<Server.IUser>;
		logout(): IFuture<void>;
		setUserProperty(propertyName: string, value: string): IFuture<Server.IUser>;
		removeUserProperty(propertyName: string): IFuture<Server.IUser>;
		getLoggedInUser(): IFuture<Server.IUser>;
		getTenants(): IFuture<Server.Tenant[]>;
		setActiveTenant(tenantId: string): IFuture<Server.IUser>;
		agreeToEula(): IFuture<void>;
	}
	interface ProjectInfo{
		ProjectName: string;
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface CordovaPluginData{
		Name: string;
		Identifier: string;
		Version: string;
		Description: string;
		Url: string;
		Assets: string[];
		Platforms: Server.DevicePlatform[];
		AndroidRequiredPermissions: string[];
	}
	interface CordovaRenamedPlugin{
		Version: string;
		OldName: string;
		NewName: string;
	}
	interface CordovaMigrationData{
		RenamedPlugins: Server.CordovaRenamedPlugin[];
		SupportedVersions: string[];
		IntegratedPlugins: any;
	}
	interface MigrationResult{
		MigratedFileEntries: StringMap<MigrationType>;
		MigratedProperties: any;
	}
	enum MigrationType{
		Create,
		Update,
		Delete,
	}
	interface ICordovaServiceContract{
		getLiveSyncToken(solutionName: string, projectName: string): IFuture<string>;
		getLiveSyncUrl(longUrl: string): IFuture<string>;
		getPlugins(version: string): IFuture<Server.CordovaPluginData[]>;
		getJs(version: string, platform: Server.DevicePlatform, $resultStream: any): IFuture<void>;
		getMigrationData(): IFuture<Server.CordovaMigrationData>;
		getPluginsPackage($resultStream: any): IFuture<void>;
		getCordovaVersions(): IFuture<string[]>;
		getCurrentPlatforms(solutionName: string, projectName: string): IFuture<Server.DevicePlatform[]>;
		addPlatform(platform: Server.DevicePlatform, solutionName: string, projectName: string): IFuture<Server.MigrationResult>;
		migrate(solutionName: string, projectName: string, targetVersion: string): IFuture<Server.MigrationResult>;
	}
	interface CryptographicIdentityData{
		Alias: string;
		Attributes: StringMap<string>;
		Certificate: string;
	}
	interface IdentityGenerationData{
		SubjectNameValues: StringMap<string>;
		Attributes: StringMap<string>;
		StartDate: Date;
		EndDate: Date;
	}
	interface CertificateRequestData{
		UniqueName: string;
		Subject: string;
	}
	enum ImportType{
		Pkcs12,
		X509Certificate,
	}
	interface IIdentityStoreServiceContract{
		getIdentities(): IFuture<Server.CryptographicIdentityData[]>;
		generateSelfSignedIdentity(generationData: Server.IdentityGenerationData): IFuture<Server.CryptographicIdentityData>;
		importIdentity(importType: Server.ImportType, password: string, stream: any): IFuture<Server.CryptographicIdentityData[]>;
		removeIdentity(identityAlias: string): IFuture<void>;
		getIdentity(identityAlias: string, password: string, $resultStream: any): IFuture<void>;
		getCertificateRequests(): IFuture<Server.CertificateRequestData[]>;
		generateCertificationRequest(subjectNameValues: StringMap<string>): IFuture<Server.CertificateRequestData>;
		removeCertificateRequest(uniqueName: string): IFuture<void>;
		getCertificateRequest(uniqueName: string, $resultStream: any): IFuture<void>;
	}
	interface ImpersonatedTokenData{
		AccessToken: string;
		ExpirationDate: Date;
	}
	interface EverliveApplicationData{
		Id: string;
		Name: string;
	}
	interface IEverliveServiceContract{
		getAccessToken(): IFuture<Server.ImpersonatedTokenData>;
		getEverliveApplications(accountId: string): IFuture<Server.EverliveApplicationData[]>;
	}
	interface SolutionInfo{
		SolutionName: string;
		SolutionSpaceName: string;
	}
	interface IFilesystemServiceContract{
		getContent(solutionName: string, path: string, $resultStream: any): IFuture<void>;
		getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): IFuture<void>;
		save(solutionName: string, path: string, content: any): IFuture<void>;
		createDirectory(solutionName: string, path: string): IFuture<void>;
		remove(solutionName: string, path: string): IFuture<void>;
	}
	interface Size{
		Width: number;
		Height: number;
	}
	interface IImagesServiceContract{
		resizeImage(solutionName: string, path: string, size: Server.Size): IFuture<void>;
	}
	interface Application{
		Id: number;
		BundleIdentifier: string;
		Name: string;
		Sku: string;
		Version: string;
		IconUri: string;
	}
	interface IItmstransporterServiceContract{
		getApplicationsReadyForUpload(username: string, password: string): IFuture<Server.Application[]>;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): IFuture<void>;
	}
	interface KendoDownloadablePackageData{
		Id: string;
		DownloadUrl: string;
		Name: string;
		Version: string;
	}
	interface KendoPackageData{
		Name: string;
		Version: string;
	}
	interface IKendoServiceContract{
		getPackages(): IFuture<Server.KendoDownloadablePackageData[]>;
		changeKendoPackage(solutionName: string, projectName: string, packageId: string): IFuture<void>;
		getCurrentPackage(solutionName: string, projectName: string): IFuture<Server.KendoPackageData>;
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
	}
	enum ProvisionType{
		Development,
		AdHoc,
		Enterprise,
		AppStore,
	}
	interface IMobileprovisionsServiceContract{
		getProvisions(): IFuture<Server.ProvisionData[]>;
		importProvision(provision: any): IFuture<Server.ProvisionData>;
		removeProvision(identifier: string): IFuture<void>;
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
		Properties: StringMap<string>;
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
		ResultsByTarget: StringMap<TargetResultData>;
	}
	interface BuildRequestData{
		Targets: string[];
		Properties: StringMap<string>;
	}
	enum TargetResultStatus{
		Failure,
		Skipped,
		Success,
	}
	interface IBuildServiceContract{
		buildProject(solutionName: string, projectName: string, buildRequest: Server.BuildRequestData): IFuture<Server.BuildResultData>;
	}
	interface ProjectTemplateData{
		IsRunnable: boolean;
		CanCreateProject: boolean;
		ProjectSubType: string;
		Name: string;
		Description: string;
		Category: string;
		Identifier: string;
		DownloadUri: string;
		DefaultName: string;
		ShortDescription: string;
	}
	interface ItemTemplateData{
		LanguageName: string;
		Name: string;
		Description: string;
		Category: string;
		Identifier: string;
		DownloadUri: string;
		DefaultName: string;
		ShortDescription: string;
	}
	interface IWorkspaceItemData{
		Name: string;
	}
	interface SolutionData{
		Name: string;
		Items: Server.IWorkspaceItemData[];
		IsUpgradeable: boolean;
	}
	interface ProjectTemplateExpansionData{
		ProjectName: string;
		TemplateIdentifier: string;
		Arguments: StringMap<string>;
	}
	interface ItemTemplateExpansionData{
		TemplateIdentifier: string;
		Arguments: StringMap<string>;
	}
	interface IProjectsServiceContract{
		getProjectFileSchema($resultStream: any): IFuture<void>;
		getProjectTemplates(): IFuture<Server.ProjectTemplateData[]>;
		getItemTemplates(): IFuture<Server.ItemTemplateData[]>;
		exportSolution(solutionSpaceName: string, solutionName: string, $resultStream: any): IFuture<void>;
		getExportedSolution(solutionName: string, $resultStream: any): IFuture<void>;
		importPackage(solutionName: string, projectName: string, parentIdentifier: string, archivePackage: any): IFuture<void>;
		importProject(solutionName: string, projectName: string, $package: any): IFuture<void>;
		getProjectContents(solutionName: string, projectName: string): IFuture<string>;
		saveProjectContents(solutionName: string, projectName: string, projectContents: string): IFuture<void>;
		upgradeSolution(solutionName: string): IFuture<void>;
		getSolution(solutionName: string, checkUpgradability: boolean): IFuture<Server.SolutionData>;
		canLoadSolution(solutionName: string): IFuture<boolean>;
		deleteSolution(solutionName: string): IFuture<void>;
		createProject(solutionName: string, expansionData: Server.ProjectTemplateExpansionData): IFuture<void>;
		renameSolution(solutionName: string, newSolutionName: string): IFuture<void>;
		renameProject(solutionName: string, projectName: string, newProjectName: string): IFuture<void>;
		deleteProject(solutionName: string, projectName: string): IFuture<void>;
		setProjectProperty(solutionName: string, projectName: string, changeset: StringMap<string>): IFuture<void>;
		createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): IFuture<void>;
	}
	interface IRawSettingsServiceContract{
		getUserSettings($resultStream: any): IFuture<void>;
		saveUserSettings(content: any): IFuture<void>;
		getSolutionUserSettings(solutionName: string, $resultStream: any): IFuture<void>;
		saveSolutionUserSettings(solutionName: string, content: any): IFuture<void>;
	}
	interface DevicePlatformIdentityAliasDictionary{
		Comparer: any;
		Count: number;
		Keys: Server.DevicePlatform[];
		Values: string[];
		Item: string;
	}
	interface ICodesigningIdentitySettings{
		ProjectCodesigningIdentity: StringMap<DevicePlatformIdentityAliasDictionary>;
	}
	interface IMobileProjectProvisionSettings{
		ProjectProvision: StringMap<string>;
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
	enum DevicePlatform{
		iOS,
		Android,
		WP8,
	}
	interface ISettingsServiceContract{
		getSettings(solutionName: string): IFuture<Server.SettingsData>;
		setCodesignIdentity(solutionName: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): IFuture<void>;
		setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: string): IFuture<void>;
		setActiveBuildConfiguration(buildConfiguration: string, solutionName: string): IFuture<void>;
		updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: string): IFuture<void>;
	}
	interface ITamServiceContract{
		verifyStoreCreated(): IFuture<void>;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string): IFuture<void>;
	}
	interface TapSolutionData{
		Id: string;
		Name: string;
		AccountId: string;
		WorkspaceId: string;
	}
	interface Collaborator{
		Email: string;
		UniqueIdentifier: string;
		UserName: string;
	}
	interface TapWorkspaceData{
		Id: string;
		Name: string;
	}
	interface ITapServiceContract{
		getFeatures(accountId: string, serviceType: string): IFuture<string[]>;
		getExistingClientSolutions(): IFuture<Server.TapSolutionData[]>;
		getRemote(solutionName: string): IFuture<string>;
		setRemote(solutionName: string, remoteUrl: string): IFuture<void>;
		getUsersForProject(solutionName: string): IFuture<Server.Collaborator[]>;
		initCurrentUserSharedRepository(solutionName: string): IFuture<void>;
		getWorkspaces(accountId: string): IFuture<Server.TapWorkspaceData[]>;
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
	enum DiffBlockType{
		Unchanged,
		Inserted,
		Modified,
		Deleted,
		Imaginary,
		Conflict,
		Local,
		Remote,
	}
	enum ResetMode{
		Hard,
		Soft,
	}
	interface IVersioncontrolServiceContract{
		init(solutionName: string): IFuture<void>;
		rollback(solutionName: string, versionName: string): IFuture<void>;
		reset(solutionName: string, resetMode: Server.ResetMode, versionName: string): IFuture<void>;
		merge(solutionName: string, versionName: string): IFuture<Server.BranchItemData>;
		revert(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>;
		resolve(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>;
		checkout(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>;
		add(solutionName: string, filePaths: string[]): IFuture<void>;
		remove(solutionName: string, filePaths: string[]): IFuture<void>;
		getBranches(solutionName: string): IFuture<Server.BranchItemData[]>;
		getCurrentBranch(solutionName: string): IFuture<Server.BranchItemData>;
		checkoutBranch(solutionName: string, branchName: string, createBranch: boolean, versionName: string): IFuture<Server.BranchItemData>;
		createBranch(solutionName: string, branchName: string, versionName: string): IFuture<Server.BranchItemData>;
		deleteBranch(solutionName: string, branchName: string, forceDelete: boolean): IFuture<void>;
		getRemote(solutionName: string): IFuture<string>;
		setRemote(solutionName: string, remoteUrl: string): IFuture<void>;
		getInfo(solutionName: string): IFuture<Server.VersionControlData>;
		track(solutionName: string): IFuture<Server.ChangeItemData[]>;
		getStatus(solutionName: string, filePaths: string[]): IFuture<Server.ChangeItemData[]>;
		getDiff(solutionName: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): IFuture<Server.DiffLineResultData[]>;
		getConflicts(solutionName: string, contextSize: number, filePaths: string[]): IFuture<Server.DiffLineResultData[]>;
		getCommits(solutionName: string, endDate: Date, startDate: Date): IFuture<Server.ChangeSetData[]>;
		getCommit(solutionName: string, versionName: string): IFuture<Server.ChangeSetData>;
		getChanges(solutionName: string, versionName: string): IFuture<Server.ChangeItemData[]>;
		getContents(solutionName: string, versionName: string, filePath: string): IFuture<string>;
		getHistory(solutionName: string, versionName: string, filePath: string): IFuture<Server.HistoryItemData[]>;
	}
	interface IServer{
		analytics: Server.IAnalyticsServiceContract;
		authentication: Server.IAuthenticationServiceContract;
		cordova: Server.ICordovaServiceContract;
		identityStore: Server.IIdentityStoreServiceContract;
		everlive: Server.IEverliveServiceContract;
		filesystem: Server.IFilesystemServiceContract;
		images: Server.IImagesServiceContract;
		itmstransporter: Server.IItmstransporterServiceContract;
		kendo: Server.IKendoServiceContract;
		mobileprovisions: Server.IMobileprovisionsServiceContract;
		build: Server.IBuildServiceContract;
		projects: Server.IProjectsServiceContract;
		rawSettings: Server.IRawSettingsServiceContract;
		settings: Server.ISettingsServiceContract;
		tam: Server.ITamServiceContract;
		tap: Server.ITapServiceContract;
		versioncontrol: Server.IVersioncontrolServiceContract;
	}
}

