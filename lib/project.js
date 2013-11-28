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
		iosDeploy = require("./ios-deploy"),
		xopen = require("open"),
		async = require("async"),
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

	function requestCloudBuild(platform, configuration, callback) {
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

			beginBuild(buildProperties, callback);
		} else if (platform === "iOS" ) {
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

					beginBuild(buildProperties, callback);
				});
			});
		}
	}

	function beginBuild(buildProperties, callback) {

		Object.keys(buildProperties).forEach(function(prop) {
			if (buildProperties[prop] === undefined) {
				callback(Error(util.format("Build property '%s' is undefined.", prop)));
				return;
			}
		});

		server.buildProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, buildProperties, function(err, result) {
			if (err) {
				callback(err);
				return;
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

			log.debug(result.buildResults);

			callback(null, {
				buildProperties: buildProperties,
				packageDefs: result.buildResults,
			});
		});
	}

	function showPackageQRCodes(packageDefs) {
		if (!packageDefs.length) {
			return;
		}

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

	function build(platform, configuration, showQrCodes, downloadFiles, callback) {
		configuration = configuration || "Debug";
		log.info("Building project for platform '%s', configuration '%s'", platform, configuration);

		importProject(function(err) {
			if (err) {
				throw err;
			}

			requestCloudBuild(platform, configuration, function(err, buildResult) {
				var packageDefs = buildResult.packageDefs;

				if (showQrCodes && packageDefs.length) {
					async.map(packageDefs,
						function(def, callback) {
							server.getLiveSyncUrl(def.platform, def.relativePath, buildResult.buildProperties.LiveSyncToken,
								function(err, liveSyncUrl) {
									def.qrUrl = helpers.createQrUrl(liveSyncUrl);

									log.debug("QR URL is '%s'", def.qrUrl);
									callback(err, def);
								});
						},
						function(err, results) {
							if (err) {
								throw err;
							}

							showPackageQRCodes(results);
						}
					);
				}

				if (downloadFiles) {
					async.each(packageDefs, function(pkg, callback) {
						var filesystemPath = pkg.filesystemPath;
						var targetFileName = path.join(getTempDir(), path.basename(filesystemPath));
						server.downloadFile(filesystemPath, targetFileName, function(err, result) {
							if (err) {
								callback(err);
							} else {
								log.info("Download completed: %s", targetFileName);
								pkg.localFile = targetFileName;
								callback();
							}
						});
					}, function(err) {
						if (err) {
							throw err;
						}
						if (callback) {
							callback(null, packageDefs);
						}
					});
				} else {
					if (callback) {
						callback(null, packageDefs);
					}
				}
			});
		})
	}

	function buildCommand(platform, configuration) {
		build(platform, configuration, true, options.download);
	}

	function deployToIon() {
		log.info("Deploying to Ion");

		importProject(function(err) {
			if (err) {
				throw err;
			}

			server.getLiveSyncToken(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, function(err, liveSyncToken) {
				if (err) {
					throw err;
				}

				var hostPart = util.format("%s://%s", config.ICE_SERVER_PROTO, config.ICE_SERVER);
				var fullDownloadPath = util.format("icenium://%s?LiveSyncToken=%s", querystring.escape(hostPart), querystring.escape(liveSyncToken));

				log.debug("Using LiveSync URL for Ion: %s", fullDownloadPath);

				showPackageQRCodes([{
					platform: "Ion",
					qrUrl: helpers.createQrUrl(fullDownloadPath),
				}]);
			})
		})
	}

	function deployToDevice(platform, configuration) {
		build(platform, configuration, false, true, function(err, packageDefs) {
			if (err) {
				throw err;
			}

			log.debug("Ready to deploy %s", packageDefs);
			log.debug("File is %d bytes", fs.statSync(packageDefs[0].localFile).size);

			if(platform.toLowerCase() === "ios") {
				iosDeploy.deploy(packageDefs[0].localFile);
			}
		})
	}

	function importProject(callback) {
		var projectDir = getProjectDir();
		if (!projectDir) {
			log.fatal("Found nothing to import.");
			return;
		}

		zipProject(function(err, result) {
			if (err) {
				throw err;
			}
			log.debug("zipping completed, result file size: %d", fs.statSync(result.output).size);

			server.importProject(projectData.name, projectData.name, config.SOLUTION_SPACE_NAME, result.output,
				function(err, importResponse) {
					log.trace("Project imported");
					if (callback) {
						callback(err);
					} else {
						if (err !== null) {
							throw err;
						}
					}
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
	exports.buildCommand = buildCommand;
	exports.saveProject = saveProject;
	exports.importProject = importProject;
	exports.deployToIon = deployToIon;
	exports.deployToDevice = deployToDevice;
	exports.createFromTemplate = createFromTemplate;
})();
