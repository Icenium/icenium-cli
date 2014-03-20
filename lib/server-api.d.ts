//
// automatically generated code; do not edit manually!
//
declare module Server {
	interface IAuthenticationServiceContract {
		agreeToEula(): IFuture<void>;
		getLoggedInUser(): IFuture<any>;
		getTenants(): IFuture<any>;
		login(simpleWebToken: any): IFuture<any>;
		logout(): IFuture<void>;
		removeUserProperty(propertyName: string): IFuture<any>;
		setActiveTenant(tenantId: string): IFuture<any>;
		setUserProperty(propertyName: string, value: any): IFuture<any>;
	}

	interface IBuildServiceContract {
		buildPackage(projectIdentifier: any, projectName: any, archivePackage: any, buildRequest: any): IFuture<any>;
		buildProject(solutionName: string, projectName: string, buildRequest: any): IFuture<any>;
	}

	interface ICordovaServiceContract {
		addPlatform(solutionName: string, projectName: string, platform: string): IFuture<any>;
		getCordovaVersions(): IFuture<any>;
		getCurrentPlatforms(solutionName: string, projectName: string): IFuture<any>;
		getJs(version: string, platform: string, $resultStream: any): IFuture<void>;
		getLiveSyncToken(solutionName: string, projectName: string): IFuture<any>;
		getLiveSyncUrl(longUrl: string): IFuture<any>;
		getPlugins(version: string): IFuture<any>;
		getPluginsPackage($resultStream: any): IFuture<void>;
		migrate(solutionName: string, projectName: string, targetVersion: string): IFuture<any>;
	}

	interface ICryptographicIdentityStoreServiceContract {
		generateCertificationRequest(subjectNameValues: any): IFuture<any>;
		generateSelfSignedIdentity(generationData: any): IFuture<any>;
		getCertificateRequest(uniqueName: string, $resultStream: any): IFuture<void>;
		getCertificateRequests(): IFuture<any>;
		getIdentities(): IFuture<any>;
		getIdentity(identityAlias: string, password: string, $resultStream: any): IFuture<void>;
		importIdentity(importType: string, password: string, stream: any): IFuture<any>;
		removeCertificateRequest(uniqueName: string): IFuture<void>;
		removeIdentity(identityAlias: string): IFuture<void>;
	}

	interface IEverliveServiceContract {
		getAccessToken(): IFuture<any>;
		getEverliveApplications(accountId: string): IFuture<any>;
	}

	interface IFileSystemServiceContract {
		copy(solutionName: string, path: string, destinationSolutionName: any, destination: any): IFuture<void>;
		createDirectory(solutionName: string, path: string): IFuture<void>;
		getContent(solutionName: string, path: string, $resultStream: any): IFuture<void>;
		getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): IFuture<void>;
		remove(solutionName: string, path: string): IFuture<void>;
		rename(solutionName: string, path: string, newSolutionName: any, newPath: any): IFuture<void>;
		save(solutionName: string, path: string, content: any): IFuture<void>;
	}

	interface IITMSTransporterServiceContract {
		getApplicationsReadyForUpload(username: string, password: any): IFuture<any>;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, username: string, password: any, adamId: string): IFuture<void>;
	}

	interface IImageServiceContract {
		resizeImage(solutionName: string, path: string, size: any): IFuture<void>;
	}

	interface IMobileProvisionServiceContract {
		getProvisions(): IFuture<any>;
		importProvision(provision: any): IFuture<any>;
		removeProvision(identifier: string): IFuture<void>;
	}

	interface IProjectServiceContract {
		canLoadSolution(solutionName: string): IFuture<any>;
		createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: any): IFuture<void>;
		createProject(solutionName: string, expansionData: any): IFuture<void>;
		deleteProject(solutionName: string, projectName: string): IFuture<void>;
		deleteSolution(solutionName: string): IFuture<void>;
		exportSolution(solutionSpaceName: string, solutionName: string, $resultStream: any): IFuture<void>;
		getExportedSolution(solutionName: string, $resultStream: any): IFuture<void>;
		getItemTemplates(): IFuture<any>;
		getProjectContents(solutionName: string, projectName: string): IFuture<any>;
		getProjectTemplates(): IFuture<any>;
		getSolution(solutionName: string, checkUpgradability: string): IFuture<any>;
		importPackage(solutionName: string, projectName: string, archivePackage: any, parentIdentifier: string): IFuture<void>;
		importProject(solutionName: string, projectName: string, package_: any): IFuture<void>;
		renameProject(solutionName: string, projectName: string, newProjectName: string): IFuture<void>;
		renameSolution(solutionName: string, newSolutionName: string): IFuture<void>;
		saveProjectContents(solutionName: string, projectName: string, projectContents: any): IFuture<void>;
		setProjectProperty(solutionName: string, projectName: string, changeset: any): IFuture<void>;
		upgradeSolution(solutionName: string): IFuture<void>;
	}

	interface IRawSettingsServiceContract {
		getSolutionUserSettings(solutionName: string, $resultStream: any): IFuture<void>;
		getUserSettings($resultStream: any): IFuture<void>;
		saveSolutionUserSettings(solutionName: string, content: any): IFuture<void>;
		saveUserSettings(content: any): IFuture<void>;
	}

	interface ISettingsServiceContract {
		getSettings(solutionName: string): IFuture<any>;
		setActiveBuildConfiguration(solutionName: string, buildConfiguration: string): IFuture<void>;
		setCodesignIdentity(solutionName: string, projectIdentity: string, platform: string, identityAlias: any): IFuture<void>;
		setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: any): IFuture<void>;
		updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: any): IFuture<void>;
	}

	interface ITapServiceContract {
		getExistingClientSolutions(): IFuture<any>;
		getRemote(solutionName: string): IFuture<any>;
		getUsersForProject(solutionName: string): IFuture<any>;
		getWorkspaces(accountId: string): IFuture<any>;
		initCurrentUserSharedRepository(solutionName: string): IFuture<void>;
		setRemote(solutionName: string, remoteUrl: any): IFuture<void>;
	}

	interface IVersionControlServiceContract {
		add(solutionName: string, filePaths: any): IFuture<void>;
		checkout(solutionName: string, versionName: string, filePaths: any): IFuture<void>;
		checkoutBranch(solutionName: string, branchName: string, versionName: string, createBranch: string): IFuture<any>;
		commit(solutionName: string, filePaths: any, commentText: any): IFuture<void>;
		createBranch(solutionName: string, branchName: string, versionName: string): IFuture<any>;
		deleteBranch(solutionName: string, branchName: string, forceDelete: string): IFuture<void>;
		getBranches(solutionName: string): IFuture<any>;
		getChanges(solutionName: string, versionName: string): IFuture<any>;
		getCommit(solutionName: string, versionName: string): IFuture<any>;
		getCommits(solutionName: string, startDate: string, endDate: string): IFuture<any>;
		getConflicts(solutionName: string, contextSize: string, filePaths: any): IFuture<any>;
		getContents(solutionName: string, versionName: string, filePath: string): IFuture<any>;
		getCurrentBranch(solutionName: string): IFuture<any>;
		getDiff(solutionName: string, versionName: string, otherVersionName: string, contextSize: string, filePaths: any): IFuture<any>;
		getHistory(solutionName: string, versionName: string, filePath: string): IFuture<any>;
		getInfo(solutionName: string): IFuture<any>;
		getRemote(solutionName: string): IFuture<any>;
		getStatus(solutionName: string, filePaths: any): IFuture<any>;
		init(solutionName: string): IFuture<void>;
		merge(solutionName: string, versionName: string): IFuture<any>;
		move(solutionName: string, oldPaths: any, newPaths: any): IFuture<void>;
		remove(solutionName: string, filePaths: any): IFuture<void>;
		reset(solutionName: string, versionName: string, resetMode: string): IFuture<void>;
		resolve(solutionName: string, versionName: string, filePaths: any): IFuture<void>;
		revert(solutionName: string, versionName: string, filePaths: any): IFuture<void>;
		rollback(solutionName: string, versionName: string): IFuture<void>;
		setRemote(solutionName: string, remoteUrl: any): IFuture<void>;
		track(solutionName: string): IFuture<any>;
	}

	interface IServer {
		authentication: IAuthenticationServiceContract;
		build: IBuildServiceContract;
		cordova: ICordovaServiceContract;
		identityStore: ICryptographicIdentityStoreServiceContract;
		everlive: IEverliveServiceContract;
		filesystem: IFileSystemServiceContract;
		itmstransporter: IITMSTransporterServiceContract;
		images: IImageServiceContract;
		mobileprovisions: IMobileProvisionServiceContract;
		projects: IProjectServiceContract;
		rawSettings: IRawSettingsServiceContract;
		settings: ISettingsServiceContract;
		tap: ITapServiceContract;
		versioncontrol: IVersionControlServiceContract;
	}

}
