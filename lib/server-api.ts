///<reference path=".d.ts"/>
//
// automatically generated code; do not edit manually!
//
"use strict";

import querystring = require('querystring');
import helpers = require('./helpers');

export class AnalyticsService implements Server.IAnalyticsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getApplications(accountId: string): IFuture<Server.AnalyticsApplicationData[]>{
		return this.$serviceProxy.call<Server.AnalyticsApplicationData[]>('GetApplications', 'GET', ['api','analytics','applications',encodeURI(helpers.stringReplaceAll(accountId,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getProjectKey(id: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetProjectKey', 'GET', ['api','analytics','applications',encodeURI(helpers.stringReplaceAll(id,'\\', '/')),'projectKey'].join('/'), 'application/json', null, null);
	}
	public createAnalyticsApp(workspaceId: string, applicationName: string, description: string): IFuture<string>{
		return this.$serviceProxy.call<string>('CreateAnalyticsApp', 'POST', ['api','analytics','applications',encodeURI(helpers.stringReplaceAll(workspaceId,'\\', '/')),encodeURI(helpers.stringReplaceAll(applicationName,'\\', '/'))].join('/'), 'application/json', [{name: 'description', value: description, contentType: 'application/json'}], null);
	}
}
export class AuthenticationService implements Server.IAuthenticationServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public login(simpleWebToken: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('Login', 'POST', ['api','authentication'].join('/'), 'application/json', [{name: 'simpleWebToken', value: simpleWebToken, contentType: 'application/json'}], null);
	}
	public logout(): IFuture<void>{
		return this.$serviceProxy.call<void>('Logout', 'LOGOUT', ['api','authentication'].join('/'), 'application/json', null, null);
	}
	public setUserProperty(propertyName: string, value: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('SetUserProperty', 'PATCH', ['api','authentication','currentUser',encodeURI(helpers.stringReplaceAll(propertyName,'\\', '/'))].join('/'), 'application/json', [{name: 'value', value: value, contentType: 'application/json'}], null);
	}
	public removeUserProperty(propertyName: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('RemoveUserProperty', 'DELETE', ['api','authentication','currentUser',encodeURI(helpers.stringReplaceAll(propertyName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getLoggedInUser(): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('GetLoggedInUser', 'GET', ['api','authentication','currentUser'].join('/'), 'application/json', null, null);
	}
	public getTenants(): IFuture<Server.Tenant[]>{
		return this.$serviceProxy.call<Server.Tenant[]>('GetTenants', 'GET', ['api','authentication','tenants'].join('/'), 'application/json', null, null);
	}
	public setActiveTenant(tenantId: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('SetActiveTenant', 'PATCH', ['api','authentication','tenants',encodeURI(helpers.stringReplaceAll(tenantId,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public agreeToEula(): IFuture<void>{
		return this.$serviceProxy.call<void>('AgreeToEula', 'POST', ['api','authentication','eula'].join('/'), 'application/json', null, null);
	}
}
export class CordovaService implements Server.ICordovaServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getLiveSyncToken(solutionName: string, projectName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncToken', 'GET', ['api','cordova','liveSyncToken',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getLiveSyncUrl(longUrl: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncUrl', 'GET', ['api','cordova','liveSyncUrl'].join('/') + '?' + querystring.stringify({ 'longUrl': longUrl }), 'application/json', null, null);
	}
	public getPlugins(version: string): IFuture<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetPlugins', 'GET', ['api','cordova',encodeURI(helpers.stringReplaceAll(version,'\\', '/')),'plugins'].join('/'), 'application/json', null, null);
	}
	public getJs(version: string, platform: Server.DevicePlatform, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetJs', 'GET', ['api','cordova',encodeURI(helpers.stringReplaceAll(version,'\\', '/')),encodeURI(helpers.stringReplaceAll(Server.DevicePlatform[platform],'\\', '/')),'js'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getMigrationData(): IFuture<Server.CordovaMigrationData>{
		return this.$serviceProxy.call<Server.CordovaMigrationData>('GetMigrationData', 'GET', ['api','cordova','migration-data'].join('/'), 'application/json', null, null);
	}
	public getPluginsPackage($resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetPluginsPackage', 'GET', ['api','cordova','plugins','package'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getCordovaVersions(): IFuture<string[]>{
		return this.$serviceProxy.call<string[]>('GetCordovaVersions', 'GET', ['api','cordova','versions'].join('/'), 'application/json', null, null);
	}
	public getCurrentPlatforms(solutionName: string, projectName: string): IFuture<Server.DevicePlatform[]>{
		return this.$serviceProxy.call<Server.DevicePlatform[]>('GetCurrentPlatforms', 'GET', ['api','cordova','platforms',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public addPlatform(platform: Server.DevicePlatform, solutionName: string, projectName: string): IFuture<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('AddPlatform', 'POST', ['api','cordova','platforms',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(Server.DevicePlatform[platform],'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public migrate(solutionName: string, projectName: string, targetVersion: string): IFuture<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','cordova','migrate',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
}
export class IdentityStoreService implements Server.IIdentityStoreServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getIdentities(): IFuture<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('GetIdentities', 'GET', ['api','identityStore','identities'].join('/'), 'application/json', null, null);
	}
	public generateSelfSignedIdentity(generationData: Server.IdentityGenerationData): IFuture<Server.CryptographicIdentityData>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData>('GenerateSelfSignedIdentity', 'GENERATE', ['api','identityStore','identities'].join('/'), 'application/json', [{name: 'generationData', value: generationData, contentType: 'application/json'}], null);
	}
	public importIdentity(importType: Server.ImportType, password: string, stream: any): IFuture<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('ImportIdentity', 'POST', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'importType': importType, 'password': password }), 'application/json', [{name: 'stream', value: stream, contentType: 'application/octet-stream'}], null);
	}
	public removeIdentity(identityAlias: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RemoveIdentity', 'DELETE', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias }), 'application/json', null, null);
	}
	public getIdentity(identityAlias: string, password: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetIdentity', 'GET', ['api','identityStore','identities','export'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias, 'password': password }), 'application/octet-stream', null, $resultStream);
	}
	public getCertificateRequests(): IFuture<Server.CertificateRequestData[]>{
		return this.$serviceProxy.call<Server.CertificateRequestData[]>('GetCertificateRequests', 'GET', ['api','identityStore','certificationRequests'].join('/'), 'application/json', null, null);
	}
	public generateCertificationRequest(subjectNameValues: StringMap<string>): IFuture<Server.CertificateRequestData>{
		return this.$serviceProxy.call<Server.CertificateRequestData>('GenerateCertificationRequest', 'POST', ['api','identityStore','certificationRequests'].join('/'), 'application/json', [{name: 'subjectNameValues', value: subjectNameValues, contentType: 'application/json'}], null);
	}
	public removeCertificateRequest(uniqueName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RemoveCertificateRequest', 'DELETE', ['api','identityStore','certificationRequests'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/json', null, null);
	}
	public getCertificateRequest(uniqueName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetCertificateRequest', 'GET', ['api','identityStore','certificationRequests','export'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/octet-stream', null, $resultStream);
	}
}
export class EverliveService implements Server.IEverliveServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getAccessToken(): IFuture<Server.ImpersonatedTokenData>{
		return this.$serviceProxy.call<Server.ImpersonatedTokenData>('GetAccessToken', 'GET', ['api','everlive','accessToken'].join('/'), 'application/json', null, null);
	}
	public getEverliveApplications(accountId: string): IFuture<Server.EverliveApplicationData[]>{
		return this.$serviceProxy.call<Server.EverliveApplicationData[]>('GetEverliveApplications', 'GET', ['api','everlive','applications',encodeURI(helpers.stringReplaceAll(accountId,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class FilesystemService implements Server.IFilesystemServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getContent(solutionName: string, path: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetContent', 'GET', ['api','filesystem','raw',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['api','filesystem','file',encodeURI(helpers.stringReplaceAll(solutionSpaceName,'\\', '/')),encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public save(solutionName: string, path: string, content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('Save', 'POST', ['api','filesystem',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/json', [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public createDirectory(solutionName: string, path: string): IFuture<void>{
		return this.$serviceProxy.call<void>('CreateDirectory', 'MKDIR', ['api','filesystem',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public remove(solutionName: string, path: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Remove', 'DELETE', ['api','filesystem',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class ImagesService implements Server.IImagesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public resizeImage(solutionName: string, path: string, size: Server.Size): IFuture<void>{
		return this.$serviceProxy.call<void>('ResizeImage', 'POST', ['api','images','resize',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(path,'\\', '/'))].join('/'), 'application/json', [{name: 'size', value: size, contentType: 'application/json'}], null);
	}
}
export class ItmstransporterService implements Server.IItmstransporterServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getApplicationsReadyForUpload(username: string, password: string): IFuture<Server.Application[]>{
		return this.$serviceProxy.call<Server.Application[]>('GetApplicationsReadyForUpload', 'POST', ['api','itmstransporter','applications'].join('/') + '?' + querystring.stringify({ 'username': username }), 'application/json', [{name: 'password', value: password, contentType: 'application/json'}], null);
	}
	public uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','itmstransporter','upload',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(relativePackagePath,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'username': username }), 'application/json', [{name: 'password', value: password, contentType: 'application/json'}], null);
	}
}
export class KendoService implements Server.IKendoServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getPackages(): IFuture<Server.KendoDownloadablePackageData[]>{
		return this.$serviceProxy.call<Server.KendoDownloadablePackageData[]>('GetPackages', 'GET', ['api','kendo','packages'].join('/'), 'application/json', null, null);
	}
	public changeKendoPackage(solutionName: string, projectName: string, packageId: string): IFuture<void>{
		return this.$serviceProxy.call<void>('ChangeKendoPackage', 'PATCH', ['api','kendo',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'packageId': packageId }), 'application/json', null, null);
	}
	public getCurrentPackage(solutionName: string, projectName: string): IFuture<Server.KendoPackageData>{
		return this.$serviceProxy.call<Server.KendoPackageData>('GetCurrentPackage', 'GET', ['api','kendo',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),'version'].join('/'), 'application/json', null, null);
	}
}
export class MobileprovisionsService implements Server.IMobileprovisionsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getProvisions(): IFuture<Server.ProvisionData[]>{
		return this.$serviceProxy.call<Server.ProvisionData[]>('GetProvisions', 'GET', ['api','mobileprovisions'].join('/'), 'application/json', null, null);
	}
	public importProvision(provision: any): IFuture<Server.ProvisionData>{
		return this.$serviceProxy.call<Server.ProvisionData>('ImportProvision', 'POST', ['api','mobileprovisions'].join('/'), 'application/json', [{name: 'provision', value: provision, contentType: 'application/octet-stream'}], null);
	}
	public removeProvision(identifier: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RemoveProvision', 'DELETE', ['api','mobileprovisions',encodeURI(helpers.stringReplaceAll(identifier,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class BuildService implements Server.IBuildServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public buildProject(solutionName: string, projectName: string, buildRequest: Server.BuildRequestData): IFuture<Server.BuildResultData>{
		return this.$serviceProxy.call<Server.BuildResultData>('BuildProject', 'POST', ['api','build',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', [{name: 'buildRequest', value: buildRequest, contentType: 'application/json'}], null);
	}
}
export class ProjectsService implements Server.IProjectsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getProjectFileSchema($resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetProjectFileSchema', 'GET', ['api','projects','projectFileSchema'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getProjectTemplates(): IFuture<Server.ProjectTemplateData[]>{
		return this.$serviceProxy.call<Server.ProjectTemplateData[]>('GetProjectTemplates', 'GET', ['api','projects','projectTemplates'].join('/'), 'application/json', null, null);
	}
	public getItemTemplates(): IFuture<Server.ItemTemplateData[]>{
		return this.$serviceProxy.call<Server.ItemTemplateData[]>('GetItemTemplates', 'GET', ['api','projects','itemTemplates'].join('/'), 'application/json', null, null);
	}
	public exportSolution(solutionSpaceName: string, solutionName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('ExportSolution', 'GET', ['api','projects','export',encodeURI(helpers.stringReplaceAll(solutionSpaceName,'\\', '/')),encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getExportedSolution(solutionName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetExportedSolution', 'GET', ['api','projects','export',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public importPackage(solutionName: string, projectName: string, parentIdentifier: string, archivePackage: any): IFuture<void>{
		return this.$serviceProxy.call<void>('ImportPackage', 'POST', ['api','projects','import',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(parentIdentifier,'\\', '/'))].join('/'), 'application/json', [{name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}], null);
	}
	public importProject(solutionName: string, projectName: string, $package: any): IFuture<void>{
		return this.$serviceProxy.call<void>('ImportProject', 'POST', ['api','projects','importProject',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', [{name: '$package', value: $package, contentType: 'application/octet-stream'}], null);
	}
	public getProjectContents(solutionName: string, projectName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetProjectContents', 'GET', ['api','projects','contents',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public saveProjectContents(solutionName: string, projectName: string, projectContents: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveProjectContents', 'PUT', ['api','projects','contents',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', [{name: 'projectContents', value: projectContents, contentType: 'application/json'}], null);
	}
	public upgradeSolution(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UpgradeSolution', 'UPGRADE', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getSolution(solutionName: string, checkUpgradability: boolean): IFuture<Server.SolutionData>{
		return this.$serviceProxy.call<Server.SolutionData>('GetSolution', 'GET', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'checkUpgradability': checkUpgradability }), 'application/json', null, null);
	}
	public canLoadSolution(solutionName: string): IFuture<boolean>{
		return this.$serviceProxy.call<boolean>('CanLoadSolution', 'EXISTS', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public deleteSolution(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteSolution', 'DELETE', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public createProject(solutionName: string, expansionData: Server.ProjectTemplateExpansionData): IFuture<void>{
		return this.$serviceProxy.call<void>('CreateProject', 'POST', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', [{name: 'expansionData', value: expansionData, contentType: 'application/json'}], null);
	}
	public renameSolution(solutionName: string, newSolutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RenameSolution', 'PUT', ['api','projects','rename',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(newSolutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public renameProject(solutionName: string, projectName: string, newProjectName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RenameProject', 'PUT', ['api','projects','rename',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(newProjectName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public deleteProject(solutionName: string, projectName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteProject', 'DELETE', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public setProjectProperty(solutionName: string, projectName: string, changeset: StringMap<string>): IFuture<void>{
		return this.$serviceProxy.call<void>('SetProjectProperty', 'PATCH', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/'))].join('/'), 'application/json', [{name: 'changeset', value: changeset, contentType: 'application/json'}], null);
	}
	public createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): IFuture<void>{
		return this.$serviceProxy.call<void>('CreateNewProjectItem', 'POST', ['api','projects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(itemIdentifier,'\\', '/'))].join('/'), 'application/json', [{name: 'expansionData', value: expansionData, contentType: 'application/json'}], null);
	}
}
export class RawSettingsService implements Server.IRawSettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getUserSettings($resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetUserSettings', 'GET', ['api','rawSettings','currentUser'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public saveUserSettings(content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveUserSettings', 'POST', ['api','rawSettings','currentUser'].join('/'), 'application/json', [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public getSolutionUserSettings(solutionName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetSolutionUserSettings', 'GET', ['api','rawSettings','solution',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public saveSolutionUserSettings(solutionName: string, content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveSolutionUserSettings', 'POST', ['api','rawSettings','solution',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
}
export class SettingsService implements Server.ISettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getSettings(solutionName: string): IFuture<Server.SettingsData>{
		return this.$serviceProxy.call<Server.SettingsData>('GetSettings', 'GET', ['api','settings','solution',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public setCodesignIdentity(solutionName: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetCodesignIdentity', 'PUT', ['api','settings','codesignIdentity',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectIdentity,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), 'application/json', [{name: 'identityAlias', value: identityAlias, contentType: 'application/json'}], null);
	}
	public setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetMobileProvision', 'PUT', ['api','settings','mobileProvision',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectIdentity,'\\', '/'))].join('/'), 'application/json', [{name: 'provisionIdentifier', value: provisionIdentifier, contentType: 'application/json'}], null);
	}
	public setActiveBuildConfiguration(buildConfiguration: string, solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetActiveBuildConfiguration', 'PUT', ['api','settings','buildConfiguration',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(buildConfiguration,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UpdateSettingsProjectIdentifier', 'PATCH', ['api','settings','updateProjectIdentifier',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectIdentity,'\\', '/'))].join('/'), 'application/json', [{name: 'newProjectIdentity', value: newProjectIdentity, contentType: 'application/json'}], null);
	}
}
export class TamService implements Server.ITamServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public verifyStoreCreated(): IFuture<void>{
		return this.$serviceProxy.call<void>('VerifyStoreCreated', 'GET', ['api','tam','store'].join('/'), 'application/json', null, null);
	}
	public uploadApplication(solutionName: string, projectName: string, relativePackagePath: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','tam','applications',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(projectName,'\\', '/')),encodeURI(helpers.stringReplaceAll(relativePackagePath,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class TapService implements Server.ITapServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getFeatures(accountId: string, serviceType: string): IFuture<string[]>{
		return this.$serviceProxy.call<string[]>('GetFeatures', 'GET', ['api','tap','features',encodeURI(helpers.stringReplaceAll(accountId,'\\', '/')),encodeURI(helpers.stringReplaceAll(serviceType,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getExistingClientSolutions(): IFuture<Server.TapSolutionData[]>{
		return this.$serviceProxy.call<Server.TapSolutionData[]>('GetExistingClientSolutions', 'GET', ['api','tap','projects'].join('/'), 'application/json', null, null);
	}
	public getRemote(solutionName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','tap','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public setRemote(solutionName: string, remoteUrl: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','tap','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'remote'].join('/'), 'application/json', [{name: 'remoteUrl', value: remoteUrl, contentType: 'application/json'}], null);
	}
	public getUsersForProject(solutionName: string): IFuture<Server.Collaborator[]>{
		return this.$serviceProxy.call<Server.Collaborator[]>('GetUsersForProject', 'GET', ['api','tap','userProjects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public initCurrentUserSharedRepository(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('InitCurrentUserSharedRepository', 'POST', ['api','tap','userProjects',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'initSharedRepository'].join('/'), 'application/json', null, null);
	}
	public getWorkspaces(accountId: string): IFuture<Server.TapWorkspaceData[]>{
		return this.$serviceProxy.call<Server.TapWorkspaceData[]>('GetWorkspaces', 'GET', ['api','tap','workspaces',encodeURI(helpers.stringReplaceAll(accountId,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class VersioncontrolService implements Server.IVersioncontrolServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public init(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Init', 'INIT', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public rollback(solutionName: string, versionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Rollback', 'ROLLBACK', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public reset(solutionName: string, resetMode: Server.ResetMode, versionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Reset', 'RESET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'resetMode': resetMode, 'versionName': versionName }), 'application/json', null, null);
	}
	public merge(solutionName: string, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('Merge', 'MERGE', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public revert(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Revert', 'REVERT', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public resolve(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Resolve', 'RESOLVE', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public checkout(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Checkout', 'CHECKOUT', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public add(solutionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Add', 'ADD', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'files'].join('/'), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public remove(solutionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Remove', 'REMOVE', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'files'].join('/'), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public getBranches(solutionName: string): IFuture<Server.BranchItemData[]>{
		return this.$serviceProxy.call<Server.BranchItemData[]>('GetBranches', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'branches'].join('/'), 'application/json', null, null);
	}
	public getCurrentBranch(solutionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('GetCurrentBranch', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'branch'].join('/'), 'application/json', null, null);
	}
	public checkoutBranch(solutionName: string, branchName: string, createBranch: boolean, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CheckoutBranch', 'CHECKOUT', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'branches',encodeURI(helpers.stringReplaceAll(branchName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'createBranch': createBranch, 'versionName': versionName }), 'application/json', null, null);
	}
	public createBranch(solutionName: string, branchName: string, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CreateBranch', 'POST', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'branches',encodeURI(helpers.stringReplaceAll(branchName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public deleteBranch(solutionName: string, branchName: string, forceDelete: boolean): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteBranch', 'DELETE', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'branches',encodeURI(helpers.stringReplaceAll(branchName,'\\', '/'))].join('/') + '?' + querystring.stringify({ 'forceDelete': forceDelete }), 'application/json', null, null);
	}
	public getRemote(solutionName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public setRemote(solutionName: string, remoteUrl: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'remote'].join('/'), 'application/json', [{name: 'remoteUrl', value: remoteUrl, contentType: 'application/json'}], null);
	}
	public getInfo(solutionName: string): IFuture<Server.VersionControlData>{
		return this.$serviceProxy.call<Server.VersionControlData>('GetInfo', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'info'].join('/'), 'application/json', null, null);
	}
	public track(solutionName: string): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('Track', 'POST', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'status'].join('/'), 'application/json', null, null);
	}
	public getStatus(solutionName: string, filePaths: string[]): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetStatus', 'XGET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'status','files'].join('/'), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public getDiff(solutionName: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): IFuture<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetDiff', 'XGET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(versionName,'\\', '/')),'diff','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize, 'otherVersionName': otherVersionName }), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public getConflicts(solutionName: string, contextSize: number, filePaths: string[]): IFuture<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetConflicts', 'XGET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'conflicts','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: filePaths, contentType: 'application/json'}], null);
	}
	public getCommits(solutionName: string, endDate: Date, startDate: Date): IFuture<Server.ChangeSetData[]>{
		return this.$serviceProxy.call<Server.ChangeSetData[]>('GetCommits', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'commits'].join('/') + '?' + querystring.stringify({ 'endDate': endDate, 'startDate': startDate }), 'application/json', null, null);
	}
	public getCommit(solutionName: string, versionName: string): IFuture<Server.ChangeSetData>{
		return this.$serviceProxy.call<Server.ChangeSetData>('GetCommit', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),'commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public getChanges(solutionName: string, versionName: string): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetChanges', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(versionName,'\\', '/')),'changes'].join('/'), 'application/json', null, null);
	}
	public getContents(solutionName: string, versionName: string, filePath: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetContents', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(versionName,'\\', '/')),'contents',encodeURI(helpers.stringReplaceAll(filePath,'\\', '/'))].join('/'), 'application/json', null, null);
	}
	public getHistory(solutionName: string, versionName: string, filePath: string): IFuture<Server.HistoryItemData[]>{
		return this.$serviceProxy.call<Server.HistoryItemData[]>('GetHistory', 'GET', ['api','versioncontrol',encodeURI(helpers.stringReplaceAll(solutionName,'\\', '/')),encodeURI(helpers.stringReplaceAll(versionName,'\\', '/')),'history',encodeURI(helpers.stringReplaceAll(filePath,'\\', '/'))].join('/'), 'application/json', null, null);
	}
}
export class ServiceContainer implements Server.IServer{
	public analytics: Server.IAnalyticsServiceContract = $injector.resolve(AnalyticsService);
	public authentication: Server.IAuthenticationServiceContract = $injector.resolve(AuthenticationService);
	public cordova: Server.ICordovaServiceContract = $injector.resolve(CordovaService);
	public identityStore: Server.IIdentityStoreServiceContract = $injector.resolve(IdentityStoreService);
	public everlive: Server.IEverliveServiceContract = $injector.resolve(EverliveService);
	public filesystem: Server.IFilesystemServiceContract = $injector.resolve(FilesystemService);
	public images: Server.IImagesServiceContract = $injector.resolve(ImagesService);
	public itmstransporter: Server.IItmstransporterServiceContract = $injector.resolve(ItmstransporterService);
	public kendo: Server.IKendoServiceContract = $injector.resolve(KendoService);
	public mobileprovisions: Server.IMobileprovisionsServiceContract = $injector.resolve(MobileprovisionsService);
	public build: Server.IBuildServiceContract = $injector.resolve(BuildService);
	public projects: Server.IProjectsServiceContract = $injector.resolve(ProjectsService);
	public rawSettings: Server.IRawSettingsServiceContract = $injector.resolve(RawSettingsService);
	public settings: Server.ISettingsServiceContract = $injector.resolve(SettingsService);
	public tam: Server.ITamServiceContract = $injector.resolve(TamService);
	public tap: Server.ITapServiceContract = $injector.resolve(TapService);
	public versioncontrol: Server.IVersioncontrolServiceContract = $injector.resolve(VersioncontrolService);
}
$injector.register('server', ServiceContainer);

