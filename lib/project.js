(function() {
	"use strict";
	var fs = require("fs"),
		path = require("path"),
		unzip = require('unzip'),
		config = require("./config"),
		options = require("./options"),
		log = require("./log"),
		util = require("util"),
		helpers = require("./helpers"),
		server = require("./server"),
		identity = require("./identity"),
		querystring = require("querystring"),
		xopen = require("open"),
		projectFileName = ".iceproject",
		cachedProjectDir = "",
		projectData;

	function getProjectDir() {
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
				log.fatal("No project found at or above '%s'.", path.resolve('.'));
				break;
			}
			projectDir = dir;
		}

		return cachedProjectDir;
	}

	function getTempDir() {
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

	function enumerateProjectFiles() {
		var projectDir = getProjectDir();
		var projectFiles = helpers.enumerateFilesInDirectorySync(projectDir, function(filePath, stat) {
			if (path.basename(filePath) == ".ice") {
				return false;
			}

			return true;
		});

		log.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));
		return projectFiles;
	}

	function zipProject(callback) {
		helpers.ensureCallback(callback, 0);

		var tempDir = getTempDir();

		var projectZipFile = path.join(tempDir, "Build.zip");
		if (fs.existsSync(projectZipFile)) {
			fs.unlinkSync(projectZipFile);
		}

		var files = enumerateProjectFiles();
		helpers.zipFiles(projectZipFile, files,
			function(path) {
				return getProjectRelativePath(path);
			},
			function(err) {
				callback(err, {output: projectZipFile});
			});
	}

	function requestCloudBuild(platform, configuration) {
		if (platform.toLowerCase() === "android") {
			platform = "Android";
		} else if (platform.toLowerCase() === "ios") {
			platform = "iOS";
		} else {
			log.fatal("Unknown platform '%s'. Must be either 'Android' or 'iOS'", platform);
			return;
		}

		var buildProperties = {
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

			beginBuild(buildProperties);
		} else if (platform === "iOS" ){
			buildProperties.iOSDisplayName = projectData.iOSDisplayName;
			buildProperties.iOSDeviceFamily = projectData.iOSDeviceFamily;
			buildProperties.iOSStatusBarStyle = projectData.iOSStatusBarStyle;
			buildProperties.iOSBackgroundMode = projectData.iOSBackgroundMode;

			identity.findCertificate(options.certificate, function(err, certificateData) {
				if (err) {
					throw err;
				}

				log.info("Using certificate '%s'", certificateData.Alias);

				identity.findProvision(options.provision, function(err, provisionData) {
					if (err) {
						throw err;
					}

					log.info("Using mobile provision '%s'", provisionData.Name);

					buildProperties.MobileProvisionIdentifier = provisionData.Identifier;
					buildProperties.iOSCodesigningIdentity = certificateData.Alias;

					beginBuild(buildProperties);
				});
			});
		}
	}

	function beginBuild(buildProperties) {

		Object.keys(buildProperties).forEach(function(prop) {
			if (buildProperties[prop] === undefined) {
				throw new Error(util.format("Build property '%s' is undefined.", prop));
			}
		});

		server.buildProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, buildProperties, function(err, result) {
			if (err) {
				throw err;
			}
			
			var build = result.buildResults;
			var packageDefs = [];

			for (var i = 0; i < build.length; i++) {
				log.debug(build[i]);
				var filesystemPath = build[i].filesystemPath;
				var targetFileName = path.join(getTempDir(), path.basename(filesystemPath));
				if (options.download) {
					server.downloadFile(filesystemPath, targetFileName, function(err, result) {
						if (err) {
							throw err;
						}
						log.info("Download completed: %s", targetFileName);
					});
				} else {
					var fullDownloadPath = util.format("http://%s/api/filesystem/%s", config.ICE_SERVER, filesystemPath);
					var qrUrl = util.format("http://api.qrserver.com/v1/create-qr-code/?size=%dx%d&data=%s",
						config.QR_SIZE, config.QR_SIZE, querystring.escape(fullDownloadPath));

					log.debug("QR code URL for '%s' is '%s'", fullDownloadPath, qrUrl);
					packageDefs.push({platform: build[i].platform, qrUrl: qrUrl});
				}
			}

			if (result.output) {
				var buildLogFilePath = path.join(getTempDir(), "build.log");
				fs.writeFile(buildLogFilePath, result.output, function (err) {
					if (err) {
						throw err;
					}
					log.info("Build log written to '%s'", buildLogFilePath);
				})
			}

			if (packageDefs.length) {
				var templateFiles = helpers.enumerateFilesInDirectorySync(path.join(__dirname, "resources"));
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
						})
					}
				}
			}
		})
	}

	function build(platform, configuration) {
		configuration = configuration || "Debug";
		log.info("Building project for platform '%s', configuration '%s'", platform, configuration);

		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to build.");
			return;
		}

		zipProject(function(err, result) {
			if (err) {
				throw err;
			}
			log.debug("zipping completed, result file size: %d", fs.statSync(result.output).size);

			server.importProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, result.output,
				function(err, importResponse) {
					if (err !== null) {
						throw err;
					}

					log.trace("Project imported");

					requestCloudBuild(platform, configuration);
				});
		});
	}

	function saveProject(callback) {
		fs.writeFile(path.join(getProjectDir(), config.PROJECT_FILE_NAME), JSON.stringify(projectData), function(err) {
			if (callback) {
				callbacK(err);
			} else if (err) {
				throw err;
			}
		});
	}

	function createFromTemplate() {
		var templatesDir = path.join(__dirname, '../templates'),
			projectDir = options.path || process.cwd(),
			template = options.template || config.DEFAULT_PROJECT_TEMPLATE,
			templateFileName;
		
		if (!fs.existsSync(projectDir)) {
			fs.mkdirSync(projectDir);
		}
		if (fs.readdirSync(projectDir).length !== 0) {
			log.fatal('The specified directory must be empty to create a new project.');
			return;
		}

		templateFileName = path.join(templatesDir, 'Telerik.Mobile.Cordova.' + template + '.zip');
		if (fs.existsSync(templateFileName)) {
			fs.createReadStream(templateFileName)
			  .pipe(unzip.Extract({ path: projectDir}))
			  .on('close', function (){
			  	if (options.appid || options.appname) {
					cachedProjectDir = ""; // reset the cachedProjectDir so that getProjectDir sees the newly created directory as a project dir
					projectData = JSON.parse(fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME)));
					if (options.appname !== undefined) {
						projectData.name = options.appname;
						projectData.iOSDisplayName = options.appname;
					}
					if (options.appid !== undefined) {
						projectData.appIdentifier = options.appid;
					}
					saveProject();
				}
			  });
		} else {
			log.fatal('The requested template ' + options.template + ' does not exist.');
			log.fatal('Available templates are:');
			config.TEMPLATE_NAMES.forEach(function(item) { log.fatal(item) });
		}
	}

	if (getProjectDir()) {
		try {
			projectData = JSON.parse(fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME)));
		} catch(err) {
			log.fatal('There was a problem reading the project file. ' + err);
		}
	}

	exports.project = projectData;
	exports.build = build;
	exports.saveProject = saveProject;
	exports.createFromTemplate = createFromTemplate;
})();
