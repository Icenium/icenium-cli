var os = require("os");

var now = new Date().toISOString();
var nodeArgs = require("./lib/common/scripts/node-args").getNodeArgs();

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function (key) {
		result[key] = obj[key];
	});
	return result;
}

function getBuildVersion(version) {
	var buildVersion = version !== undefined ? version : process.env["BUILD_NUMBER"];
	if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
		buildVersion = "PR" + buildVersion;
	}

	return buildVersion;
}

module.exports = function (grunt) {

	// Windows cmd does not accept paths with / and unix shell does not accept paths with \\ and we need to execute from a sub-dir.
	// To circumvent the issue, hack our environment's PATH and let the OS deal with it, which in practice works
	process.env.path = process.env.path + (os.platform() === "win32" ? ";" : ":") + "node_modules/.bin";

	var isPackageJsonModified = false;

	var defaultEnvironment = "sit";
	// When there are node_modules inside lib\common directory, CLI behaves incorrectly, so delete this dir.
	var path = require("path");
	var commonLibNodeModules = path.join("lib", "common", "node_modules");
	if (require("fs").existsSync(commonLibNodeModules)) {
		grunt.file.delete(commonLibNodeModules);
	}
	grunt.file.write(path.join("lib", "common", ".d.ts"), "");

	grunt.initConfig({
		deploymentEnvironment: process.env["DeploymentEnvironment"] || defaultEnvironment,
		resourceDownloadEnvironment: process.env["ResourceDownloadEnvironment"] || defaultEnvironment,
		jobName: process.env["JOB_NAME"] || defaultEnvironment,
		buildNumber: process.env["BUILD_NUMBER"] || "non-ci",
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["lib/**/*.ts", "!lib/common/node_modules/**/*.ts", "!lib/common/messages/**/*.ts"],
				reference: "lib/.d.ts"
			},

			devall: {
				src: ["lib/**/*.ts", "test/**/*.ts", "!lib/common/node_modules/**/*.ts", "lib/common/test/unit-tests/**/*.ts", "definitions/**/*.ts", "!lib/common/test/.d.ts", "!lib/common/messages/**/*.ts"],
				reference: "lib/.d.ts"
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts", "!lib/common/node_modules/**/*.ts", "!lib/common/messages/**/*.ts"],
				reference: "lib/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		tslint: {
			build: {
				files: {
					src: ["lib/**/*.ts", "test/**/*.ts", "!lib/common/node_modules/**/*.ts", "!lib/common/messages/**/*.ts", "lib/common/test/unit-tests/**/*.ts", "definitions/**/*.ts", "!**/*.d.ts"]
				},
				options: {
					configuration: grunt.file.readJSON("./tslint.json")
				}
			}
		},

		watch: {
			devall: {
				files: ["lib/**/*.ts", 'test/**/*.ts', "!lib/common/node_modules/**/*.ts", "!lib/common/messages/**/*.ts"],
				tasks: ['ts:devall'],
				options: {
					atBegin: true,
					interrupt: true
				}
			}
		},

		shell: {
			options: {
				stdout: true,
				stderr: true
			},

			apply_resources_environment: {
				command: "node " + nodeArgs.join(" ") + " bin/appbuilder dev-config-apply <%= resourceDownloadEnvironment %>"
			},

			prepare_resources: {
				command: "node " + nodeArgs.join(" ") + " bin/appbuilder dev-prepackage"
			},

			ci_unit_tests: {
				command: "npm test",
				options: {
					execOptions: {
						env: (function () {
							var env = shallowCopy(process.env);
							env["XUNIT_FILE"] = "test-reports.xml";
							env["LOG_XUNIT"] = "true";
							return env;
						})()
					}
				}
			},

			apply_deployment_environment: {
				command: "node " + nodeArgs.join(" ") + " bin/appbuilder dev-config-apply <%= deploymentEnvironment %>"
			},

			build_package: {
				command: "npm pack",
				options: {
					execOptions: {
						env: (function () {
							var env = shallowCopy(process.env);
							env["APPBUILDER_SKIP_POSTINSTALL_TASKS"] = "1";
							return env;
						})()
					}
				}
			}
		},

		clean: {
			src: ["test/**/*.js*",
				"lib/**/*.js*",
				"!test-scripts/**/*",
				"!lib/common/vendor/*.js",
				"!lib/hooks/**/*.js",
				"!lib/common/**/*.json",
				"!lib/common/Gruntfile.js",
				"!lib/common/node_modules/**/*",
				"!lib/common/hooks/**/*.js",
				"!lib/common/bin/*.js",
				"!lib/common/test-scripts/**/*",
				"!lib/common/scripts/**/*",
				"*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-tslint");

	grunt.registerTask("set_package_version", function (version) {
		var buildVersion = getBuildVersion(version);
		var packageJson = grunt.file.readJSON("package.json");
		packageJson.buildVersion = buildVersion;
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("setBundleDependencies", function (version) {
		var buildVersion = getBuildVersion(version);
		var packageJson = grunt.file.readJSON("package.json");
		packageJson.bundleDependencies = Object.keys(packageJson.dependencies);
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("setPackageName", function (version) {
		var fs = require("fs");
		var fileExtension = ".tgz";
		var buildVersion = getBuildVersion(version);
		var packageJson = grunt.file.readJSON("package.json");
		var oldFileName = packageJson.name + "-" + packageJson.version;
		var newFileName = oldFileName + "-" + buildVersion;
		fs.renameSync(oldFileName + fileExtension, newFileName + fileExtension);
	});

	grunt.registerTask("delete_coverage_dir", function () {
		var done = this.async();
		var rimraf = require("rimraf");
		rimraf("coverage", function (err) {
			if (err) {
				console.log("Error while deleting coverage directory from the package.");
				done(false);
			}

			done();
		});
	});

	grunt.registerTask("test", ["ts:devall", "shell:ci_unit_tests"]);

	grunt.registerTask("remove_prepublish_script", function () {
		var packageJson = grunt.file.readJSON("package.json");
		if (packageJson && packageJson.scripts && packageJson.scripts.prepublish) {
			delete packageJson.scripts.prepublish;
			grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
			isPackageJsonModified = true;
		}
	});

	grunt.registerTask("printPackageJsonWarning", function () {
		if (isPackageJsonModified) {
			require("colors");
			console.log("NOTE: `grunt pack` command modified package.json. DO NOT COMMIT these changes, they are required only for the produced .tgz.".red.bold);
		}
	});

	grunt.registerTask("pack", [
		"clean",

		"ts:release_build",

		"remove_prepublish_script",

		"shell:apply_resources_environment",
		"shell:prepare_resources",
		"shell:apply_deployment_environment",
		"shell:ci_unit_tests",

		"set_package_version",
		"delete_coverage_dir",
		"shell:build_package",
		"setPackageName",
		"printPackageJsonWarning"
	]);
	grunt.registerTask("bundle-pack", ["setBundleDependencies", "pack"]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "ts:devlib"]);
	grunt.registerTask("default", "ts:devlib");
};
