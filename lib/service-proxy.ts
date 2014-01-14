///<reference path=".d.ts"/>
"use strict";

import querystring = require('querystring');

export class AuthenticationService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	agreeToEula(): void {
		this.$serviceProxy.call('POST', '/authentication/eula', null, null, null);
	}

	getLoggedInUser(): any {
		return this.$serviceProxy.call('GET', '/authentication/currentUser', 'application/json', null, null);
	}

	getTenants(): any {
		return this.$serviceProxy.call('GET', '/authentication/tenants', 'application/json', null, null);
	}

	login(simpleWebToken: any): any {
		return this.$serviceProxy.call('POST', '/authentication', 'application/json', simpleWebToken, null);
	}

	logout(): void {
		this.$serviceProxy.call('LOGOUT', '/authentication', null, null, null);
	}

	removeUserProperty(propertyName: string): any {
		return this.$serviceProxy.call('DELETE', ['/authentication/currentUser', encodeURI(propertyName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	setActiveTenant(tenantId: string): any {
		return this.$serviceProxy.call('PATCH', ['/authentication/tenants', encodeURI(tenantId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	setUserProperty(propertyName: string, value: any): any {
		return this.$serviceProxy.call('PATCH', ['/authentication/currentUser', encodeURI(propertyName.replace(/\\/g, '/'))].join('/'), 'application/json', value, null);
	}

}

export class BuildService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	buildPackage(projectIdentifier: any, projectName: any, archivePackage: any, buildRequest: any): any {
		return this.$serviceProxy.call('POST', '/build', 'application/json', [projectIdentifier, projectName, archivePackage, buildRequest], null);
	}

	buildProject(solutionName: string, projectName: string, buildRequest: any): any {
		return this.$serviceProxy.call('POST', ['/build', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', buildRequest, null);
	}

}

export class CordovaService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getCordovaVersions(): any {
		return this.$serviceProxy.call('GET', '/cordova/versions', 'application/json', null, null);
	}

	getLiveSyncToken(solutionName: string, projectName: string): any {
		return this.$serviceProxy.call('GET', ['/cordova/liveSyncToken', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getLiveSyncUrl(longUrl: string): any {
		return this.$serviceProxy.call('GET', '/cordova/liveSyncUrl' + '?' + querystring.stringify({ 'longUrl': longUrl }), 'application/json', null, null);
	}

	getPlugins(version: string): any {
		return this.$serviceProxy.call('GET', ['/cordova', encodeURI(version.replace(/\\/g, '/')), 'plugins'].join('/'), 'application/json', null, null);
	}

	getPluginsPackage($resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/cordova/plugins', 'package'].join('/'), 'application/octet-stream', null, $resultStream);
	}

	migrate(solutionName: string, projectName: string, targetVersion: string): any {
		return this.$serviceProxy.call('POST', ['/cordova/migrate', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}

}

export class CryptographicIdentityStoreService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	generateCertificationRequest(subjectNameValues: any): any {
		return this.$serviceProxy.call('POST', '/identityStore/certificationRequests', 'application/json', subjectNameValues, null);
	}

	generateSelfSignedIdentity(generationData: any): any {
		return this.$serviceProxy.call('GENERATE', '/identityStore/identities', 'application/json', generationData, null);
	}

	getCertificateRequest(uniqueName: string, $resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/identityStore/certificationRequests', 'export'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/octet-stream', null, $resultStream);
	}

	getCertificateRequests(): any {
		return this.$serviceProxy.call('GET', '/identityStore/certificationRequests', 'application/json', null, null);
	}

	getIdentities(): any {
		return this.$serviceProxy.call('GET', '/identityStore/identities', 'application/json', null, null);
	}

	getIdentity(identityAlias: string, password: string, $resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/identityStore/identities', 'export'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias, 'password': password }), 'application/octet-stream', null, $resultStream);
	}

	importIdentity(importType: string, password: string, stream: any): any {
		return this.$serviceProxy.call('POST', '/identityStore/identities' + '?' + querystring.stringify({ 'importType': importType, 'password': password }), 'application/json', stream, null);
	}

	removeCertificateRequest(uniqueName: string): void {
		this.$serviceProxy.call('DELETE', '/identityStore/certificationRequests' + '?' + querystring.stringify({ 'uniqueName': uniqueName }), null, null, null);
	}

	removeIdentity(identityAlias: string): void {
		this.$serviceProxy.call('DELETE', '/identityStore/identities' + '?' + querystring.stringify({ 'identityAlias': identityAlias }), null, null, null);
	}

}

export class EverliveService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getAccessToken(): any {
		return this.$serviceProxy.call('GET', '/everlive/accessToken', 'application/json', null, null);
	}

	getEverliveApplications(accountId: string): any {
		return this.$serviceProxy.call('GET', ['/everlive/applications', encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

}

export class FileSystemService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	copy(solutionName: string, path: string, destinationSolutionName: any, destination: any): void {
		this.$serviceProxy.call('COPY', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [destinationSolutionName, destination], null);
	}

	createDirectory(solutionName: string, path: string): void {
		this.$serviceProxy.call('MKDIR', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	getContent(solutionName: string, path: string, $resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/filesystem/raw', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/filesystem/file', encodeURI(solutionSpaceName.replace(/\\/g, '/')), encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	remove(solutionName: string, path: string): void {
		this.$serviceProxy.call('DELETE', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	rename(solutionName: string, path: string, newSolutionName: any, newPath: any): void {
		this.$serviceProxy.call('MOVE', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [newSolutionName, newPath], null);
	}

	save(solutionName: string, path: string, content: any): void {
		this.$serviceProxy.call('POST', ['/filesystem', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, content, null);
	}

}

export class ITMSTransporterService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getApplicationsReadyForUpload(username: string, password: any): any {
		return this.$serviceProxy.call('POST', '/itmstransporter/applications' + '?' + querystring.stringify({ 'username': username }), 'application/json', password, null);
	}

	uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, username: string, password: any, adamId: string): void {
		this.$serviceProxy.call('POST', ['/itmstransporter/upload', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'username': username, 'adamId': adamId }), null, password, null);
	}

}

export class ImageService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	resizeImage(solutionName: string, path: string, size: any): void {
		this.$serviceProxy.call('POST', ['/images/resize', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(path.replace(/\\/g, '/'))].join('/'), null, size, null);
	}

}

export class MobileProvisionService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getProvisions(): any {
		return this.$serviceProxy.call('GET', '/mobileprovisions', 'application/json', null, null);
	}

	importProvision(provision: any): any {
		return this.$serviceProxy.call('POST', '/mobileprovisions', 'application/json', provision, null);
	}

	removeProvision(identifier: string): void {
		this.$serviceProxy.call('DELETE', ['/mobileprovisions', encodeURI(identifier.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

}

export class ProjectService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	canLoadSolution(solutionName: string): any {
		return this.$serviceProxy.call('EXISTS', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: any): void {
		this.$serviceProxy.call('POST', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(itemIdentifier.replace(/\\/g, '/'))].join('/'), null, expansionData, null);
	}

	createProject(solutionName: string, expansionData: any): void {
		this.$serviceProxy.call('POST', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, expansionData, null);
	}

	deleteProject(solutionName: string, projectName: string): void {
		this.$serviceProxy.call('DELETE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	deleteSolution(solutionName: string): void {
		this.$serviceProxy.call('DELETE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	getExportedSolution(solutionName: string, $resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', ['/projects/export', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}

	getItemTemplates(): any {
		return this.$serviceProxy.call('GET', '/projects/itemTemplates', 'application/json', null, null);
	}

	getProjectContents(solutionName: string, projectName: string): any {
		return this.$serviceProxy.call('GET', ['/projects/contents', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getProjectTemplates(): any {
		return this.$serviceProxy.call('GET', '/projects/projectTemplates', 'application/json', null, null);
	}

	getSolution(solutionName: string, checkUpgradability: string): any {
		return this.$serviceProxy.call('GET', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'checkUpgradability': checkUpgradability }), 'application/json', null, null);
	}

	importPackage(solutionName: string, projectName: string, archivePackage: any, parentIdentifier: string): void {
		this.$serviceProxy.call('POST', ['/projects/import', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(parentIdentifier.replace(/\\/g, '/'))].join('/'), null, archivePackage, null);
	}

	importProject(solutionName: string, projectName: string, package_: any): void {
		this.$serviceProxy.call('POST', ['/projects/importProject', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, package_, null);
	}

	renameProject(solutionName: string, projectName: string, newProjectName: string): void {
		this.$serviceProxy.call('PUT', ['/projects/rename', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/')), encodeURI(newProjectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	renameSolution(solutionName: string, newSolutionName: string): void {
		this.$serviceProxy.call('PUT', ['/projects/rename', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(newSolutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	saveProjectContents(solutionName: string, projectName: string, projectContents: any): void {
		this.$serviceProxy.call('PUT', ['/projects/contents', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, projectContents, null);
	}

	setProjectProperty(solutionName: string, projectName: string, changeset: any): void {
		this.$serviceProxy.call('PATCH', ['/projects', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, changeset, null);
	}

	upgradeSolution(solutionName: string): void {
		this.$serviceProxy.call('UPGRADE', ['/projects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

}

export class SolutionUserSettingsService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getSettings(solutionName: string): any {
		return this.$serviceProxy.call('GET', ['/settings/solution', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getUserSettings($resultStream: WritableStream): void {
		this.$serviceProxy.call('GET', '/settings/currentUser', 'application/octet-stream', null, $resultStream);
	}

	saveUserSettings(content: any): void {
		this.$serviceProxy.call('POST', '/settings/currentUser', null, content, null);
	}

	setActiveBuildConfiguration(solutionName: string, buildConfiguration: string): void {
		this.$serviceProxy.call('PUT', ['/settings/buildConfiguration', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(buildConfiguration.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	setCodesignIdentity(solutionName: string, projectIdentity: string, platform: string, identityAlias: any): void {
		this.$serviceProxy.call('PUT', ['/settings/codesignIdentity', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), null, identityAlias, null);
	}

	setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: any): void {
		this.$serviceProxy.call('PUT', ['/settings/mobileProvision', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, provisionIdentifier, null);
	}

	updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: any): void {
		this.$serviceProxy.call('PATCH', ['/settings/updateProjectIdentifier', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, newProjectIdentity, null);
	}

}

export class TapService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	getExistingClientSolutions(): any {
		return this.$serviceProxy.call('GET', '/tap/projects', 'application/json', null, null);
	}

	getRemote(solutionName: string): any {
		return this.$serviceProxy.call('GET', ['/tap/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), 'application/json', null, null);
	}

	getUsersForProject(solutionName: string): any {
		return this.$serviceProxy.call('GET', ['/tap/userProjects', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getWorkspaces(accountId: string): any {
		return this.$serviceProxy.call('GET', ['/tap/workspaces', encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	initCurrentUserSharedRepository(solutionName: string): void {
		this.$serviceProxy.call('POST', ['/tap/userProjects', encodeURI(solutionName.replace(/\\/g, '/')), 'initSharedRepository'].join('/'), null, null, null);
	}

	setRemote(solutionName: string, remoteUrl: any): void {
		this.$serviceProxy.call('PUT', ['/tap/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), null, remoteUrl, null);
	}

}

export class VersionControlService {
	constructor(private $serviceProxy: Server.IServiceProxy) {
	}

	add(solutionName: string, filePaths: any): void {
		this.$serviceProxy.call('ADD', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, filePaths, null);
	}

	commit(solutionName: string, filePaths: any, commentText: any): void {
		this.$serviceProxy.call('COMMIT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [filePaths, commentText], null);
	}

	getChanges(solutionName: string, versionName: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'changes'].join('/'), 'application/json', null, null);
	}

	getCommit(solutionName: string, versionName: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}

	getCommits(solutionName: string, startDate: string, endDate: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'commits'].join('/') + '?' + querystring.stringify({ 'startDate': startDate, 'endDate': endDate }), 'application/json', null, null);
	}

	getConflicts(solutionName: string, contextSize: string, filePaths: any): any {
		return this.$serviceProxy.call('XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'conflicts/files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', filePaths, null);
	}

	getContents(solutionName: string, versionName: string, filePath: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'contents', encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getDiff(solutionName: string, versionName: string, otherVersionName: string, contextSize: string, filePaths: any): any {
		return this.$serviceProxy.call('XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'diff/files'].join('/') + '?' + querystring.stringify({ 'otherVersionName': otherVersionName, 'contextSize': contextSize }), 'application/json', filePaths, null);
	}

	getHistory(solutionName: string, versionName: string, filePath: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), encodeURI(versionName.replace(/\\/g, '/')), 'history', encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}

	getInfo(solutionName: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'info'].join('/'), 'application/json', null, null);
	}

	getRemote(solutionName: string): any {
		return this.$serviceProxy.call('GET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), 'application/json', null, null);
	}

	getStatus(solutionName: string, filePaths: any): any {
		return this.$serviceProxy.call('XGET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'status/files'].join('/'), 'application/json', filePaths, null);
	}

	init(solutionName: string): void {
		this.$serviceProxy.call('INIT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}

	move(solutionName: string, oldPaths: any, newPaths: any): void {
		this.$serviceProxy.call('MOVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, [oldPaths, newPaths], null);
	}

	remove(solutionName: string, filePaths: any): void {
		this.$serviceProxy.call('REMOVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/'), null, filePaths, null);
	}

	reset(solutionName: string, versionName: string, resetMode: string): void {
		this.$serviceProxy.call('RESET', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName, 'resetMode': resetMode }), null, null, null);
	}

	resolve(solutionName: string, versionName: string, filePaths: any): void {
		this.$serviceProxy.call('RESOLVE', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, filePaths, null);
	}

	revert(solutionName: string, versionName: string, filePaths: any): void {
		this.$serviceProxy.call('REVERT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, filePaths, null);
	}

	rollback(solutionName: string, versionName: string): void {
		this.$serviceProxy.call('ROLLBACK', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, null, null);
	}

	setRemote(solutionName: string, remoteUrl: any): void {
		this.$serviceProxy.call('PUT', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'remote'].join('/'), null, remoteUrl, null);
	}

	track(solutionName: string): any {
		return this.$serviceProxy.call('POST', ['/versioncontrol', encodeURI(solutionName.replace(/\\/g, '/')), 'status'].join('/'), 'application/json', null, null);
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
	public settings = $injector.resolve(SolutionUserSettingsService);
	public tap = $injector.resolve(TapService);
	public versioncontrol = $injector.resolve(VersionControlService);
}

$injector.register('server', Server);