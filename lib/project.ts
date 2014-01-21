///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import xml2js = require("xml2js");
import path = require("path");
import unzip = require("unzip");
import _ = require("underscore");
import config = require("./config");
var options:any = require("./options");
import log = require("./logger");
import util = require("util");
import helpers = require("./helpers");
import server = require("./server");
import querystring = require("querystring");
import xopen = require("open");
import devicesService = require("./devices-service");
import Q = require("q");
import Future = require("fibers/future");
import IOSDeploymentValidator = require("./validators/ios-deployment-validator");
import projectNameValidator = require("./validators/project-name-validator");

var cachedProjectDir = "";

export var projectData: any;

//TODO: _bridge_ remove after refactoring
function getServer(): Server.IServer {
	return <Server.IServer> $injector.resolve("server");
}

function getFs():IFileSystem {
	return $injector.resolve("fs");
}

export function hasProject() {
	var projectDir = getProjectDir();
	return !!projectDir;
}

export function getProjectDir() {
	if (cachedProjectDir !== "") {
		return cachedProjectDir;
	}
	cachedProjectDir = null;

	var projectDir = options.path || path.resolve(".");
	while (true) {
		log.trace("Looking for project in '%s'", projectDir);

		if (fs.existsSync(path.join(projectDir, config.PROJECT_FILE_NAME))) {
			log.debug("Project directory is '%s'.", projectDir);
			cachedProjectDir = projectDir;
			break;
		}

		var dir = path.dirname(projectDir);
		if (dir === projectDir) {
			log.info("No project found at or above '%s'.", path.resolve("."));
			break;
		}
		projectDir = dir;
	}

	return cachedProjectDir;
}

export function getTempDir() {
	var dir = path.join(getProjectDir(), ".ice");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	return dir;
}

function getProjectRelativePath(fullPath) {
	var projectDir = getProjectDir() + path.sep;
	if (!fullPath.startsWith(projectDir)) {
		throw new Error("File is not part of the project.");
	}

	return fullPath.substring(projectDir.length);
}

export function enumerateProjectFiles(excludedProjectDirsAndFiles?) {
	if (!excludedProjectDirsAndFiles) {
		excludedProjectDirsAndFiles = [".ice"];
	}

	var projectDir = getProjectDir();
	var projectFiles = helpers.enumerateFilesInDirectorySync(projectDir, function(filePath) {
		return !excludedProjectDirsAndFiles.contains(path.basename(filePath).toLowerCase());
	});

	log.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
	return projectFiles;
}

function zipProject(): IFuture<string> {
	var tempDir = getTempDir();

	var projectZipFile = path.join(tempDir, "Build.zip");
	if (fs.existsSync(projectZipFile)) {
		fs.unlinkSync(projectZipFile);
	}

	var files = enumerateProjectFiles();
	var zipOp = helpers.zipFiles(projectZipFile, files,
		function(path) {
			return getProjectRelativePath(path);
		});

	var result = new Future<string>();
	zipOp.resolveSuccess(() => result.return(projectZipFile));
	return result;
}

function requestCloudBuild(platform, configuration): IFuture<Project.IBuildResult> {
	return ((): Project.IBuildResult => {
		if (helpers.isAndroidPlatform(platform)) {
			platform = "Android";
		} else if (helpers.isiOSPlatform(platform)) {
			platform = "iOS";
		} else {
			log.fatal("Unknown platform '%s'. Must be either 'Android' or 'iOS'", platform);
			return;
		}

		var buildProperties:any = {
			Configuration: configuration,
			Platform: platform,

			CorePlugins: projectData.CorePlugins,
			AppIdentifier: projectData.AppIdentifier,
			ProjectName: projectData.name,
			ProjectGuid: projectData.ProjectGuid,
			FrameworkVersion: projectData.FrameworkVersion,
			BundleVersion: projectData.BundleVersion,
			DeviceOrientations: projectData.DeviceOrientations,
		};

		if (platform === "Android") {
			buildProperties.AndroidPermissions = projectData.AndroidPermissions;
			buildProperties.AndroidVersionCode = projectData.AndroidVersionCode;
			buildProperties.AndroidHardwareAcceleration = projectData.AndroidHardwareAcceleration;
			buildProperties.AndroidCodesigningIdentity = ""; //TODO: where do you get this from?

			var result = beginBuild(buildProperties).wait();
			return result;
		} else if (platform === "iOS" ) {
			buildProperties.iOSDisplayName = projectData.iOSDisplayName;
			buildProperties.iOSDeviceFamily = projectData.iOSDeviceFamily;
			buildProperties.iOSStatusBarStyle = projectData.iOSStatusBarStyle;
			buildProperties.iOSBackgroundMode = projectData.iOSBackgroundMode;

			var identityMgr = <Server.IIdentityManager> $injector.resolve("identityManager");

			var certificateData = identityMgr.findCertificate(options.certificate).wait();

			log.info("Using certificate '%s'", certificateData.Alias);

			var provisionData = identityMgr.findProvision(options.provision).wait();

			log.info("Using mobile provision '%s'", provisionData.Name);

			buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
			buildProperties.iOSCodesigningIdentity = certificateData.Alias;

			var buildResult = beginBuild(buildProperties).wait();
			buildResult.provisionType = provisionData.ProvisionType;
			return buildResult;
		}
	}).future<Project.IBuildResult>()();
}

function beginBuild(buildProperties: any): IFuture<Project.IBuildResult> {
	return ((): Project.IBuildResult => {
		Object.keys(buildProperties).forEach(function(prop) {
			if (buildProperties[prop] === undefined) {
				throw new Error(util.format("Build property '%s' is undefined.", prop));
			}

			if (_.isArray(buildProperties[prop])) {
				buildProperties[prop] = buildProperties[prop].join(";");
			}
		});

		var result = server.buildProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, buildProperties).wait();

		if (result.output) {
			var buildLogFilePath = path.join(getTempDir(), "build.log");
			fs.writeFile(buildLogFilePath, result.output, function (err) {
				if (err) {
					throw err;
				}
				log.info("Build log written to '%s'", buildLogFilePath);
			});
		}

		log.debug(result.buildResults);

		return {
			buildProperties: buildProperties,
			packageDefs: result.buildResults,
		};
	}).future<Project.IBuildResult>()();
}

function showPackageQRCodes(packageDefs) {
	if (!packageDefs.length) {
		return;
	}

	var templateFiles = helpers.enumerateFilesInDirectorySync(path.join(__dirname, "../resources/qr"));
	for (var i = 0; i < templateFiles.length; i++) {
		var srcFile = templateFiles[i];
		var targetFile = path.join(getTempDir(), path.basename(srcFile));
		log.debug("Copying '%s' to '%s'", srcFile, targetFile);

		var writeStream = fs.createWriteStream(targetFile);
		fs.createReadStream(srcFile).pipe(writeStream);
		if (path.basename(srcFile) === "scan.html") {
			var htmlTemplate = targetFile;
			writeStream.on("finish", function() {
				var htmlTemplateContents = fs.readFileSync(htmlTemplate, {encoding: "utf8"});
				htmlTemplateContents = htmlTemplateContents.replace(/\$ApplicationName\$/g, projectData.name)
					.replace(/\$Packages\$/g, JSON.stringify(packageDefs));
				fs.writeFile(htmlTemplate, htmlTemplateContents, function(err) {
					if (err) {
						throw err;
					}
					log.debug("Updated scan.html");
					xopen(htmlTemplate);
				});
			});
		}
	}
}

function build(platform, configuration, showQrCodes, downloadFiles): IFuture<Server.IPackageDef[]> {
	return ((): Server.IPackageDef[] => {
		configuration = configuration || "Debug";
		log.info("Building project for platform '%s', configuration '%s'", platform, configuration);

		importProject().wait();

		var buildResult = requestCloudBuild(platform, configuration).wait();
		var packageDefs = buildResult.packageDefs;

		if (showQrCodes && packageDefs.length) {
			var urlKind = buildResult.provisionType === "AdHoc" ? "manifest" : "package";
			packageDefs.forEach(function(def:any) {
				var liveSyncUrl = server.getLiveSyncUrl(urlKind, <string> def.relativePath, <string> buildResult.buildProperties.LiveSyncToken).wait();
				def.qrUrl = helpers.createQrUrl(liveSyncUrl);

				log.debug("QR URL is '%s'", def.qrUrl);
			});

			showPackageQRCodes(packageDefs);
		}

		if (downloadFiles) {
			packageDefs.forEach((pkg: Server.IPackageDef) => {
				var targetFileName = path.join(getTempDir(), path.basename(pkg.solutionPath));
				server.downloadFile(pkg.solution, pkg.solutionPath, targetFileName).wait();
				log.info("Download completed: %s", targetFileName);
				pkg.localFile = targetFileName;
			});
		}

		return packageDefs;
	}).future<Server.IPackageDef[]>()();
}

export function buildCommand(platform, configuration) {
	build(platform, configuration, true, options.download);
}

export function deployToIon() {
	log.info("Deploying to Ion");

	importProject().wait();

	var liveSyncToken = getServer().cordova.getLiveSyncToken(projectData.name, projectData.name).wait();

	var hostPart = util.format("%s://%s", config.ICE_SERVER_PROTO, config.ICE_SERVER);
	var fullDownloadPath = util.format("icenium://%s?LiveSyncToken=%s", querystring.escape(hostPart), querystring.escape(liveSyncToken));

	log.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

	showPackageQRCodes([{
		platform: "Ion",
		qrUrl: helpers.createQrUrl(fullDownloadPath),
	}]);
}

export function deployToDevice(platform, configuration) {
	devicesService.hasDevices(platform)
		.then(function(hasDevices) {
			if (hasDevices) {
				var packageDefs = build(platform, configuration, false, true).wait();
				var packageFile = packageDefs[0].localFile;

				log.debug("Ready to deploy %s", packageDefs);
				log.debug("File is %d bytes", fs.statSync(packageFile).size);

				if(helpers.isiOSPlatform(platform)) {
					var identityMgr = $injector.resolve("identityManager");
					identityMgr.findProvision(options.provision, function(error, identData){
						var provisionedDevices = identData.ProvisionedDevices.$values;
						processDeployToDevice(platform, packageFile, provisionedDevices);
					});
				}
				else {
					processDeployToDevice(platform, packageFile);
				}
			} else {
				log.error(util.format("The app cannot be deployed because there are 0 connected %s devices", platform || ""));
			}
		})
		.done();
}

function processDeployToDevice(platform, packageFile, provisionedDevices?){
	var packageName = getProjectData().AppIdentifier;
	devicesService.deploy(platform, packageFile, packageName, provisionedDevices)
		.then(function () {
			console.log(util.format("%s has been successfully installed on all connected %s devices", packageFile, platform));
		})
		.catch(function (error) {
			log.trace(error);
		})
		.done();
}

export function importProject(): IFuture<void> {
	return (() => {
		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to import.");
			return;
		}

		var projectZipFile = zipProject().wait();
		log.debug("zipping completed, result file size: %d", fs.statSync(projectZipFile).size);

		getServer().projects.importProject(projectData.name, projectData.name, fs.createReadStream(projectZipFile)).wait();
		log.trace("Project imported");
	}).future<void>()();
}

export function saveProject(callback?) {
	fs.writeFile(path.join(getProjectDir(), config.PROJECT_FILE_NAME), JSON.stringify(projectData, null, "\t"), function(err) {
		if (callback) {
			callback(err);
		} else if (err) {
			throw err;
		}
	});
}

function getProjectData() {
	projectData = JSON.parse(<string> fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME), {encoding: "utf8"}));
	return projectData;
}

export function createNewProject(projectName) {
	var projectDir = getNewProjectDir();

	if (projectName === undefined) {
		createProjectName(projectDir)
			.then(function(name) {
				return createFromTemplate(name, projectDir);
			})
			.done();
	} else {
		createFromTemplate(projectName, projectDir);
	}
}

function createProjectName(projectDir) {
	return Q.ninvoke(fs, "readdir", projectDir)
		.then(function(files:string[]) {
			var defaultProjectName = config.DEFAULT_PROJECT_NAME;
			var count = _.filter(files, function(file) {
				return file.startsWith(defaultProjectName);
			}).length;

			if (count === 0) {
				return defaultProjectName;
			} else {
				return util.format("%s_%s", defaultProjectName, count);
			}
		});
}

function createFromTemplate(appname, projectDir) {
	var templatesDir = path.join(__dirname, "../resources/templates"),
		template = options.template || config.DEFAULT_PROJECT_TEMPLATE,
		templateFileName;

	if (appname === undefined) {
		log.fatal("At least appname must be specified!");
		return;
	}
	projectDir = path.join(projectDir, appname);

	projectNameValidator.validateNameAndLogErrorMessage(appname);
	templateFileName = path.join(templatesDir, "Telerik.Mobile.Cordova." + template + ".zip");
	if (getFs().exists(templateFileName).wait()) {
		try {
			createTemplateFolder(templateFileName, projectDir).wait();
			var properties = getProjectProperties(projectDir, appname).wait();
			createProjectFile(projectDir, properties).wait();
			removeExtraFiles(projectDir).wait();
			console.log(util.format("%s has been successfully created.", appname));
		}
		catch(error) {
			log.fatal(error.message);
		}
	} else {
		log.fatal("The requested template " + options.template + " does not exist.");
		log.fatal("Available templates are:");
		config.TEMPLATE_NAMES.forEach(function(item) {
			log.fatal(item);
		});
	}
}

function removeExtraFiles(projectDir): IFuture<any> {
	return ((): any => {
		var $fs = getFs();
		var future1 = $fs.deleteFile(path.join(projectDir, "mobile.proj"));
		var future2 = $fs.deleteFile(path.join(projectDir, "mobile.vstemplate"));
		Future.wait([future1, future2]);
	}).future<any>()();
}

function getProjectProperties(projectDir, appName): IFuture<any> {
	return ((): any => {
		var properties: any = {};

		if (options.appid === undefined) {
			options.appid = generateDefaultAppId(appName);
			log.warn("--appid was not specified. Defaulting to " + options.appid);
		}

		var parser = new xml2js.Parser();
		var contents = getFs().readText(path.join(projectDir, "mobile.proj")).wait();

		var parseString = Future.wrap(function (str, callback) {
			return parser.parseString(str, callback);
		})

		var result: any = parseString(contents).wait();
		var propertyGroup: any = result.Project.PropertyGroup[0];

		properties.AppName = appName;
		properties.AppIdentifier = options.appid;
		properties.ProjectGuid = generateProjectGuid();
		properties.BundleVersion = propertyGroup.BundleVersion[0];
		properties.CorePlugins = propertyGroup.CorePlugins[0].split(";");
		properties.DeviceOrientations = propertyGroup.DeviceOrientations[0].split(";");
		properties.FrameworkVersion = propertyGroup.FrameworkVersion[0];
		properties.iOSStatusBarStyle = propertyGroup.iOSStatusBarStyle[0];
		properties.AndroidPermissions = propertyGroup.AndroidPermissions[0].split(";");

		return properties;
	}).future<any>()();
}

function getNewProjectDir() {
	return options.path || process.cwd();
}

export function createProjectFile(projectDir, properties): IFuture<any> {
	return ((): any => {
		properties = properties || {};

		cachedProjectDir = projectDir;
		projectData = JSON.parse(<string> fs.readFileSync(path.join(__dirname, "../resources/default-project.json"), { encoding: "utf8" }));
		projectData.name = properties.AppName;
		projectData.iOSDisplayName = properties.AppName;
		projectData.AppIdentifier = properties.AppIdentifier;
		projectData.ProjectGuid = properties.ProjectGuid;
		projectData.BundleVersion = properties.BundleVersion;
		projectData.CorePlugins = properties.CorePlugins;
		projectData.DeviceOrientations = properties.DeviceOrientations;
		projectData.FrameworkVersion = properties.FrameworkVersion;
		projectData.iOSStatusBarStyle = properties.iOSStatusBarStyle;
		projectData.AndroidPermissions = properties.AndroidPermissions;
		saveProject();
	}).future<any>()();
}

export function createTemplateFolder(templateFileName, projectDir): IFuture<any> {
	var $fs = getFs();
	$fs.createDirectory(projectDir).wait();
	var projectDirFiles = $fs.readDirectory(projectDir).wait();
	if (projectDirFiles.length != 0) {
		throw new Error("The specified directory must be empty to create a new project.");
	}

	return extractTemplate(templateFileName, projectDir);
}

function extractTemplate(templateFileName, projectDir: string): IFuture<any> {
	var $fs = getFs();
	return $fs.futureFromEvent(
		$fs.createReadStream(templateFileName)
			.pipe(unzip.Extract({ path: projectDir })), "close");
}

function generateDefaultAppId(appName) {
	return "com.telerik." + appName;
}

function generateProjectGuid() {
	/* jshint -W016 */
//	var genUUIDv4 = function b(a) { return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b); };
//	return genUUIDv4();
	return require("node-uuid").v4();
	/* jshint +W016 */
}

export function isProjectFileExcluded(projectDir, filePath, excludedDirsAndFiles) {
	var relativeToProjectPath = filePath.substr(projectDir.length + 1);
	var lowerCasePath = relativeToProjectPath.toLowerCase();
	for (var key in excludedDirsAndFiles) {
		if (lowerCasePath.startsWith(excludedDirsAndFiles[key])) {
			return true;
		}
	}
	return false;
}

function normalizePropertyName(property) {
	if (!property) {
		return property;
	}

	var propSchema = helpers.getProjectFileSchema();
	var propLookup = helpers.toHash(propSchema,
		function(value, key) { return key.toLowerCase(); },
		function(value, key) { return key; });
	return propLookup[property.toLowerCase()] || property;
}

export function updateProjectProperty(projectData:any, mode:string, property:string, newValue:any) {
	property = normalizePropertyName(property);
	var propSchema = helpers.getProjectFileSchema();
	var propData = propSchema[property];

	if (!propData) {
		log.fatal("Unrecognized property '%s'", property);
		printProjectSchemaHelp();
		return;
	}

	if (!propData.flags) {
		if (newValue.length !== 1) {
			helpers.abort("Property '%s' is not a collection of flags. Specify only a single property value.", property);
		}
		if (mode === "add" || mode === "del") {
			helpers.abort("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
		}
	} else {
		newValue = _.flatten(_.map(newValue, function(value:string) { return value.split(";"); }));
	}

	var range = propData.range;
	if (range) {
		newValue = _.map(newValue, function(value:string) { return value.toLowerCase(); });

		var validValues;
		if (_.isArray(range)) {
			validValues = helpers.toHash(range,
				function(value) { return value.toLowerCase(); },
				_.identity);

		} else {
			validValues = helpers.toHash(range,
				function(value, key) { return (value.input || key).toLowerCase(); },
				function(value, key) { return key; });
		}

		var badValues = _.reject(newValue, function(value) {
			return validValues[value];
		});
		if (badValues.length > 0) {
			helpers.abort("Invalid property value%s: %s", badValues.length > 1 ? "s" : "", badValues.join("; "));
		}

		newValue = _.map(newValue, function(value) { return validValues[value]; });
	}

	if (!propData.flags) {
		newValue = newValue[0];

		if (propData.regex) {
			var matchRegex = new RegExp(propData.regex);
			if (!matchRegex.test(newValue)) {
				helpers.abort("Value '%s' is not in the format expected by property %s. Expected to match /%s/", newValue, property, propData.regex);
			}
		}
	}

	var propertyValue = projectData[property];
	if (propData.flags && _.isString(propertyValue)) {
		propertyValue = propertyValue.split(";");
	}

	if (mode === "set") {
		propertyValue = newValue;
	} else if (mode === "del") {
		propertyValue = _.difference(propertyValue, newValue);
	} else if (mode === "add") {
		propertyValue = _.union(propertyValue, newValue);
	} else {
		helpers.abort("Unknown property update mode '%s'", mode);
	}

	if (propertyValue.sort) {
		propertyValue.sort();
	}

	projectData[property] = propertyValue;
}

function updateProjectPropertyAndSave(mode, args) {
	ensureProject();

	updateProjectProperty(projectData, mode, args[0], _.rest(args, 1));
	saveProject();
}

export function setProjectProperty() {
	var args = _.toArray(arguments),
		property = args[0];

	if(property === "name") {
		projectNameValidator.validateNameAndLogErrorMessage(property);
	}

	updateProjectPropertyAndSave("set", _.toArray(arguments));
}

export function addProjectProperty() {
	updateProjectPropertyAndSave("add", _.toArray(arguments));
}

export function delProjectProperty() {
	updateProjectPropertyAndSave("del", _.toArray(arguments));
}

export function printProjectProperty(property) {
	ensureProject();
	property = normalizePropertyName(property);

	if (projectData[property]) {
		console.log(projectData[property]);
	} else {
		log.fatal("Unrecognized property '%s'", property);
		printProjectSchemaHelp();
	}
}

function printProjectSchemaHelp() {
	var schema = helpers.getProjectFileSchema();
	log.info("Project properties:");
	_.each(schema, function(value:any, key) {
		log.info(util.format("  %s - %s", key, value.description));
		if (value.range) {
			log.info("    Valid values:");
			_.each(value.range, function(rangeDesc:any, rangeKey) {
				var desc = "      " + (_.isArray(value.range) ? rangeDesc : rangeDesc.input || rangeKey);
				if (rangeDesc.description) {
					desc += " - " + rangeDesc.description;
				}
				log.info(desc);
			});
		}
		if (value.regex) {
			log.info("    Valid values match /" + value.regex.toString() + "/");
		}
	});
}

export function ensureProject() {
	if (!projectData) {
		helpers.abort("Not in a project folder.");
	}
}

if (getProjectDir()) {
	try {
		projectData = JSON.parse(fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME), {encoding: "utf8"}));
	} catch(err) {
		log.fatal("There was a problem reading the project file. " + err);
		process.exit(1);
	}
}

exports.project = projectData;
