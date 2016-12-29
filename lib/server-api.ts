// automatically generated code; do not edit manually!
//
"use strict";

import querystring = require('querystring');

export class AuthenticationService implements Server.IAuthenticationServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async login(simpleWebToken: string): Promise<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('Login', 'POST', ['api','authentication'].join('/'), 'application/json', [{name: 'simpleWebToken', value: JSON.stringify(simpleWebToken), contentType: 'application/json'}], null);
	}
	public async logout(): Promise<void>{
		return this.$serviceProxy.call<void>('Logout', 'LOGOUT', ['api','authentication'].join('/'), null, null, null);
	}
	public async getLoggedInUser(): Promise<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('GetLoggedInUser', 'GET', ['api','authentication','currentUser'].join('/'), 'application/json', null, null);
	}
	public async getTenants(): Promise<Server.Tenant[]>{
		return this.$serviceProxy.call<Server.Tenant[]>('GetTenants', 'GET', ['api','authentication','tenants'].join('/'), 'application/json', null, null);
	}
	public async setActiveTenant(tenantId: string): Promise<Server.IUser>{
		return this.$serviceProxy.call<Server.IUser>('SetActiveTenant', 'PATCH', ['api','authentication','tenants',encodeURI(tenantId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async agreeToEula(): Promise<void>{
		return this.$serviceProxy.call<void>('AgreeToEula', 'POST', ['api','authentication','eula'].join('/'), null, null, null);
	}
}
export class AppsCordovaService implements Server.IAppsCordovaServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getLiveSyncToken(appId: string, projectName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncToken', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'liveSyncToken'].join('/'), 'application/json', null, null);
	}
	public async getCurrentPlatforms(appId: string, projectName: string): Promise<Server.DevicePlatform[]>{
		return this.$serviceProxy.call<Server.DevicePlatform[]>('GetCurrentPlatforms', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'platforms'].join('/'), 'application/json', null, null);
	}
	public async addPlatform(appId: string, projectName: string, platform: Server.DevicePlatform): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('AddPlatform', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'platforms',encodeURI((<any>platform).replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async migrate(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public async getProjectCordovaPlugins(appId: string, projectName: string): Promise<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetProjectCordovaPlugins', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'plugins'].join('/'), 'application/json', null, null);
	}
	public async getCordovaPluginVariables(appId: string, projectName: string): Promise<Server.CordovaPluginVariablesData>{
		return this.$serviceProxy.call<Server.CordovaPluginVariablesData>('GetCordovaPluginVariables', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'plugins','variables'].join('/'), 'application/json', null, null);
	}
	public async setCordovaPluginVariable(appId: string, projectName: string, pluginId: string, variableName: string, configuration: string, value: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetCordovaPluginVariable', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cordova',encodeURI(projectName.replace(/\\/g, '/')),'plugins','variables',encodeURI(pluginId.replace(/\\/g, '/')),encodeURI(variableName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'value', value: JSON.stringify(value), contentType: 'application/json'}], null);
	}
}
export class CordovaService implements Server.ICordovaServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getLiveSyncToken(solutionName: string, projectName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncToken', 'GET', ['api','cordova','liveSyncToken',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getLiveSyncUrl(longUrl: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetLiveSyncUrl', 'GET', ['api','cordova','liveSyncUrl'].join('/') + '?' + querystring.stringify({ 'longUrl': longUrl }), 'application/json', null, null);
	}
	public async getPlugins(version: string): Promise<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetPlugins', 'GET', ['api','cordova',encodeURI(version.replace(/\\/g, '/')),'plugins'].join('/'), 'application/json', null, null);
	}
	public async getJs(version: string, platform: Server.DevicePlatform, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetJs', 'GET', ['api','cordova',encodeURI(version.replace(/\\/g, '/')),encodeURI((<any>platform).replace(/\\/g, '/')),'js'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async getMigrationData(): Promise<Server.CordovaMigrationData>{
		return this.$serviceProxy.call<Server.CordovaMigrationData>('GetMigrationData', 'GET', ['api','cordova','migration-data'].join('/'), 'application/json', null, null);
	}
	public async getPluginsPackage($resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetPluginsPackage', 'GET', ['api','cordova','plugins','package'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async getCordovaVersions(): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('GetCordovaVersions', 'GET', ['api','cordova','versions'].join('/'), 'application/json', null, null);
	}
	public async getCordovaFrameworkVersions(): Promise<Server.FrameworkVersion[]>{
		return this.$serviceProxy.call<Server.FrameworkVersion[]>('GetCordovaFrameworkVersions', 'GET', ['api','cordova','frameworkVersions'].join('/'), 'application/json', null, null);
	}
	public async getMarketplacePluginData(pluginId: string, version: string): Promise<Server.CordovaPluginData>{
		return this.$serviceProxy.call<Server.CordovaPluginData>('GetMarketplacePluginData', 'GET', ['api','cordova','marketplace',encodeURI(pluginId.replace(/\\/g, '/')),encodeURI(version.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getMarketplacePluginsData(framework: string): Promise<Server.MarketplacePluginVersionsData[]>{
		return this.$serviceProxy.call<Server.MarketplacePluginVersionsData[]>('GetMarketplacePluginsData', 'GET', ['api','cordova','marketplace-directory',encodeURI(framework.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getMarketplacePluginVersionsData(): Promise<Server.CordovaMarketplacePluginVersionsData[]>{
		return this.$serviceProxy.call<Server.CordovaMarketplacePluginVersionsData[]>('GetMarketplacePluginVersionsData', 'GET', ['api','cordova','marketplace-plugins'].join('/'), 'application/json', null, null);
	}
	public async getCurrentPlatforms(solutionName: string, projectName: string): Promise<Server.DevicePlatform[]>{
		return this.$serviceProxy.call<Server.DevicePlatform[]>('GetCurrentPlatforms', 'GET', ['api','cordova','platforms',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async addPlatform(platform: Server.DevicePlatform, solutionName: string, projectName: string): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('AddPlatform', 'POST', ['api','cordova','platforms',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI((<any>platform).replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async migrate(solutionName: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','cordova','migrate',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public async getProjectCordovaPlugins(solutionName: string, projectName: string): Promise<Server.CordovaPluginData[]>{
		return this.$serviceProxy.call<Server.CordovaPluginData[]>('GetProjectCordovaPlugins', 'GET', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getCordovaPluginVariables(solutionName: string, projectName: string): Promise<Server.CordovaPluginVariablesData>{
		return this.$serviceProxy.call<Server.CordovaPluginVariablesData>('GetCordovaPluginVariables', 'GET', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'variables'].join('/'), 'application/json', null, null);
	}
	public async setCordovaPluginVariable(solutionName: string, projectName: string, pluginId: string, variableName: string, configuration: string, value: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetCordovaPluginVariable', 'POST', ['api','cordova','plugins',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'variables',encodeURI(pluginId.replace(/\\/g, '/')),encodeURI(variableName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'value', value: JSON.stringify(value), contentType: 'application/json'}], null);
	}
}
export class IdentityStoreService implements Server.IIdentityStoreServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getIdentities(): Promise<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('GetIdentities', 'GET', ['api','identityStore','identities'].join('/'), 'application/json', null, null);
	}
	public async generateSelfSignedIdentity(generationData: Server.IdentityGenerationData): Promise<Server.CryptographicIdentityData>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData>('GenerateSelfSignedIdentity', 'GENERATE', ['api','identityStore','identities'].join('/'), 'application/json', [{name: 'generationData', value: JSON.stringify(generationData), contentType: 'application/json'}], null);
	}
	public async importIdentity(importType: Server.ImportType, password: string, stream: any): Promise<Server.CryptographicIdentityData[]>{
		return this.$serviceProxy.call<Server.CryptographicIdentityData[]>('ImportIdentity', 'POST', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'importType': importType, 'password': password }), 'application/json', [{name: 'stream', value: stream, contentType: 'application/octet-stream'}], null);
	}
	public async removeIdentity(identityAlias: string): Promise<void>{
		return this.$serviceProxy.call<void>('RemoveIdentity', 'DELETE', ['api','identityStore','identities'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias }), null, null, null);
	}
	public async getIdentity(identityAlias: string, password: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetIdentity', 'GET', ['api','identityStore','identities','export'].join('/') + '?' + querystring.stringify({ 'identityAlias': identityAlias, 'password': password }), 'application/octet-stream', null, $resultStream);
	}
	public async getCertificateRequests(): Promise<Server.CertificateRequestData[]>{
		return this.$serviceProxy.call<Server.CertificateRequestData[]>('GetCertificateRequests', 'GET', ['api','identityStore','certificationRequests'].join('/'), 'application/json', null, null);
	}
	public async generateCertificationRequest(subjectNameValues: IDictionary<string>): Promise<Server.CertificateRequestData>{
		return this.$serviceProxy.call<Server.CertificateRequestData>('GenerateCertificationRequest', 'POST', ['api','identityStore','certificationRequests'].join('/'), 'application/json', [{name: 'subjectNameValues', value: JSON.stringify(subjectNameValues), contentType: 'application/json'}], null);
	}
	public async removeCertificateRequest(uniqueName: string): Promise<void>{
		return this.$serviceProxy.call<void>('RemoveCertificateRequest', 'DELETE', ['api','identityStore','certificationRequests'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), null, null, null);
	}
	public async getCertificateRequest(uniqueName: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetCertificateRequest', 'GET', ['api','identityStore','certificationRequests','export'].join('/') + '?' + querystring.stringify({ 'uniqueName': uniqueName }), 'application/octet-stream', null, $resultStream);
	}
}
export class EverliveService implements Server.IEverliveServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getAuthorizationHeader(): Promise<string>{
		return this.$serviceProxy.call<string>('GetAuthorizationHeader', 'GET', ['api','everlive','authorizationHeader'].join('/'), 'application/json', null, null);
	}
	public async getEverliveApplications(accountId: string): Promise<Server.EverliveApplicationData[]>{
		return this.$serviceProxy.call<Server.EverliveApplicationData[]>('GetEverliveApplications', 'GET', ['api','everlive','applications',encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class ExtensionsService implements Server.IExtensionsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getExtensions(frameworkVersion: string): Promise<any>{
		return this.$serviceProxy.call<any>('GetExtensions', 'GET', ['api','extensions',encodeURI(frameworkVersion.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getFile(path: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['api','extensions','files',encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
}
export class UploadService implements Server.IUploadServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async completeUpload(path: string, originalFileHash: string): Promise<void>{
		return this.$serviceProxy.call<void>('CompleteUpload', 'POST', ['api','upload','complete',encodeURI(path.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'originalFileHash': originalFileHash }), null, null, null);
	}
	public async initUpload(path: string): Promise<void>{
		return this.$serviceProxy.call<void>('InitUpload', 'POST', ['api','upload',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async uploadChunk(path: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('UploadChunk', 'PUT', ['api','upload',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
}
export class AppsFilesService implements Server.IAppsFilesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getFile(appId: string, path: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'files',encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async save(appId: string, path: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('Save', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'files',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public async createDirectory(appId: string, path: string): Promise<void>{
		return this.$serviceProxy.call<void>('CreateDirectory', 'MKDIR', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'files',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async remove(appId: string, path: string): Promise<void>{
		return this.$serviceProxy.call<void>('Remove', 'DELETE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'files',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
}
export class FilesystemService implements Server.IFilesystemServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getContent(solutionName: string, path: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetContent', 'GET', ['api','filesystem','raw',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async getFile(solutionSpaceName: string, solutionName: string, path: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetFile', 'GET', ['api','filesystem','file',encodeURI(solutionSpaceName.replace(/\\/g, '/')),encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async save(solutionName: string, path: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('Save', 'POST', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public async createDirectory(solutionName: string, path: string): Promise<void>{
		return this.$serviceProxy.call<void>('CreateDirectory', 'MKDIR', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async remove(solutionName: string, path: string): Promise<void>{
		return this.$serviceProxy.call<void>('Remove', 'DELETE', ['api','filesystem',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
}
export class AppsImagesService implements Server.IAppsImagesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async resizeImage(appId: string, path: string, size: Server.Size): Promise<void>{
		return this.$serviceProxy.call<void>('ResizeImage', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'images','resize',encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'size', value: JSON.stringify(size), contentType: 'application/json'}], null);
	}
	public async generate(appId: string, projectName: string, type: Server.ImageType, image: any): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('Generate', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'images','generate',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'type': type }), 'application/json', [{name: 'image', value: image, contentType: 'application/octet-stream'}], null);
	}
}
export class ImagesService implements Server.IImagesServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async resizeImage(solutionName: string, path: string, size: Server.Size): Promise<void>{
		return this.$serviceProxy.call<void>('ResizeImage', 'POST', ['api','images','resize',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(path.replace(/\\/g, '/'))].join('/'), null, [{name: 'size', value: JSON.stringify(size), contentType: 'application/json'}], null);
	}
	public async generate(solutionName: string, projectName: string, type: Server.ImageType, image: any): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('Generate', 'POST', ['api','images','generate',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'type': type }), 'application/json', [{name: 'image', value: image, contentType: 'application/octet-stream'}], null);
	}
	public async generateArchive(type: Server.ImageType, image: any, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GenerateArchive', 'POST', ['api','images','generate'].join('/') + '?' + querystring.stringify({ 'type': type }), 'application/octet-stream', [{name: 'image', value: image, contentType: 'application/octet-stream'}], $resultStream);
	}
}
export class AppsItmstransporterService implements Server.IAppsItmstransporterServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async uploadApplicationFromUri(appId: string, projectName: string, adamId: number, packageUri: string, username: string, password: string): Promise<void>{
		return this.$serviceProxy.call<void>('UploadApplicationFromUri', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'itmstransporter','upload',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'packageUri': packageUri, 'username': username }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
	public async uploadApplication(appId: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): Promise<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'itmstransporter','upload',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'username': username }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
}
export class ItmstransporterService implements Server.IItmstransporterServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getApplicationsReadyForUpload(username: string, password: string): Promise<Server.Application[]>{
		return this.$serviceProxy.call<Server.Application[]>('GetApplicationsReadyForUpload', 'POST', ['api','itmstransporter','applications'].join('/') + '?' + querystring.stringify({ 'username': username }), 'application/json', [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
	public async uploadApplicationFromUri(solutionName: string, projectName: string, adamId: number, packageUri: string, username: string, password: string): Promise<void>{
		return this.$serviceProxy.call<void>('UploadApplicationFromUri', 'POST', ['api','itmstransporter','upload',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'packageUri': packageUri, 'username': username }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
	public async uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, adamId: number, username: string, password: string): Promise<void>{
		return this.$serviceProxy.call<void>('UploadApplication', 'POST', ['api','itmstransporter','upload',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'adamId': adamId, 'username': username }), null, [{name: 'password', value: JSON.stringify(password), contentType: 'application/json'}], null);
	}
}
export class KendoService implements Server.IKendoServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getPackages(): Promise<Server.KendoDownloadablePackageData[]>{
		return this.$serviceProxy.call<Server.KendoDownloadablePackageData[]>('GetPackages', 'GET', ['api','kendo','packages'].join('/'), 'application/json', null, null);
	}
	public async changeKendoPackage(solutionName: string, projectName: string, packageId: string): Promise<void>{
		return this.$serviceProxy.call<void>('ChangeKendoPackage', 'PATCH', ['api','kendo',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'packageId': packageId }), null, null, null);
	}
	public async getCurrentPackage(solutionName: string, projectName: string): Promise<Server.KendoPackageData>{
		return this.$serviceProxy.call<Server.KendoPackageData>('GetCurrentPackage', 'GET', ['api','kendo',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'version'].join('/'), 'application/json', null, null);
	}
}
export class AppsKendoService implements Server.IAppsKendoServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async changeKendoPackage(appId: string, projectName: string, packageId: string): Promise<void>{
		return this.$serviceProxy.call<void>('ChangeKendoPackage', 'PATCH', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'kendo',encodeURI(projectName.replace(/\\/g, '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'packageId': packageId }), null, null, null);
	}
	public async getCurrentPackage(appId: string, projectName: string): Promise<Server.KendoPackageData>{
		return this.$serviceProxy.call<Server.KendoPackageData>('GetCurrentPackage', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'kendo',encodeURI(projectName.replace(/\\/g, '/')),'version'].join('/'), 'application/json', null, null);
	}
}
export class MobileprovisionsService implements Server.IMobileprovisionsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getProvisions(): Promise<Server.ProvisionData[]>{
		return this.$serviceProxy.call<Server.ProvisionData[]>('GetProvisions', 'GET', ['api','mobileprovisions'].join('/'), 'application/json', null, null);
	}
	public async importProvision(provision: any): Promise<Server.ProvisionData>{
		return this.$serviceProxy.call<Server.ProvisionData>('ImportProvision', 'POST', ['api','mobileprovisions'].join('/'), 'application/json', [{name: 'provision', value: provision, contentType: 'application/octet-stream'}], null);
	}
	public async getProvision(identifier: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetProvision', 'GET', ['api','mobileprovisions',encodeURI(identifier.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async removeProvision(identifier: string): Promise<void>{
		return this.$serviceProxy.call<void>('RemoveProvision', 'DELETE', ['api','mobileprovisions',encodeURI(identifier.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
}
export class NativescriptService implements Server.INativescriptServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async migrate(solutionName: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','nativescript','migrate',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public async getMarketplacePluginVersionsData(): Promise<Server.NativeScriptMarketplacePluginVersionsData[]>{
		return this.$serviceProxy.call<Server.NativeScriptMarketplacePluginVersionsData[]>('GetMarketplacePluginVersionsData', 'GET', ['api','nativescript','marketplace-plugins'].join('/'), 'application/json', null, null);
	}
}
export class AppsNativescriptService implements Server.IAppsNativescriptServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async migrate(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>{
		return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'nativescript','migrate',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
	public async migrate1(appId: string, projectName: string, targetVersion: string): Promise<Server.MigrationResult>{
			return this.$serviceProxy.call<Server.MigrationResult>('Migrate', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'nativescript',encodeURI(projectName.replace(/\\/g, '/')),'migrate'].join('/') + '?' + querystring.stringify({ 'targetVersion': targetVersion }), 'application/json', null, null);
	}
}
export class AppsProjectsService implements Server.IAppsProjectsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async exportProject(appId: string, projectName: string, skipMetadata: boolean, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('ExportProject', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','export',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'skipMetadata': skipMetadata }), 'application/octet-stream', null, $resultStream);
	}
	public async importPackage(appId: string, projectName: string, parentIdentifier: string, archivePackage: any): Promise<void>{
		return this.$serviceProxy.call<void>('ImportPackage', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','import',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(parentIdentifier.replace(/\\/g, '/'))].join('/'), null, [{name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}], null);
	}
	public async importProject(appId: string, projectName: string, cleanImport: boolean, package_: any): Promise<void>{
		return this.$serviceProxy.call<void>('ImportProject', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','importProject',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'cleanImport': cleanImport }), null, [{name: 'package_', value: package_, contentType: 'application/octet-stream'}], null);
	}
	public async importLocalProject(appId: string, projectName: string, bucketKey: string, cleanImport: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('ImportLocalProject', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','importProject',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(bucketKey.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'cleanImport': cleanImport }), null, null, null);
	}
	public async getProjectContents(appId: string, projectName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetProjectContents', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','contents',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async saveProjectContents(appId: string, projectName: string, projectContents: string): Promise<void>{
		return this.$serviceProxy.call<void>('SaveProjectContents', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','contents',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'projectContents', value: JSON.stringify(projectContents), contentType: 'application/json'}], null);
	}
	public async getProjectConfiguraitons(appId: string, projectName: string): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('GetProjectConfiguraitons', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','configurations',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getNodeModules(appId: string, projectName: string, operationId: string): Promise<Server.NodeModulesInfo>{
		return this.$serviceProxy.call<Server.NodeModulesInfo>('GetNodeModules', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects',encodeURI(projectName.replace(/\\/g, '/')),'node_modules',encodeURI(operationId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async createProject(appId: string, projectName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>{
		return this.$serviceProxy.call<void>('CreateProject', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
	public async deleteProject(appId: string, projectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteProject', 'DELETE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async setProjectProperty(appId: string, projectName: string, configuration: string, changeset: IDictionary<string>): Promise<void>{
		return this.$serviceProxy.call<void>('SetProjectProperty', 'PATCH', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'changeset', value: JSON.stringify(changeset), contentType: 'application/json'}], null);
	}
	public async renameProject(appId: string, projectName: string, newProjectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('RenameProject', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects','rename',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(newProjectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async createNewProjectItem(appId: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): Promise<Server.ProjectItemInfo[]>{
		return this.$serviceProxy.call<Server.ProjectItemInfo[]>('CreateNewProjectItem', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'projects',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(itemIdentifier.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
}
export class ProjectsService implements Server.IProjectsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getProjectTemplates(): Promise<Server.ProjectTemplateData[]>{
		return this.$serviceProxy.call<Server.ProjectTemplateData[]>('GetProjectTemplates', 'GET', ['api','projects','projectTemplates'].join('/'), 'application/json', null, null);
	}
	public async getItemTemplates(): Promise<Server.ItemTemplateData[]>{
		return this.$serviceProxy.call<Server.ItemTemplateData[]>('GetItemTemplates', 'GET', ['api','projects','itemTemplates'].join('/'), 'application/json', null, null);
	}
	public async exportSolution(solutionSpaceName: string, solutionName: string, skipMetadata: boolean, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('ExportSolution', 'GET', ['api','projects','export',encodeURI(solutionSpaceName.replace(/\\/g, '/')),encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'skipMetadata': skipMetadata }), 'application/octet-stream', null, $resultStream);
	}
	public async exportProject(solutionSpaceName: string, solutionName: string, projectName: string, skipMetadata: boolean, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('ExportProject', 'GET', ['api','projects','export',encodeURI(solutionSpaceName.replace(/\\/g, '/')),encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'skipMetadata': skipMetadata }), 'application/octet-stream', null, $resultStream);
	}
	public async importPackage(solutionName: string, projectName: string, parentIdentifier: string, archivePackage: any): Promise<void>{
		return this.$serviceProxy.call<void>('ImportPackage', 'POST', ['api','projects','import',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(parentIdentifier.replace(/\\/g, '/'))].join('/'), null, [{name: 'archivePackage', value: archivePackage, contentType: 'application/octet-stream'}], null);
	}
	public async importProject(solutionName: string, projectName: string, cleanImport: boolean, package_: any): Promise<void>{
		return this.$serviceProxy.call<void>('ImportProject', 'POST', ['api','projects','importProject',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'cleanImport': cleanImport }), null, [{name: 'package_', value: package_, contentType: 'application/octet-stream'}], null);
	}
	public async importLocalProject(solutionName: string, projectName: string, bucketKey: string, cleanImport: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('ImportLocalProject', 'POST', ['api','projects','importProject',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(bucketKey.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'cleanImport': cleanImport }), null, null, null);
	}
	public async getProjectContents(solutionName: string, projectName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetProjectContents', 'GET', ['api','projects','contents',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async saveProjectContents(solutionName: string, projectName: string, projectContents: string): Promise<void>{
		return this.$serviceProxy.call<void>('SaveProjectContents', 'PUT', ['api','projects','contents',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'projectContents', value: JSON.stringify(projectContents), contentType: 'application/json'}], null);
	}
	public async getProjectConfiguraitons(solutionName: string, projectName: string): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('GetProjectConfiguraitons', 'GET', ['api','projects','configurations',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async upgradeSolution(solutionName: string, mandatoryOnly: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('UpgradeSolution', 'UPGRADE', ['api','projects','upgrade',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'mandatoryOnly': mandatoryOnly }), null, null, null);
	}
	public async getSolution(solutionName: string): Promise<Server.SolutionData>{
		return this.$serviceProxy.call<Server.SolutionData>('GetSolution', 'GET', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async canLoadSolution(solutionName: string): Promise<boolean>{
		return this.$serviceProxy.call<boolean>('CanLoadSolution', 'EXISTS', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async deleteSolution(solutionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteSolution', 'DELETE', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async createSolution(solutionName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>{
		return this.$serviceProxy.call<void>('CreateSolution', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
	public async getSolutionType(solutionName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetSolutionType', 'GET', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),'type'].join('/'), 'application/json', null, null);
	}
	public async renameSolution(solutionName: string, newSolutionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('RenameSolution', 'PUT', ['api','projects','rename',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(newSolutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async createProject(solutionName: string, projectName: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>{
		return this.$serviceProxy.call<void>('CreateProject', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
	public async deleteProject(solutionName: string, projectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteProject', 'DELETE', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async setProjectProperty(solutionName: string, projectName: string, configuration: string, changeset: IDictionary<string>): Promise<void>{
		return this.$serviceProxy.call<void>('SetProjectProperty', 'PATCH', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'configuration': configuration }), null, [{name: 'changeset', value: JSON.stringify(changeset), contentType: 'application/json'}], null);
	}
	public async renameProject(solutionName: string, projectName: string, newProjectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('RenameProject', 'PUT', ['api','projects','rename',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(newProjectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async createNewProjectItem(solutionName: string, projectName: string, itemIdentifier: string, expansionData: Server.ItemTemplateExpansionData): Promise<Server.ProjectItemInfo[]>{
		return this.$serviceProxy.call<Server.ProjectItemInfo[]>('CreateNewProjectItem', 'POST', ['api','projects',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(itemIdentifier.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
}
export class AppsService implements Server.IAppsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async exportApplication(appId: string, skipMetadata: boolean, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('ExportApplication', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'export'].join('/') + '?' + querystring.stringify({ 'skipMetadata': skipMetadata }), 'application/octet-stream', null, $resultStream);
	}
	public async createApplication(applicationData: Server.ApplicationCreationData): Promise<IDictionary<Object>>{
		return this.$serviceProxy.call<IDictionary<Object>>('CreateApplication', 'POST', ['api','apps'].join('/'), 'application/json', [{name: 'applicationData', value: JSON.stringify(applicationData), contentType: 'application/json'}], null);
	}
	public async enableApplication(appId: string, expansionData: Server.ProjectTemplateExpansionData): Promise<void>{
		return this.$serviceProxy.call<void>('EnableApplication', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/'))].join('/'), null, [{name: 'expansionData', value: JSON.stringify(expansionData), contentType: 'application/json'}], null);
	}
	public async getApplication(appId: string): Promise<Server.SolutionData>{
		return this.$serviceProxy.call<Server.SolutionData>('GetApplication', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async canLoadApplication(appId: string): Promise<boolean>{
		return this.$serviceProxy.call<boolean>('CanLoadApplication', 'EXISTS', ['api','apps',encodeURI(appId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async deleteApplication(appId: string): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteApplication', 'DELETE', ['api','apps',encodeURI(appId.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async upgradeApplication(appId: string, mandatoryOnly: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('UpgradeApplication', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'upgrade'].join('/') + '?' + querystring.stringify({ 'mandatoryOnly': mandatoryOnly }), null, null, null);
	}
	public async getApplicationServices(appId: string, serviceNames: string[]): Promise<Server.ApplicationServiceData[]>{
		return this.$serviceProxy.call<Server.ApplicationServiceData[]>('GetApplicationServices', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'services'].join('/') + '?' + querystring.stringify({ 'serviceNames': serviceNames }), 'application/json', null, null);
	}
	public async enableApplicationService(appId: string, serviceData: IDictionary<Object>): Promise<IDictionary<Object>>{
		return this.$serviceProxy.call<IDictionary<Object>>('EnableApplicationService', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'services'].join('/'), 'application/json', [{name: 'serviceData', value: JSON.stringify(serviceData), contentType: 'application/json'}], null);
	}
	public async getApplicationType(appId: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetApplicationType', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'type'].join('/'), 'application/json', null, null);
	}
	public async deleteApplicationCache(appId: string): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteApplicationCache', 'DELETE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'cache'].join('/'), null, null, null);
	}
}
export class BowerService implements Server.IBowerServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async installDependencies(solutionName: string, projectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('InstallDependencies', 'POST', ['api','bower','dependencies',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async installPackage(solutionName: string, projectName: string, packageName: string, version: string): Promise<void>{
		return this.$serviceProxy.call<void>('InstallPackage', 'PUT', ['api','bower',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(packageName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'version': version }), null, null, null);
	}
	public async getInstalledPackages(solutionName: string, projectName: string): Promise<Server.PackageData[]>{
		return this.$serviceProxy.call<Server.PackageData[]>('GetInstalledPackages', 'GET', ['api','bower',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getFilters(): Promise<Server.BowerPackagesFilters>{
		return this.$serviceProxy.call<Server.BowerPackagesFilters>('GetFilters', 'GET', ['api','bower','filters'].join('/'), 'application/json', null, null);
	}
}
export class AppsBowerService implements Server.IAppsBowerServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async installDependencies(appId: string, projectName: string): Promise<void>{
		return this.$serviceProxy.call<void>('InstallDependencies', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'bower','dependencies',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async installPackage(appId: string, projectName: string, packageName: string, version: string): Promise<void>{
		return this.$serviceProxy.call<void>('InstallPackage', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'bower',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(packageName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'version': version }), null, null, null);
	}
	public async getInstalledPackages(appId: string, projectName: string): Promise<Server.PackageData[]>{
		return this.$serviceProxy.call<Server.PackageData[]>('GetInstalledPackages', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'bower',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class BuildService implements Server.IBuildServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async buildProject(solutionName: string, projectName: string, buildRequest: Server.BuildRequestData): Promise<Server.BuildResultData>{
		return this.$serviceProxy.call<Server.BuildResultData>('BuildProject', 'POST', ['api','build',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json'}], null);
	}
}
export class AppsBuildService implements Server.IAppsBuildServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async buildProject(appId: string, projectName: string, buildRequest: Server.BuildRequestData): Promise<Server.BuildResultData>{
		return this.$serviceProxy.call<Server.BuildResultData>('BuildProject', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'build',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'buildRequest', value: JSON.stringify(buildRequest), contentType: 'application/json'}], null);
	}
}
export class NpmService implements Server.INpmServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async queryNpmSearch(packageName: string, size: number, sortOrder: Server.SortOrder, start: number): Promise<Server.NpmSearchResult>{
		return this.$serviceProxy.call<Server.NpmSearchResult>('QueryNpmSearch', 'GET', ['api','npm','search'].join('/') + '?' + querystring.stringify({ 'packageName': packageName, 'size': size, 'sortOrder': sortOrder, 'start': start }), 'application/json', null, null);
	}
	public async getNpmPackageInfo(packageName: string): Promise<Server.NpmPackage>{
		return this.$serviceProxy.call<Server.NpmPackage>('GetNpmPackageInfo', 'GET', ['api','npm','info',encodeURI(packageName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getNpmPackageDownloads(packageName: string): Promise<number>{
		return this.$serviceProxy.call<number>('GetNpmPackageDownloads', 'GET', ['api','npm','downloads',encodeURI(packageName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class PublishService implements Server.IPublishServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async publishFtp(solutionName: string, projectName: string, ftpConnectionData: Server.FtpConnectionData): Promise<void>{
		return this.$serviceProxy.call<void>('PublishFtp', 'POST', ['api','publish','ftp',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'ftpConnectionData', value: JSON.stringify(ftpConnectionData), contentType: 'application/json'}], null);
	}
}
export class AppsPublishService implements Server.IAppsPublishServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async publishFtp(appId: string, projectName: string, ftpConnectionData: Server.FtpConnectionData): Promise<void>{
		return this.$serviceProxy.call<void>('PublishFtp', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'publish','ftp',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'ftpConnectionData', value: JSON.stringify(ftpConnectionData), contentType: 'application/json'}], null);
	}
}
export class RawSettingsService implements Server.IRawSettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getUserSettings(file: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetUserSettings', 'GET', ['api','rawSettings','currentUser',encodeURI(file.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async saveUserSettings(file: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('SaveUserSettings', 'POST', ['api','rawSettings','currentUser',encodeURI(file.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
	public async getSolutionUserSettings(solutionName: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetSolutionUserSettings', 'GET', ['api','rawSettings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async saveSolutionUserSettings(solutionName: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('SaveSolutionUserSettings', 'POST', ['api','rawSettings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
}
export class AppsRawSettingsService implements Server.IAppsRawSettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getSolutionUserSettings(appId: string, $resultStream: any): Promise<void>{
		return this.$serviceProxy.call<void>('GetSolutionUserSettings', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'rawSettings','solution'].join('/'), 'application/octet-stream', null, $resultStream);
	}
	public async saveSolutionUserSettings(appId: string, content: any): Promise<void>{
		return this.$serviceProxy.call<void>('SaveSolutionUserSettings', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'rawSettings','solution'].join('/'), null, [{name: 'content', value: content, contentType: 'application/octet-stream'}], null);
	}
}
export class SettingsService implements Server.ISettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getSettings(solutionName: string): Promise<Server.SettingsData>{
		return this.$serviceProxy.call<Server.SettingsData>('GetSettings', 'GET', ['api','settings','solution',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async setCodesignIdentity(solutionName: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetCodesignIdentity', 'PUT', ['api','settings','codesignIdentity',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), null, [{name: 'identityAlias', value: JSON.stringify(identityAlias), contentType: 'application/json'}], null);
	}
	public async setMobileProvision(solutionName: string, projectIdentity: string, provisionIdentifier: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetMobileProvision', 'PUT', ['api','settings','mobileProvision',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'provisionIdentifier', value: JSON.stringify(provisionIdentifier), contentType: 'application/json'}], null);
	}
	public async setActiveBuildConfiguration(buildConfiguration: string, solutionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetActiveBuildConfiguration', 'PUT', ['api','settings','buildConfiguration',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(buildConfiguration.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async updateSettingsProjectIdentifier(solutionName: string, projectIdentity: string, newProjectIdentity: string): Promise<void>{
		return this.$serviceProxy.call<void>('UpdateSettingsProjectIdentifier', 'PATCH', ['api','settings','updateProjectIdentifier',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'newProjectIdentity', value: JSON.stringify(newProjectIdentity), contentType: 'application/json'}], null);
	}
}
export class AppsSettingsService implements Server.IAppsSettingsServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getSettings(appId: string): Promise<Server.SettingsData>{
		return this.$serviceProxy.call<Server.SettingsData>('GetSettings', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'settings','solution'].join('/'), 'application/json', null, null);
	}
	public async setCodesignIdentity(appId: string, projectIdentity: string, platform: Server.DevicePlatform, identityAlias: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetCodesignIdentity', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'settings','codesignIdentity',encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'platform': platform }), null, [{name: 'identityAlias', value: JSON.stringify(identityAlias), contentType: 'application/json'}], null);
	}
	public async setMobileProvision(appId: string, projectIdentity: string, provisionIdentifier: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetMobileProvision', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'settings','mobileProvision',encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'provisionIdentifier', value: JSON.stringify(provisionIdentifier), contentType: 'application/json'}], null);
	}
	public async setActiveBuildConfiguration(appId: string, buildConfiguration: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetActiveBuildConfiguration', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'settings','buildConfiguration',encodeURI(buildConfiguration.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async updateSettingsProjectIdentifier(appId: string, projectIdentity: string, newProjectIdentity: string): Promise<void>{
		return this.$serviceProxy.call<void>('UpdateSettingsProjectIdentifier', 'PATCH', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'settings','updateProjectIdentifier',encodeURI(projectIdentity.replace(/\\/g, '/'))].join('/'), null, [{name: 'newProjectIdentity', value: JSON.stringify(newProjectIdentity), contentType: 'application/json'}], null);
	}
}
export class AppsTamService implements Server.IAppsTamServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async uploadApplicationFromUri(appId: string, projectName: string, packageUri: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>{
		return this.$serviceProxy.call<Server.UploadedAppData>('UploadApplicationFromUri', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tam','applications',encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'packageUri': packageUri }), 'application/json', [{name: 'settings', value: JSON.stringify(settings), contentType: 'application/json'}], null);
	}
	public async uploadPatch(appId: string, projectName: string, patchData: Server.PatchData): Promise<void>{
		return this.$serviceProxy.call<void>('UploadPatch', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tam','patches',encodeURI(projectName.replace(/\\/g, '/'))].join('/'), null, [{name: 'patchData', value: JSON.stringify(patchData), contentType: 'application/json'}], null);
	}
	public async uploadApplication(appId: string, projectName: string, relativePackagePath: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>{
		return this.$serviceProxy.call<Server.UploadedAppData>('UploadApplication', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tam','applications',encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'settings', value: JSON.stringify(settings), contentType: 'application/json'}], null);
	}
}
export class TamService implements Server.ITamServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async verifyStoreCreated(): Promise<void>{
		return this.$serviceProxy.call<void>('VerifyStoreCreated', 'GET', ['api','tam','store'].join('/'), null, null, null);
	}
	public async getGroups(): Promise<Server.TamGroupData[]>{
		return this.$serviceProxy.call<Server.TamGroupData[]>('GetGroups', 'GET', ['api','tam','groups'].join('/'), 'application/json', null, null);
	}
	public async uploadApplicationFromUri(solutionName: string, projectName: string, packageUri: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>{
		return this.$serviceProxy.call<Server.UploadedAppData>('UploadApplicationFromUri', 'POST', ['api','tam','applications',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'packageUri': packageUri }), 'application/json', [{name: 'settings', value: JSON.stringify(settings), contentType: 'application/json'}], null);
	}
	public async uploadPatch(solutionName: string, projectName: string, patchData: Server.PatchData): Promise<void>{
		return this.$serviceProxy.call<void>('UploadPatch', 'POST', ['api','tam',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),'patches'].join('/'), null, [{name: 'patchData', value: JSON.stringify(patchData), contentType: 'application/json'}], null);
	}
	public async getAccountStatus(): Promise<Server.FeatureStatus>{
		return this.$serviceProxy.call<Server.FeatureStatus>('GetAccountStatus', 'GET', ['api','tam','account','status'].join('/'), 'application/json', null, null);
	}
	public async uploadApplication(solutionName: string, projectName: string, relativePackagePath: string, settings: Server.PublishSettings): Promise<Server.UploadedAppData>{
		return this.$serviceProxy.call<Server.UploadedAppData>('UploadApplication', 'POST', ['api','tam','applications',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(projectName.replace(/\\/g, '/')),encodeURI(relativePackagePath.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'settings', value: JSON.stringify(settings), contentType: 'application/json'}], null);
	}
}
export class AppsTapService implements Server.IAppsTapServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getRemote(appId: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tap','versioncontrol','remote'].join('/'), 'application/json', null, null);
	}
	public async setRemote(appId: string, remoteUrl: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tap','versioncontrol','remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}
	public async initCurrentUserSharedRepository(appId: string): Promise<boolean>{
		return this.$serviceProxy.call<boolean>('InitCurrentUserSharedRepository', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'tap','userProjects','initSharedRepository'].join('/'), 'application/json', null, null);
	}
}
export class TapService implements Server.ITapServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async getFeatures(accountId: string, serviceType: string): Promise<string[]>{
		return this.$serviceProxy.call<string[]>('GetFeatures', 'GET', ['api','tap','features',encodeURI(accountId.replace(/\\/g, '/')),encodeURI(serviceType.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getExistingClientSolutions(): Promise<Server.TapSolutionData[]>{
		return this.$serviceProxy.call<Server.TapSolutionData[]>('GetExistingClientSolutions', 'GET', ['api','tap','projects'].join('/'), 'application/json', null, null);
	}
	public async getRemote(solutionName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','tap','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public async setRemote(solutionName: string, remoteUrl: string): Promise<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'PUT', ['api','tap','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), null, [{name: 'remoteUrl', value: JSON.stringify(remoteUrl), contentType: 'application/json'}], null);
	}
	public async getUsersForProject(solutionName: string): Promise<Server.Collaborator[]>{
		return this.$serviceProxy.call<Server.Collaborator[]>('GetUsersForProject', 'GET', ['api','tap','userProjects',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async initCurrentUserSharedRepository(solutionName: string): Promise<boolean>{
		return this.$serviceProxy.call<boolean>('InitCurrentUserSharedRepository', 'POST', ['api','tap','userProjects',encodeURI(solutionName.replace(/\\/g, '/')),'initSharedRepository'].join('/'), 'application/json', null, null);
	}
	public async migrate(solutionName: string, appId: string): Promise<void>{
		return this.$serviceProxy.call<void>('Migrate', 'POST', ['api','tap','migrate',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(appId.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async getWorkspaces(accountId: string): Promise<Server.TapWorkspaceData[]>{
		return this.$serviceProxy.call<Server.TapWorkspaceData[]>('GetWorkspaces', 'GET', ['api','tap','workspaces',encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getServiceApplications(serviceType: string, accountId: string): Promise<Server.TapSolutionData[]>{
		return this.$serviceProxy.call<Server.TapSolutionData[]>('GetServiceApplications', 'GET', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(accountId.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getServiceApplicationProjectKey(serviceType: string, id: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetServiceApplicationProjectKey', 'GET', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(id.replace(/\\/g, '/')),'projectKey'].join('/'), 'application/json', null, null);
	}
	public async createServiceApplication(serviceType: string, workspaceId: string, applicationName: string, description: string): Promise<string>{
		return this.$serviceProxy.call<string>('CreateServiceApplication', 'POST', ['api','tap','services',encodeURI(serviceType.replace(/\\/g, '/')),encodeURI(workspaceId.replace(/\\/g, '/')),encodeURI(applicationName.replace(/\\/g, '/'))].join('/'), 'application/json', [{name: 'description', value: JSON.stringify(description), contentType: 'application/json'}], null);
	}
	public async getNotificationSummary(accountId: string): Promise<Server.TapNotificationSummaryData>{
		return this.$serviceProxy.call<Server.TapNotificationSummaryData>('GetNotificationSummary', 'GET', ['api','tap','notifications',encodeURI(accountId.replace(/\\/g, '/')),'info'].join('/'), 'application/json', null, null);
	}
	public async getUnreadNotifications(accountId: string): Promise<Server.TapNotificationData[]>{
		return this.$serviceProxy.call<Server.TapNotificationData[]>('GetUnreadNotifications', 'GET', ['api','tap','notifications',encodeURI(accountId.replace(/\\/g, '/')),'unread'].join('/'), 'application/json', null, null);
	}
	public async getReadNotifications(accountId: string, fromDate: Date): Promise<Server.TapNotificationData[]>{
		return this.$serviceProxy.call<Server.TapNotificationData[]>('GetReadNotifications', 'GET', ['api','tap','notifications',encodeURI(accountId.replace(/\\/g, '/')),'read'].join('/') + '?' + querystring.stringify({ 'fromDate': fromDate }), 'application/json', null, null);
	}
}
export class VersioncontrolService implements Server.IVersioncontrolServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async init(solutionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('Init', 'INIT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/'), null, null, null);
	}
	public async rollback(solutionName: string, versionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('Rollback', 'ROLLBACK', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, null, null);
	}
	public async reset(solutionName: string, resetMode: Server.ResetMode, versionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('Reset', 'RESET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'resetMode': resetMode, 'versionName': versionName }), null, null, null);
	}
	public async merge(solutionName: string, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('Merge', 'MERGE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async revert(solutionName: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Revert', 'REVERT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async resolve(solutionName: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Resolve', 'RESOLVE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async checkout(solutionName: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Checkout', 'CHECKOUT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async add(solutionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Add', 'ADD', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async remove(solutionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Remove', 'REMOVE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getBranches(solutionName: string): Promise<Server.BranchItemData[]>{
		return this.$serviceProxy.call<Server.BranchItemData[]>('GetBranches', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches'].join('/'), 'application/json', null, null);
	}
	public async getCurrentBranch(solutionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('GetCurrentBranch', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branch'].join('/'), 'application/json', null, null);
	}
	public async checkoutBranch(solutionName: string, branchName: string, createBranch: boolean, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CheckoutBranch', 'CHECKOUT', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'createBranch': createBranch, 'versionName': versionName }), 'application/json', null, null);
	}
	public async createBranch(solutionName: string, branchName: string, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CreateBranch', 'POST', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async deleteBranch(solutionName: string, branchName: string, forceDelete: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteBranch', 'DELETE', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'forceDelete': forceDelete }), null, null, null);
	}
	public async getRemote(solutionName: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), 'application/json', null, null);
	}
	public async setRemote(solutionName: string, remoteData: Server.GitRemoteData): Promise<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'POST', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'remote'].join('/'), null, [{name: 'remoteData', value: JSON.stringify(remoteData), contentType: 'application/json'}], null);
	}
	public async getInfo(solutionName: string): Promise<Server.VersionControlData>{
		return this.$serviceProxy.call<Server.VersionControlData>('GetInfo', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'info'].join('/'), 'application/json', null, null);
	}
	public async track(solutionName: string): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('Track', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'status'].join('/'), 'application/json', null, null);
	}
	public async getStatus(solutionName: string, filePaths: string[]): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetStatus', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'status','files'].join('/'), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getDiff(solutionName: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): Promise<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetDiff', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'diff','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize, 'otherVersionName': otherVersionName }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getConflicts(solutionName: string, contextSize: number, filePaths: string[]): Promise<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetConflicts', 'XGET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'conflicts','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getCommits(solutionName: string, endDate: Date, startDate: Date): Promise<Server.ChangeSetData[]>{
		return this.$serviceProxy.call<Server.ChangeSetData[]>('GetCommits', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'commits'].join('/') + '?' + querystring.stringify({ 'endDate': endDate, 'startDate': startDate }), 'application/json', null, null);
	}
	public async getCommit(solutionName: string, versionName: string): Promise<Server.ChangeSetData>{
		return this.$serviceProxy.call<Server.ChangeSetData>('GetCommit', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),'commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async getChanges(solutionName: string, versionName: string): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetChanges', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'changes'].join('/'), 'application/json', null, null);
	}
	public async getContents(solutionName: string, versionName: string, filePath: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetContents', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'contents',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getHistory(solutionName: string, versionName: string, filePath: string): Promise<Server.HistoryItemData[]>{
		return this.$serviceProxy.call<Server.HistoryItemData[]>('GetHistory', 'GET', ['api','versioncontrol',encodeURI(solutionName.replace(/\\/g, '/')),encodeURI(versionName.replace(/\\/g, '/')),'history',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class AppsVersioncontrolService implements Server.IAppsVersioncontrolServiceContract{
	constructor(private $serviceProxy: Server.IServiceProxy){
	}
	public async init(appId: string): Promise<void>{
		return this.$serviceProxy.call<void>('Init', 'INIT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol'].join('/'), null, null, null);
	}
	public async rollback(appId: string, versionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('Rollback', 'ROLLBACK', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, null, null);
	}
	public async reset(appId: string, resetMode: Server.ResetMode, versionName: string): Promise<void>{
		return this.$serviceProxy.call<void>('Reset', 'RESET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol'].join('/') + '?' + querystring.stringify({ 'resetMode': resetMode, 'versionName': versionName }), null, null, null);
	}
	public async merge(appId: string, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('Merge', 'MERGE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async revert(appId: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Revert', 'REVERT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async resolve(appId: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Resolve', 'RESOLVE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async checkout(appId: string, versionName: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Checkout', 'CHECKOUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','files'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async add(appId: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Add', 'ADD', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async remove(appId: string, filePaths: string[]): Promise<void>{
		return this.$serviceProxy.call<void>('Remove', 'REMOVE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','files'].join('/'), null, [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getBranches(appId: string): Promise<Server.BranchItemData[]>{
		return this.$serviceProxy.call<Server.BranchItemData[]>('GetBranches', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','branches'].join('/'), 'application/json', null, null);
	}
	public async getCurrentBranch(appId: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('GetCurrentBranch', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','branch'].join('/'), 'application/json', null, null);
	}
	public async checkoutBranch(appId: string, branchName: string, createBranch: boolean, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CheckoutBranch', 'CHECKOUT', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'createBranch': createBranch, 'versionName': versionName }), 'application/json', null, null);
	}
	public async createBranch(appId: string, branchName: string, versionName: string): Promise<Server.BranchItemData>{
		return this.$serviceProxy.call<Server.BranchItemData>('CreateBranch', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async deleteBranch(appId: string, branchName: string, forceDelete: boolean): Promise<void>{
		return this.$serviceProxy.call<void>('DeleteBranch', 'DELETE', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','branches',encodeURI(branchName.replace(/\\/g, '/'))].join('/') + '?' + querystring.stringify({ 'forceDelete': forceDelete }), null, null, null);
	}
	public async getRemote(appId: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetRemote', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','remote'].join('/'), 'application/json', null, null);
	}
	public async setRemote(appId: string, remoteData: Server.GitRemoteData): Promise<void>{
		return this.$serviceProxy.call<void>('SetRemote', 'POST', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','remote'].join('/'), null, [{name: 'remoteData', value: JSON.stringify(remoteData), contentType: 'application/json'}], null);
	}
	public async getInfo(appId: string): Promise<Server.VersionControlData>{
		return this.$serviceProxy.call<Server.VersionControlData>('GetInfo', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','info'].join('/'), 'application/json', null, null);
	}
	public async track(appId: string): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('Track', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','status'].join('/'), 'application/json', null, null);
	}
	public async getStatus(appId: string, filePaths: string[]): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetStatus', 'XGET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','status','files'].join('/'), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getDiff(appId: string, versionName: string, contextSize: number, otherVersionName: string, filePaths: string[]): Promise<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetDiff', 'XGET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol',encodeURI(versionName.replace(/\\/g, '/')),'diff','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize, 'otherVersionName': otherVersionName }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getConflicts(appId: string, contextSize: number, filePaths: string[]): Promise<Server.DiffLineResultData[]>{
		return this.$serviceProxy.call<Server.DiffLineResultData[]>('GetConflicts', 'XGET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','conflicts','files'].join('/') + '?' + querystring.stringify({ 'contextSize': contextSize }), 'application/json', [{name: 'filePaths', value: JSON.stringify(filePaths), contentType: 'application/json'}], null);
	}
	public async getCommits(appId: string, endDate: Date, startDate: Date): Promise<Server.ChangeSetData[]>{
		return this.$serviceProxy.call<Server.ChangeSetData[]>('GetCommits', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','commits'].join('/') + '?' + querystring.stringify({ 'endDate': endDate, 'startDate': startDate }), 'application/json', null, null);
	}
	public async getCommit(appId: string, versionName: string): Promise<Server.ChangeSetData>{
		return this.$serviceProxy.call<Server.ChangeSetData>('GetCommit', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol','commit'].join('/') + '?' + querystring.stringify({ 'versionName': versionName }), 'application/json', null, null);
	}
	public async getChanges(appId: string, versionName: string): Promise<Server.ChangeItemData[]>{
		return this.$serviceProxy.call<Server.ChangeItemData[]>('GetChanges', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol',encodeURI(versionName.replace(/\\/g, '/')),'changes'].join('/'), 'application/json', null, null);
	}
	public async getContents(appId: string, versionName: string, filePath: string): Promise<string>{
		return this.$serviceProxy.call<string>('GetContents', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol',encodeURI(versionName.replace(/\\/g, '/')),'contents',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
	public async getHistory(appId: string, versionName: string, filePath: string): Promise<Server.HistoryItemData[]>{
		return this.$serviceProxy.call<Server.HistoryItemData[]>('GetHistory', 'GET', ['api','apps',encodeURI(appId.replace(/\\/g, '/')),'versioncontrol',encodeURI(versionName.replace(/\\/g, '/')),'history',encodeURI(filePath.replace(/\\/g, '/'))].join('/'), 'application/json', null, null);
	}
}
export class ServiceContainer implements Server.IServer{
	constructor(private $injector: IInjector){ }
	public authentication: Server.IAuthenticationServiceContract = this.$injector.resolve(AuthenticationService);
	public appsCordova: Server.IAppsCordovaServiceContract = this.$injector.resolve(AppsCordovaService);
	public cordova: Server.ICordovaServiceContract = this.$injector.resolve(CordovaService);
	public identityStore: Server.IIdentityStoreServiceContract = this.$injector.resolve(IdentityStoreService);
	public everlive: Server.IEverliveServiceContract = this.$injector.resolve(EverliveService);
	public extensions: Server.IExtensionsServiceContract = this.$injector.resolve(ExtensionsService);
	public upload: Server.IUploadServiceContract = this.$injector.resolve(UploadService);
	public appsFiles: Server.IAppsFilesServiceContract = this.$injector.resolve(AppsFilesService);
	public filesystem: Server.IFilesystemServiceContract = this.$injector.resolve(FilesystemService);
	public appsImages: Server.IAppsImagesServiceContract = this.$injector.resolve(AppsImagesService);
	public images: Server.IImagesServiceContract = this.$injector.resolve(ImagesService);
	public appsItmstransporter: Server.IAppsItmstransporterServiceContract = this.$injector.resolve(AppsItmstransporterService);
	public itmstransporter: Server.IItmstransporterServiceContract = this.$injector.resolve(ItmstransporterService);
	public kendo: Server.IKendoServiceContract = this.$injector.resolve(KendoService);
	public appsKendo: Server.IAppsKendoServiceContract = this.$injector.resolve(AppsKendoService);
	public mobileprovisions: Server.IMobileprovisionsServiceContract = this.$injector.resolve(MobileprovisionsService);
	public nativescript: Server.INativescriptServiceContract = this.$injector.resolve(NativescriptService);
	public appsNativescript: Server.IAppsNativescriptServiceContract = this.$injector.resolve(AppsNativescriptService);
	public appsProjects: Server.IAppsProjectsServiceContract = this.$injector.resolve(AppsProjectsService);
	public projects: Server.IProjectsServiceContract = this.$injector.resolve(ProjectsService);
	public apps: Server.IAppsServiceContract = this.$injector.resolve(AppsService);
	public bower: Server.IBowerServiceContract = this.$injector.resolve(BowerService);
	public appsBower: Server.IAppsBowerServiceContract = this.$injector.resolve(AppsBowerService);
	public build: Server.IBuildServiceContract = this.$injector.resolve(BuildService);
	public appsBuild: Server.IAppsBuildServiceContract = this.$injector.resolve(AppsBuildService);
	public npm: Server.INpmServiceContract = this.$injector.resolve(NpmService);
	public publish: Server.IPublishServiceContract = this.$injector.resolve(PublishService);
	public appsPublish: Server.IAppsPublishServiceContract = this.$injector.resolve(AppsPublishService);
	public rawSettings: Server.IRawSettingsServiceContract = this.$injector.resolve(RawSettingsService);
	public appsRawSettings: Server.IAppsRawSettingsServiceContract = this.$injector.resolve(AppsRawSettingsService);
	public settings: Server.ISettingsServiceContract = this.$injector.resolve(SettingsService);
	public appsSettings: Server.IAppsSettingsServiceContract = this.$injector.resolve(AppsSettingsService);
	public appsTam: Server.IAppsTamServiceContract = this.$injector.resolve(AppsTamService);
	public tam: Server.ITamServiceContract = this.$injector.resolve(TamService);
	public appsTap: Server.IAppsTapServiceContract = this.$injector.resolve(AppsTapService);
	public tap: Server.ITapServiceContract = this.$injector.resolve(TapService);
	public versioncontrol: Server.IVersioncontrolServiceContract = this.$injector.resolve(VersioncontrolService);
	public appsVersioncontrol: Server.IAppsVersioncontrolServiceContract = this.$injector.resolve(AppsVersioncontrolService);
}
$injector.register('server', ServiceContainer);
