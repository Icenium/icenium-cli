///<reference path=".d.ts"/>
//
// automatically generated code; do not edit manually!
//
"use strict";

import querystring = require('querystring');

export class AuthenticationService implements Server.IAuthenticationServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public login(simpleWebToken: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('Login', 'POST', ['api','authentication'].join('/'), 'application/json', [{name: 'simpleWebToken', value: JSON.stringify(simpleWebToken), contentType: 'application/json'}], null);
	}
	public logout(): IFuture<void>{
		return this.$serviceProxy.call<void>('Logout', 'LOGOUT', ['api','authentication'].join('/'), null, null, null);
	}
	public getLoggedInUser(): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('GetLoggedInUser', 'GET', ['api','authentication','currentUser'].join('/'), 'application/json', null, null);
	}
	public getTenants(): IFuture<Server.Tenant[]>{
		return this.$serviceProxy.call<Server.Tenant[]>('GetTenants', 'GET', ['api','authentication','tenants'].join('/'), 'application/json', null, null);
	}
	public setActiveTenant(tenantId: string): IFuture<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('SetActiveTenant', 'PATCH', ['api','authentication','tenants',encodeURI(tenantId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public agreeToEula(): IFuture<void>{
		return this.$serviceProxy.call<void>('AgreeToEula', 'POST', ['api','authentication','eula'].join('/'), null, null, null);
	}
}
export class CordovaService implements Server.ICordovaServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getLiveSyncToken(solutionName: string, projectName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncToken', 'GET', ['api','cordova','liveSyncToken',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getLiveSyncUrl(longUrl: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncUrl', 'GET', ['api','cordova','liveSyncUrl'].join('/') + '?' + querystring.stringify({ 'longUrl': longUrl }), 'application/json', null, null);
	}
	public getPlugins(version: string): IFuture<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetPlugins', 'GET', ['api','cordova',encodeURI(version.replace(/\\/g, '/')),'plugins'].join('/'), 'application/json', null, null);
	}
	public getJs(version: string, platform: Server.DevicePlatform, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetJs', 'GET', ['api','cordova',encodeURI(version.replace(/\\/g, '/')),encodeURI((<any>platform).replace(/\\/g, '/')),'js'].join('/'), 'application/octet-stream', null, $resultStream);
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
	public getMarketplacePluginData(pluginId: string, version: string): IFuture<Server.CordovaPluginData>{
		return this.$serviceProxy.call<Server.CordovaPluginData>('GetMarketplacePluginData', 'GET', ['api','cordova','marketplace',encodeURI(pluginId.replace(/\\/g, '/')),encodeURI(version.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getCurrentPlatforms(solutionName: string, projectName: string): IFuture<Server.DevicePlatform[]>{
		return this.$serviceProxy.call<Server.DevicePlatform[]>('GetCurrentPlatforms', 'GET', ['api','cordova','platforms',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public addPlatform(platform: Server.DevicePlatform, solutionName: string, projectName: string): IFuture<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('AddPlatform', 'POST', ['api','cordova','platforms',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI((<any>platform).replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public migrate(solutionName: string, projectName: string, targetVersion: string): IFuture<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','cordova','migrate',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public applyMigration(solutionName: string, projectName: string, sourceVersion: string, targetVersion: string): IFuture<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('ApplyMigration', 'POST', ['api','cordova','apply-migration',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'sourceVersion': sourceVersion, 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public getProjectCordovaPlugins(solutionName: string, projectName: string): IFuture<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetProjectCordovaPlugins', 'GET', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getCordovaPluginVariables(solutionName: string, projectName: string): IFuture<Server.CordovaPluginVariablesData>{
		return this.$serviceProxy.call<Server.CordovaPluginVariablesData>('GetCordovaPluginVariables', 'GET', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'variables'].join('/'), 'application/json', null, null);
	}
	public setCordovaPluginVariable(solutionName: string, projectName: string, pluginId: string, variableName: string, configuration: string, value: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetCordovaPluginVariable', 'POST', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'variables',encodeURI(pluginId.replace(/\\/g, '/')),encodeURI(variableName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'value', value: JSON.stringify(value), contentType: 'application/json'}], null);
	}
}
export class IdentityStoreService implements Server.IIdentityStoreServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getIdentities(): IFuture<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('GetIdentities', 'GET', ['api','identityStore','identities'].join('/'), 'application/json', null, null);
	}
	public generateSelfSignedIdentity(generationData: Server.IdentityGenerationData): IFuture<Server.CryptographicIdentityData>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData>('GenerateSelfSignedIdentity', 'GENERATE', ['api','identityStore','identities'].join('/'), 'application/json', [{name: 'generationData', value: JSON.stringify(generationData), contentType: 'application/json'}], null);
	}
	public importIdentity(importType: Server.ImportType, password: string, stream: any): IFuture<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('ImportIdentity', 'POST', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'importType': importType, 'password': password }), 'application/json', [{name: 'stream', value: stream, contentType: 'application/octet-stream'}], null);
	}
	public removeIdentity(identityAlias: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RemoveIdentity', 'DELETE', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias }), null, null, null);
	}
	public getIdentity(identityAlias: string, password: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetIdentity', 'GET', ['api','identityStore','identities','export'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias, 'password': password }), 'application/octet-stream', null, $resultStream);
	}
	public getCertificateRequests(): IFuture<Server.CertificateRequestData[]>{
		return this.$serviceProxy.call<Server.CertificateRequestData[]>('GetCertificateRequests', 'GET', ['api','identityStore','certificationRequests'].join('/'), 'application/json', null, null);
	}
	public generateCertificationRequest(subjectNameValues: IDictionary<string>): IFuture<Server.CertificateRequestData>{
		return this.$serviceProxy.call<Server.CertificateRequestData>('GenerateCertificationRequest', 'POST', ['api','identityStore','certificationRequests'].join('/'), 'application/json', [{name: 'subjectNameValues', value: JSON.stringify(subjectNameValues), contentType: 'application/json'}], null);
	}
	public removeCertificateRequest(uniqueName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RemoveCertificateRequest', 'DELETE', ['api','identityStore','certificationRequests'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), null, null, null);
	}
	public getCertificateRequest(uniqueName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetCertificateRequest', 'GET', ['api','identityStore','certificationRequests','export'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/octet-stream', null, $resultStream);
	}
}
export class EverliveService implements Server.IEverliveServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getAuthorizationHeader(): IFuture<string>{
		return this.$serviceProxy.call<string>('GetAuthorizationHeader', 'GET', ['api','everlive','authorizationHeader'].join('/'), 'application/json', null, null);
	}
	public getEverliveApplications(accountId: string): IFuture<Server.EverliveApplicationData[]>{
		return this.$serviceProxy.call<Server.EverliveApplicationData[]>('GetEverliveApplications', 'GET', ['api','everlive','applications',encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class FilesystemService implements Server.IFilesystemServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getContent(solutionName: string, path: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetContent', 'GET', ['api','filesystem','raw',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['api','filesystem','file',encodeURI(solutionSpaceName.replace(/\\/g, '/')),encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public save(solutionName: string, path: string, content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('Save', 'POST', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public createDirectory(solutionName: string, path: string): IFuture<void>{
		return this.$serviceProxy.call<void>('CreateDirectory', 'MKDIR', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public remove(solutionName: string, path: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Remove', 'DELETE', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
}
export class ImagesService implements Server.IImagesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public resizeImage(solutionName: string, path: string, size: Server.Size): IFuture<void>{
		return this.$serviceProxy.call<void>('ResizeImage', 'POST', ['api','images','resize',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'size', value: JSON.stringify(size), contentType: 'application/json'}], null);
	}
}
export class ItmstransporterService implements Server.IItmstransporterServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getApplicationsReadyForUpload(username: string, password: string): IFuture<Server.Application[]>{
		return this.$serviceProxy.call<Server.Application[]>('GetApplicationsReadyForUpload', 'POST', ['api','itmstransporter','applications'].join('/') + '?' + querystring.stringify({ 'username': username }), 'application/json', [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
	public uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','itmstransporter','upload',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'username': username }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
}
export class KendoService implements Server.IKendoServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getPackages(): IFuture<Server.KendoDownloadablePackageData[]>{
		return this.$serviceProxy.call<Server.KendoDownloadablePackageData[]>('GetPackages', 'GET', ['api','kendo','packages'].join('/'), 'application/json', null, null);
	}
	public changeKendoPackage(solutionName: string, projectName: string, packageId: string): IFuture<void>{
		return this.$serviceProxy.call<void>('ChangeKendoPackage', 'PATCH', ['api','kendo',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'packageId': packageId }), null, null, null);
	}
	public getCurrentPackage(solutionName: string, projectName: string): IFuture<Server.KendoPackageData>{
		return this.$serviceProxy.call<Server.KendoPackageData>('GetCurrentPackage', 'GET', ['api','kendo',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'version'].join('/'), 'application/json', null, null);
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
		return this.$serviceProxy.call<void>('RemoveProvision', 'DELETE', ['api','mobileprovisions',encodeURI(identifier.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
}
export class BuildService implements Server.IBuildServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public buildProject(solutionName: string, projectName: string, buildRequest: Server.BuildRequestData): IFuture<Server.BuildResultData>{
		return this.$serviceProxy.call<Server.BuildResultData>('BuildProject', 'POST', ['api','build',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json'}], null);
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
		return this.$serviceProxy.call<void>('ExportSolution', 'GET', ['api','projects','export',encodeURI(solutionSpaceName.replace(/\\/g, '/')),encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public getExportedSolution(solutionName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetExportedSolution', 'GET', ['api','projects','export',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public importPackage(solutionName: string, projectName: string, parentIdentifier: string, archivePackage: any): IFuture<void>{
		return this.$serviceProxy.call<void>('ImportPackage', 'POST', ['api','projects','import',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(parentIdentifier.replace(/\\/g, '/'))].join('/'), null, [{name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}], null);
	}
	public importProject(solutionName: string, projectName: string, package_: any): IFuture<void>{
		return this.$serviceProxy.call<void>('ImportProject', 'POST', ['api','projects','importProject',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'package_', value: package_, contentType: 'application/octet-stream'}], null);
	}
	public getProjectContents(solutionName: string, projectName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetProjectContents', 'GET', ['api','projects','contents',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public saveProjectContents(solutionName: string, projectName: string, projectContents: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveProjectContents', 'PUT', ['api','projects','contents',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'projectContents', value: JSON.stringify(projectContents), contentType: 'application/json'}], null);
	}
	public upgradeSolution(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UpgradeSolution', 'UPGRADE', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public getSolution(solutionName: string, checkUpgradability: boolean): IFuture<Server.SolutionData>{
		return this.$serviceProxy.call<Server.SolutionData>('GetSolution', 'GET', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'checkUpgradability': checkUpgradability }), 'application/json', null, null);
	}
	public canLoadSolution(solutionName: string): IFuture<boolean>{
		return this.$serviceProxy.call<boolean>('CanLoadSolution', 'EXISTS', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public deleteSolution(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteSolution', 'DELETE', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public createProject(solutionName: string, expansionData: Server.ProjectTemplateExpansionData, projectName?: string): IFuture<void>{
		if(projectName) { 
			return this.$serviceProxy.call<void>('CreateProject', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
		} 

		return this.$serviceProxy.call<void>('CreateProject', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
	public renameSolution(solutionName: string, newSolutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RenameSolution', 'PUT', ['api','projects','rename',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(newSolutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public deleteProject(solutionName: string, projectName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteProject', 'DELETE', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public setProjectProperty(solutionName: string, projectName: string, configuration: string, changeset: IDictionary<string>): IFuture<void>{
		return this.$serviceProxy.call<void>('SetProjectProperty', 'PATCH', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'changeset', value: JSON.stringify(changeset), contentType: 'application/json'}], null);
	}
	public renameProject(solutionName: string, projectName: string, newProjectName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('RenameProject', 'PUT', ['api','projects','rename',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(newProjectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): IFuture<Server.ProjectItemInfo[]>{
		return this.$serviceProxy.call<Server.ProjectItemInfo[]>('CreateNewProjectItem', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(itemIdentifier.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
}
export class PackagesService implements Server.IPackagesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public installPackage(solutionName: string, projectName: string, packageName: string, version: string): IFuture<void>{
		return this.$serviceProxy.call<void>('InstallPackage', 'PUT', ['api','packages',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(packageName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'version': version }), null, null, null);
	}
	public getInstalledPackages(solutionName: string, projectName: string): IFuture<Server.PackageData[]>{
		return this.$serviceProxy.call<Server.PackageData[]>('GetInstalledPackages', 'GET', ['api','packages',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getFilters(): IFuture<Server.BowerPackagesFilters>{
		return this.$serviceProxy.call<Server.BowerPackagesFilters>('GetFilters', 'GET', ['api','packages','filters'].join('/'), 'application/json', null, null);
	}
}
export class RawSettingsService implements Server.IRawSettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getUserSettings($resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetUserSettings', 'GET', ['api','rawSettings','currentUser'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public saveUserSettings(content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveUserSettings', 'POST', ['api','rawSettings','currentUser'].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public getSolutionUserSettings(solutionName: string, $resultStream: any): IFuture<void>{
		return this.$serviceProxy.call<void>('GetSolutionUserSettings', 'GET', ['api','rawSettings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public saveSolutionUserSettings(solutionName: string, content: any): IFuture<void>{
		return this.$serviceProxy.call<void>('SaveSolutionUserSettings', 'POST', ['api','rawSettings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
}
export class SettingsService implements Server.ISettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getSettings(solutionName: string): IFuture<Server.SettingsData>{
		return this.$serviceProxy.call<Server.SettingsData>('GetSettings', 'GET', ['api','settings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public setCodesignIdentity(solutionName: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetCodesignIdentity', 'PUT', ['api','settings','codesignIdentity',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), null, [{name: 'identityAlias', value: JSON.stringify(identityAlias), contentType: 'application/json'}], null);
	}
	public setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetMobileProvision', 'PUT', ['api','settings','mobileProvision',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'provisionIdentifier', value: JSON.stringify(provisionIdentifier), contentType: 'application/json'}], null);
	}
	public setActiveBuildConfiguration(buildConfiguration: string, solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetActiveBuildConfiguration', 'PUT', ['api','settings','buildConfiguration',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(buildConfiguration.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UpdateSettingsProjectIdentifier', 'PATCH', ['api','settings','updateProjectIdentifier',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'newProjectIdentity', value: JSON.stringify(newProjectIdentity), contentType: 'application/json'}], null);
	}
}
export class StatusService implements Server.IStatusServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getLinuxBuildMachineStatus(): IFuture<string>{
		return this.$serviceProxy.call<string>('GetLinuxBuildMachineStatus', 'GET', ['api','status','build','android'].join('/'), 'application/json', null, null);
	}
	public getMacBuildMachineStatus(): IFuture<string>{
		return this.$serviceProxy.call<string>('GetMacBuildMachineStatus', 'GET', ['api','status','build','iOS'].join('/'), 'application/json', null, null);
	}
}
export class TamService implements Server.ITamServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public verifyStoreCreated(): IFuture<void>{
		return this.$serviceProxy.call<void>('VerifyStoreCreated', 'GET', ['api','tam','store'].join('/'), null, null, null);
	}
	public uploadApplication(solutionName: string, projectName: string, relativePackagePath: string): IFuture<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','tam','applications',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public getAccountStatus(): IFuture<Server.FeatureStatus>{
		return this.$serviceProxy.call<Server.FeatureStatus>('GetAccountStatus', 'GET', ['api','tam','account','status'].join('/'), 'application/json', null, null);
	}
}
export class TapService implements Server.ITapServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public getFeatures(accountId: string, serviceType: string): IFuture<string[]>{
		return this.$serviceProxy.call<string[]>('GetFeatures', 'GET', ['api','tap','features',encodeURI(accountId.replace(/\\/g, '/')),encodeURI(serviceType.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getExistingClientSolutions(): IFuture<Server.TapSolutionData[]>{
		return this.$serviceProxy.call<Server.TapSolutionData[]>('GetExistingClientSolutions', 'GET', ['api','tap','projects'].join('/'), 'application/json', null, null);
	}
	public getRemote(solutionName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','tap','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public setRemote(solutionName: string, remoteUrl: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','tap','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}
	public getUsersForProject(solutionName: string): IFuture<Server.Collaborator[]>{
		return this.$serviceProxy.call<Server.Collaborator[]>('GetUsersForProject', 'GET', ['api','tap','userProjects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public initCurrentUserSharedRepository(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('InitCurrentUserSharedRepository', 'POST', ['api','tap','userProjects',encodeURI(solutionName.replace(/\\/g, '/')),'initSharedRepository'].join('/'), null, null, null);
	}
	public getWorkspaces(accountId: string): IFuture<Server.TapWorkspaceData[]>{
		return this.$serviceProxy.call<Server.TapWorkspaceData[]>('GetWorkspaces', 'GET', ['api','tap','workspaces',encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getServiceApplications(serviceType: string, accountId: string): IFuture<Server.TapSolutionData[]>{
		return this.$serviceProxy.call<Server.TapSolutionData[]>('GetServiceApplications', 'GET', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getServiceApplicationProjectKey(serviceType: string, id: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetServiceApplicationProjectKey', 'GET', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(id.replace(/\\/g, '/')),'projectKey'].join('/'), 'application/json', null, null);
	}
	public createServiceApplication(serviceType: string, workspaceId: string, applicationName: string, description: string): IFuture<string>{
		return this.$serviceProxy.call<string>('CreateServiceApplication', 'POST', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(workspaceId.replace(/\\/g, '/')),encodeURI(applicationName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'description', value: JSON.stringify(description), contentType: 'application/json'}], null);
	}
}
export class VersioncontrolService implements Server.IVersioncontrolServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public init(solutionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Init', 'INIT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public rollback(solutionName: string, versionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Rollback', 'ROLLBACK', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, null, null);
	}
	public reset(solutionName: string, resetMode: Server.ResetMode, versionName: string): IFuture<void>{
		return this.$serviceProxy.call<void>('Reset', 'RESET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'resetMode': resetMode, 'versionName': versionName }), null, null, null);
	}
	public merge(solutionName: string, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('Merge', 'MERGE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public revert(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Revert', 'REVERT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public resolve(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Resolve', 'RESOLVE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public checkout(solutionName: string, versionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Checkout', 'CHECKOUT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public add(solutionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Add', 'ADD', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public remove(solutionName: string, filePaths: string[]): IFuture<void>{
		return this.$serviceProxy.call<void>('Remove', 'REMOVE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public getBranches(solutionName: string): IFuture<Server.BranchItemData[]>{
		return this.$serviceProxy.call<Server.BranchItemData[]>('GetBranches', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches'].join('/'), 'application/json', null, null);
	}
	public getCurrentBranch(solutionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('GetCurrentBranch', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branch'].join('/'), 'application/json', null, null);
	}
	public checkoutBranch(solutionName: string, branchName: string, createBranch: boolean, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CheckoutBranch', 'CHECKOUT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'createBranch': createBranch, 'versionName': versionName }), 'application/json', null, null);
	}
	public createBranch(solutionName: string, branchName: string, versionName: string): IFuture<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CreateBranch', 'POST', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public deleteBranch(solutionName: string, branchName: string, forceDelete: boolean): IFuture<void>{
		return this.$serviceProxy.call<void>('DeleteBranch', 'DELETE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'forceDelete': forceDelete }), null, null, null);
	}
	public getRemote(solutionName: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public setRemote(solutionName: string, remoteUrl: string): IFuture<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}
	public getInfo(solutionName: string): IFuture<Server.VersionControlData>{
		return this.$serviceProxy.call<Server.VersionControlData>('GetInfo', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'info'].join('/'), 'application/json', null, null);
	}
	public track(solutionName: string): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('Track', 'POST', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'status'].join('/'), 'application/json', null, null);
	}
	public getStatus(solutionName: string, filePaths: string[]): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetStatus', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'status','files'].join('/'), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public getDiff(solutionName: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): IFuture<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetDiff', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'diff','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize, 'otherVersionName': otherVersionName }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public getConflicts(solutionName: string, contextSize: number, filePaths: string[]): IFuture<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetConflicts', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'conflicts','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public getCommits(solutionName: string, endDate: Date, startDate: Date): IFuture<Server.ChangeSetData[]>{
		return this.$serviceProxy.call<Server.ChangeSetData[]>('GetCommits', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'commits'].join('/') + '?' + querystring.stringify({ 'endDate': endDate, 'startDate': startDate }), 'application/json', null, null);
	}
	public getCommit(solutionName: string, versionName: string): IFuture<Server.ChangeSetData>{
		return this.$serviceProxy.call<Server.ChangeSetData>('GetCommit', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public getChanges(solutionName: string, versionName: string): IFuture<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetChanges', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'changes'].join('/'), 'application/json', null, null);
	}
	public getContents(solutionName: string, versionName: string, filePath: string): IFuture<string>{
		return this.$serviceProxy.call<string>('GetContents', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'contents',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public getHistory(solutionName: string, versionName: string, filePath: string): IFuture<Server.HistoryItemData[]>{
		return this.$serviceProxy.call<Server.HistoryItemData[]>('GetHistory', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'history',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class ServiceContainer implements Server.IServer{
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
	public packages: Server.IPackagesServiceContract = $injector.resolve(PackagesService);
	public rawSettings: Server.IRawSettingsServiceContract = $injector.resolve(RawSettingsService);
	public settings: Server.ISettingsServiceContract = $injector.resolve(SettingsService);
	public status: Server.IStatusServiceContract = $injector.resolve(StatusService);
	public tam: Server.ITamServiceContract = $injector.resolve(TamService);
	public tap: Server.ITapServiceContract = $injector.resolve(TapService);
	public versioncontrol: Server.IVersioncontrolServiceContract = $injector.resolve(VersioncontrolService);
}
$injector.register('server', ServiceContainer);

