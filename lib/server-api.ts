///<reference path=".d.ts"/>
//
// automatically generated code; do not edit manually!
//
"use strict";

import querystring = require('querystring');

export class AuthenticationService implements Server.IAuthenticationServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	agreeToEula(): IFuture<void> {
		return this.$serviceProxy.call<void>('AgreeToEula', 'POST', '/authentication/eula', null, null, null);
	}

	getLoggedInUser(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetLoggedInUser', 'GET', '/authentication/currentUser', 'application/json', null, null);
	}

	getTenants(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetTenants', 'GET', '/authentication/tenants', 'application/json', null, null);
	}

	login(simpleWebToken: any): IFuture<any> {
		return this.$serviceProxy.call<any>('Login', 'POST', '/authentication', 'application/json', [{name: 'simpleWebToken', value: JSON.stringify(simpleWebToken), contentType: 'application/json'}], null);
	}

	logout(): IFuture<void> {
		return this.$serviceProxy.call<void>('Logout', 'LOGOUT', '/authentication', null, null, null);
	}

	removeUserProperty(propertyName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('RemoveUserProperty', 'DELETE', ['/authentication/currentUser', encodeURI(propertyName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	setActiveTenant(tenantId: string): IFuture<any> {
		return this.$serviceProxy.call<any>('SetActiveTenant', 'PATCH', ['/authentication/tenants', encodeURI(tenantId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	setUserProperty(propertyName: string, value: any): IFuture<any> {
		return this.$serviceProxy.call<any>('SetUserProperty', 'PATCH', ['/authentication/currentUser', encodeURI(propertyName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'value', value: JSON.stringify(value), contentType: 'application/json'}], null);
	}

}

export class BuildService implements Server.IBuildServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	buildPackage(projectIdentifier: any, projectName: any, archivePackage: any, buildRequest: any): IFuture<any> {
		return this.$serviceProxy.call<any>('BuildPackage', 'POST', '/build', 'application/json', [{name: 'projectIdentifier', value: JSON.stringify(projectIdentifier), contentType: 'application/json'}, {name: 'projectName', value: JSON.stringify(projectName), contentType: 'application/json'}, {name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}, {name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json'}], null);
	}

	buildProject(solutionName: string, projectName: string, buildRequest: any): IFuture<any> {
		return this.$serviceProxy.call<any>('BuildProject', 'POST', ['/build', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json'}], null);
	}

}

export class CordovaService implements Server.ICordovaServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	addPlatform(solutionName: string, projectName: string, platform: string): IFuture<any> {
		return this.$serviceProxy.call<any>('AddPlatform', 'POST', ['/cordova/platforms', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(platform.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getCordovaVersions(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCordovaVersions', 'GET', '/cordova/versions', 'application/json', null, null);
	}

	getCurrentPlatforms(solutionName: string, projectName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCurrentPlatforms', 'GET', ['/cordova/platforms', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getJs(version: string, platform: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetJs', 'GET', ['/cordova', encodeURI(version.replace(/\\/g, '/')), encodeURI(platform.replace(/\\/g, '/')), 'js'].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getLiveSyncToken(solutionName: string, projectName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetLiveSyncToken', 'GET', ['/cordova/liveSyncToken', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getLiveSyncUrl(longUrl: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetLiveSyncUrl', 'GET', '/cordova/liveSyncUrl' + '?' + querystring.stringify({ 'longUrl': longUrl }), 'application/json', null, null);
	}

	getPlugins(version: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetPlugins', 'GET', ['/cordova', encodeURI(version.replace(/\\/g, '/')), 'plugins'].join('/'), 'application/json', null, null);
	}

	getPluginsPackage($resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetPluginsPackage', 'GET', ['/cordova/plugins', 'package'].join('/'), 'application/octet-stream', null, $resultStream);
	}

	migrate(solutionName: string, projectName: string, targetVersion: string): IFuture<any> {
		return this.$serviceProxy.call<any>('Migrate', 'POST', ['/cordova/migrate', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}

}

export class CryptographicIdentityStoreService implements Server.ICryptographicIdentityStoreServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	generateCertificationRequest(subjectNameValues: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GenerateCertificationRequest', 'POST', '/identityStore/certificationRequests', 'application/json', [{name: 'subjectNameValues', value: JSON.stringify(subjectNameValues), contentType: 'application/json'}], null);
	}

	generateSelfSignedIdentity(generationData: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GenerateSelfSignedIdentity', 'GENERATE', '/identityStore/identities', 'application/json', [{name: 'generationData', value: JSON.stringify(generationData), contentType: 'application/json'}], null);
	}

	getCertificateRequest(uniqueName: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetCertificateRequest', 'GET', ['/identityStore/certificationRequests', 'export'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/octet-stream', null, $resultStream);
	}

	getCertificateRequests(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCertificateRequests', 'GET', '/identityStore/certificationRequests', 'application/json', null, null);
	}

	getIdentities(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetIdentities', 'GET', '/identityStore/identities', 'application/json', null, null);
	}

	getIdentity(identityAlias: string, password: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetIdentity', 'GET', ['/identityStore/identities', 'export'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias, 'password': password }), 'application/octet-stream', null, $resultStream);
	}

	importIdentity(importType: string, password: string, stream: any): IFuture<any> {
		return this.$serviceProxy.call<any>('ImportIdentity', 'POST', '/identityStore/identities' + '?' + querystring.stringify({ 'importType': importType, 'password': password }), 'application/json', [{name: 'stream', value: stream, contentType: 'application/octet-stream'}], null);
	}

	removeCertificateRequest(uniqueName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('RemoveCertificateRequest', 'DELETE', '/identityStore/certificationRequests' + '?' + querystring.stringify({ 'uniqueName': uniqueName }), null, null, null);
	}

	removeIdentity(identityAlias: string): IFuture<void> {
		return this.$serviceProxy.call<void>('RemoveIdentity', 'DELETE', '/identityStore/identities' + '?' + querystring.stringify({ 'identityAlias': identityAlias }), null, null, null);
	}

}

export class EverliveService implements Server.IEverliveServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getAccessToken(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetAccessToken', 'GET', '/everlive/accessToken', 'application/json', null, null);
	}

	getEverliveApplications(accountId: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetEverliveApplications', 'GET', ['/everlive/applications', encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

}

export class FileSystemService implements Server.IFileSystemServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	copy(solutionName: string, path: string, destinationSolutionName: any, destination: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Copy', 'COPY', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'destinationSolutionName', value: JSON.stringify(destinationSolutionName), contentType: 'application/json'}, {name: 'destination', value: JSON.stringify(destination), contentType: 'application/json'}], null);
	}

	createDirectory(solutionName: string, path: string): IFuture<void> {
		return this.$serviceProxy.call<void>('CreateDirectory', 'MKDIR', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	getContent(solutionName: string, path: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetContent', 'GET', ['/filesystem/raw', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['/filesystem/file', encodeURI(solutionSpaceName.replace(/\\/g, '/')), encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	remove(solutionName: string, path: string): IFuture<void> {
		return this.$serviceProxy.call<void>('Remove', 'DELETE', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	rename(solutionName: string, path: string, newSolutionName: any, newPath: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Rename', 'MOVE', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'newSolutionName', value: JSON.stringify(newSolutionName), contentType: 'application/json'}, {name: 'newPath', value: JSON.stringify(newPath), contentType: 'application/json'}], null);
	}

	save(solutionName: string, path: string, content: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Save', 'POST', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}

}

export class ITMSTransporterService implements Server.IITMSTransporterServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getApplicationsReadyForUpload(username: string, password: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GetApplicationsReadyForUpload', 'POST', '/itmstransporter/applications' + '?' + querystring.stringify({ 'username': username }), 'application/json', [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}

	uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, username: string, password: any, adamId: string): IFuture<void> {
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['/itmstransporter/upload', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'username': username, 'adamId': adamId }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}

}

export class ImageService implements Server.IImageServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	resizeImage(solutionName: string, path: string, size: any): IFuture<void> {
		return this.$serviceProxy.call<void>('ResizeImage', 'POST', ['/images/resize', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'size', value: JSON.stringify(size), contentType: 'application/json'}], null);
	}

}

export class MobileProvisionService implements Server.IMobileProvisionServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getProvisions(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetProvisions', 'GET', '/mobileprovisions', 'application/json', null, null);
	}

	importProvision(provision: any): IFuture<any> {
		return this.$serviceProxy.call<any>('ImportProvision', 'POST', '/mobileprovisions', 'application/json', [{name: 'provision', value: provision, contentType: 'application/octet-stream'}], null);
	}

	removeProvision(identifier: string): IFuture<void> {
		return this.$serviceProxy.call<void>('RemoveProvision', 'DELETE', ['/mobileprovisions', encodeURI(identifier.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

}

export class ProjectService implements Server.IProjectServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	canLoadSolution(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('CanLoadSolution', 'EXISTS', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: any): IFuture<void> {
		return this.$serviceProxy.call<void>('CreateNewProjectItem', 'POST', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(itemIdentifier.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}

	createProject(solutionName: string, expansionData: any): IFuture<void> {
		return this.$serviceProxy.call<void>('CreateProject', 'POST', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}

	deleteProject(solutionName: string, projectName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('DeleteProject', 'DELETE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	deleteSolution(solutionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('DeleteSolution', 'DELETE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	exportSolution(solutionSpaceName: string, solutionName: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('ExportSolution', 'GET', ['/projects/export', encodeURI(solutionSpaceName.replace(/\\/g, '/')), encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getExportedSolution(solutionName: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetExportedSolution', 'GET', ['/projects/export', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getItemTemplates(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetItemTemplates', 'GET', '/projects/itemTemplates', 'application/json', null, null);
	}

	getProjectContents(solutionName: string, projectName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetProjectContents', 'GET', ['/projects/contents', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getProjectTemplates(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetProjectTemplates', 'GET', '/projects/projectTemplates', 'application/json', null, null);
	}

	getSolution(solutionName: string, checkUpgradability: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetSolution', 'GET', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'checkUpgradability': checkUpgradability }), 'application/json', null, null);
	}

	importPackage(solutionName: string, projectName: string, archivePackage: any, parentIdentifier: string): IFuture<void> {
		return this.$serviceProxy.call<void>('ImportPackage', 'POST', ['/projects/import', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(parentIdentifier.replace(/\\/g, '/'))].join('/'), null, [{name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}], null);
	}

	importProject(solutionName: string, projectName: string, package_: any): IFuture<void> {
		return this.$serviceProxy.call<void>('ImportProject', 'POST', ['/projects/importProject', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'package', value: package_, contentType: 'application/octet-stream'}], null);
	}

	renameProject(solutionName: string, projectName: string, newProjectName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('RenameProject', 'PUT', ['/projects/rename', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(newProjectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	renameSolution(solutionName: string, newSolutionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('RenameSolution', 'PUT', ['/projects/rename', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(newSolutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	saveProjectContents(solutionName: string, projectName: string, projectContents: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SaveProjectContents', 'PUT', ['/projects/contents', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'projectContents', value: JSON.stringify(projectContents), contentType: 'application/json'}], null);
	}

	setProjectProperty(solutionName: string, projectName: string, changeset: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SetProjectProperty', 'PATCH', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'changeset', value: JSON.stringify(changeset), contentType: 'application/json'}], null);
	}

	upgradeSolution(solutionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('UpgradeSolution', 'UPGRADE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

}

export class RawSettingsService implements Server.IRawSettingsServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getSolutionUserSettings(solutionName: string, $resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetSolutionUserSettings', 'GET', ['/rawSettings/solution', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getUserSettings($resultStream: any): IFuture<void> {
		return this.$serviceProxy.call<void>('GetUserSettings', 'GET', '/rawSettings/currentUser', 'application/octet-stream', null, $resultStream);
	}

	saveSolutionUserSettings(solutionName: string, content: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SaveSolutionUserSettings', 'POST', ['/rawSettings/solution', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}

	saveUserSettings(content: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SaveUserSettings', 'POST', '/rawSettings/currentUser', null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}

}

export class SettingsService implements Server.ISettingsServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getSettings(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetSettings', 'GET', ['/settings/solution', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	setActiveBuildConfiguration(solutionName: string, buildConfiguration: string): IFuture<void> {
		return this.$serviceProxy.call<void>('SetActiveBuildConfiguration', 'PUT', ['/settings/buildConfiguration', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(buildConfiguration.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	setCodesignIdentity(solutionName: string, projectIdentity: string, platform: string, identityAlias: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SetCodesignIdentity', 'PUT', ['/settings/codesignIdentity', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), null, [{name: 'identityAlias', value: JSON.stringify(identityAlias), contentType: 'application/json'}], null);
	}

	setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SetMobileProvision', 'PUT', ['/settings/mobileProvision', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'provisionIdentifier', value: JSON.stringify(provisionIdentifier), contentType: 'application/json'}], null);
	}

	updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: any): IFuture<void> {
		return this.$serviceProxy.call<void>('UpdateSettingsProjectIdentifier', 'PATCH', ['/settings/updateProjectIdentifier', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'newProjectIdentity', value: JSON.stringify(newProjectIdentity), contentType: 'application/json'}], null);
	}

}

export class TapService implements Server.ITapServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getExistingClientSolutions(): IFuture<any> {
		return this.$serviceProxy.call<any>('GetExistingClientSolutions', 'GET', '/tap/projects', 'application/json', null, null);
	}

	getRemote(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetRemote', 'GET', ['/tap/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), 'application/json', null, null);
	}

	getUsersForProject(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetUsersForProject', 'GET', ['/tap/userProjects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getWorkspaces(accountId: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetWorkspaces', 'GET', ['/tap/workspaces', encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	initCurrentUserSharedRepository(solutionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('InitCurrentUserSharedRepository', 'POST', ['/tap/userProjects', encodeURI(solutionName.replace(/\\/g, '/')), 'initSharedRepository'].join('/'), null, null, null);
	}

	setRemote(solutionName: string, remoteUrl: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['/tap/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}

}

export class VersionControlService implements Server.IVersionControlServiceContract {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	add(solutionName: string, filePaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Add', 'ADD', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	checkout(solutionName: string, versionName: string, filePaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Checkout', 'CHECKOUT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	checkoutBranch(solutionName: string, branchName: string, versionName: string, createBranch: string): IFuture<any> {
		return this.$serviceProxy.call<any>('CheckoutBranch', 'CHECKOUT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'branches', encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName, 'createBranch': createBranch }), 'application/json', null, null);
	}

	commit(solutionName: string, filePaths: any, commentText: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Commit', 'COMMIT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}, {name: 'commentText', value: JSON.stringify(commentText), contentType: 'application/json'}], null);
	}

	createBranch(solutionName: string, branchName: string, versionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('CreateBranch', 'POST', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'branches', encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}

	deleteBranch(solutionName: string, branchName: string, forceDelete: string): IFuture<void> {
		return this.$serviceProxy.call<void>('DeleteBranch', 'DELETE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'branches', encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'forceDelete': forceDelete }), null, null, null);
	}

	getBranches(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetBranches', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'branches'].join('/'), 'application/json', null, null);
	}

	getChanges(solutionName: string, versionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetChanges', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'changes'].join('/'), 'application/json', null, null);
	}

	getCommit(solutionName: string, versionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCommit', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}

	getCommits(solutionName: string, startDate: string, endDate: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCommits', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'commits'].join('/') + '?' + querystring.stringify({ 'startDate': startDate, 'endDate': endDate }), 'application/json', null, null);
	}

	getConflicts(solutionName: string, contextSize: string, filePaths: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GetConflicts', 'XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'conflicts/files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	getContents(solutionName: string, versionName: string, filePath: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetContents', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'contents', encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getCurrentBranch(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetCurrentBranch', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'branch'].join('/'), 'application/json', null, null);
	}

	getDiff(solutionName: string, versionName: string, otherVersionName: string, contextSize: string, filePaths: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GetDiff', 'XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'diff/files'].join('/') + '?' + querystring.stringify({ 'otherVersionName': otherVersionName, 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	getHistory(solutionName: string, versionName: string, filePath: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetHistory', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'history', encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getInfo(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetInfo', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'info'].join('/'), 'application/json', null, null);
	}

	getRemote(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('GetRemote', 'GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), 'application/json', null, null);
	}

	getStatus(solutionName: string, filePaths: any): IFuture<any> {
		return this.$serviceProxy.call<any>('GetStatus', 'XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'status/files'].join('/'), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	init(solutionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('Init', 'INIT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	merge(solutionName: string, versionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('Merge', 'MERGE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}

	move(solutionName: string, oldPaths: any, newPaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Move', 'MOVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, [{name: 'oldPaths', value: JSON.stringify(oldPaths), contentType: 'application/json'}, {name: 'newPaths', value: JSON.stringify(newPaths), contentType: 'application/json'}], null);
	}

	remove(solutionName: string, filePaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Remove', 'REMOVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	reset(solutionName: string, versionName: string, resetMode: string): IFuture<void> {
		return this.$serviceProxy.call<void>('Reset', 'RESET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName, 'resetMode': resetMode }), null, null, null);
	}

	resolve(solutionName: string, versionName: string, filePaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Resolve', 'RESOLVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	revert(solutionName: string, versionName: string, filePaths: any): IFuture<void> {
		return this.$serviceProxy.call<void>('Revert', 'REVERT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}

	rollback(solutionName: string, versionName: string): IFuture<void> {
		return this.$serviceProxy.call<void>('Rollback', 'ROLLBACK', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, null, null);
	}

	setRemote(solutionName: string, remoteUrl: any): IFuture<void> {
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}

	track(solutionName: string): IFuture<any> {
		return this.$serviceProxy.call<any>('Track', 'POST', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'status'].join('/'), 'application/json', null, null);
	}

}

export class Server {
	public authentication = $injector.resolve(AuthenticationService);
	public build = $injector.resolve(BuildService);
	public cordova = $injector.resolve(CordovaService);
	public identityStore = $injector.resolve(CryptographicIdentityStoreService);
	public everlive = $injector.resolve(EverliveService);
	public filesystem = $injector.resolve(FileSystemService);
	public itmstransporter = $injector.resolve(ITMSTransporterService);
	public images = $injector.resolve(ImageService);
	public mobileprovisions = $injector.resolve(MobileProvisionService);
	public projects = $injector.resolve(ProjectService);
	public rawSettings = $injector.resolve(RawSettingsService);
	public settings = $injector.resolve(SettingsService);
	public tap = $injector.resolve(TapService);
	public versioncontrol = $injector.resolve(VersionControlService);
}

$injector.register('server', Server);