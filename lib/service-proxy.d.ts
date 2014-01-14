declare module Server {
	interface IAuthenticationServiceContract {
		agreeToEula(): void;
		getLoggedInUser(): any;
		getTenants(): any;
		login(simpleWebToken: any): any;
		logout(): void;
		removeUserProperty(propertyName: string): any;
		setActiveTenant(tenantId: string): any;
		setUserProperty(propertyName: string, value: any): any;
	}

	interface IBuildServiceContract {
		buildPackage(projectIdentifier: any, projectName: any, archivePackage: any, buildRequest: any): any;
		buildProject(solutionName: string, projectName: string, buildRequest: any): any;
	}

	interface ICordovaServiceContract {
		getCordovaVersions(): any;
		getLiveSyncToken(solutionName: string, projectName: string): any;
		getLiveSyncUrl(longUrl: string): any;
		getPlugins(version: string): any;
		getPluginsPackage($resultStream: WritableStream): void;
		migrate(solutionName: string, projectName: string, targetVersion: string): any;
	}

	interface ICryptographicIdentityStoreServiceContract {
		generateCertificationRequest(subjectNameValues: any): any;
		generateSelfSignedIdentity(generationData: any): any;
		getCertificateRequest(uniqueName: string, $resultStream: WritableStream): void;
		getCertificateRequests(): any;
		getIdentities(): any;
		getIdentity(identityAlias: string, password: string, $resultStream: WritableStream): void;
		importIdentity(importType: string, password: string, stream: any): any;
		removeCertificateRequest(uniqueName: string): void;
		removeIdentity(identityAlias: string): void;
	}

	interface IEverliveServiceContract {
		getAccessToken(): any;
		getEverliveApplications(accountId: string): any;
	}

	interface IFileSystemServiceContract {
		copy(solutionName: string, path: string, destinationSolutionName: any, destination: any): void;
		createDirectory(solutionName: string, path: string): void;
		getContent(solutionName: string, path: string, $resultStream: WritableStream): void;
		getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: WritableStream): void;
		remove(solutionName: string, path: string): void;
		rename(solutionName: string, path: string, newSolutionName: any, newPath: any): void;
		save(solutionName: string, path: string, content: any): void;
	}

	interface IITMSTransporterServiceContract {
		getApplicationsReadyForUpload(username: string, password: any): any;
		uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, username: string, password: any, adamId: string): void;
	}

	interface IImageServiceContract {
		resizeImage(solutionName: string, path: string, size: any): void;
	}

	interface IMobileProvisionServiceContract {
		getProvisions(): any;
		importProvision(provision: any): any;
		removeProvision(identifier: string): void;
	}

	interface IProjectServiceContract {
		canLoadSolution(solutionName: string): any;
		createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: any): void;
		createProject(solutionName: string, expansionData: any): void;
		deleteProject(solutionName: string, projectName: string): void;
		deleteSolution(solutionName: string): void;
		getExportedSolution(solutionName: string, $resultStream: WritableStream): void;
		getItemTemplates(): any;
		getProjectContents(solutionName: string, projectName: string): any;
		getProjectTemplates(): any;
		getSolution(solutionName: string, checkUpgradability: string): any;
		importPackage(solutionName: string, projectName: string, archivePackage: any, parentIdentifier: string): void;
		importProject(solutionName: string, projectName: string, package_: any): void;
		renameProject(solutionName: string, projectName: string, newProjectName: string): void;
		renameSolution(solutionName: string, newSolutionName: string): void;
		saveProjectContents(solutionName: string, projectName: string, projectContents: any): void;
		setProjectProperty(solutionName: string, projectName: string, changeset: any): void;
		upgradeSolution(solutionName: string): void;
	}

	interface ISolutionUserSettingsServiceContract {
		getSettings(solutionName: string): any;
		getUserSettings($resultStream: WritableStream): void;
		saveUserSettings(content: any): void;
		setActiveBuildConfiguration(solutionName: string, buildConfiguration: string): void;
		setCodesignIdentity(solutionName: string, projectIdentity: string, platform: string, identityAlias: any): void;
		setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: any): void;
		updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: any): void;
	}

	interface ITapServiceContract {
		getExistingClientSolutions(): any;
		getRemote(solutionName: string): any;
		getUsersForProject(solutionName: string): any;
		getWorkspaces(accountId: string): any;
		initCurrentUserSharedRepository(solutionName: string): void;
		setRemote(solutionName: string, remoteUrl: any): void;
	}

	interface IVersionControlServiceContract {
		add(solutionName: string, filePaths: any): void;
		commit(solutionName: string, filePaths: any, commentText: any): void;
		getChanges(solutionName: string, versionName: string): any;
		getCommit(solutionName: string, versionName: string): any;
		getCommits(solutionName: string, startDate: string, endDate: string): any;
		getConflicts(solutionName: string, contextSize: string, filePaths: any): any;
		getContents(solutionName: string, versionName: string, filePath: string): any;
		getDiff(solutionName: string, versionName: string, otherVersionName: string, contextSize: string, filePaths: any): any;
		getHistory(solutionName: string, versionName: string, filePath: string): any;
		getInfo(solutionName: string): any;
		getRemote(solutionName: string): any;
		getStatus(solutionName: string, filePaths: any): any;
		init(solutionName: string): void;
		move(solutionName: string, oldPaths: any, newPaths: any): void;
		remove(solutionName: string, filePaths: any): void;
		reset(solutionName: string, versionName: string, resetMode: string): void;
		resolve(solutionName: string, versionName: string, filePaths: any): void;
		revert(solutionName: string, versionName: string, filePaths: any): void;
		rollback(solutionName: string, versionName: string): void;
		setRemote(solutionName: string, remoteUrl: any): void;
		track(solutionName: string): any;
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
		settings: ISolutionUserSettingsServiceContract;
		tap: ITapServiceContract;
		versioncontrol: IVersionControlServiceContract;
	}

}
