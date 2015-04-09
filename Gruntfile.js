var util = require("util");
var os = require("os");

var now = new Date().toISOString();

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function(key) {
		result[key] = obj[key];
	});
	return result;
}

module.exports = function(grunt) {

	// Windows cmd does not accept paths with / and unix shell does not accept paths with \\ and we need to execute from a sub-dir.
	// To circumvent the issue, hack our environment's PATH and let the OS deal with it, which in practice works
	process.env.path = process.env.path + (os.platform() === "win32" ? ";" : ":") + "node_modules/.bin";

	var defaultEnvironment = "sit";

	grunt.initConfig({
		deploymentEnvironment: process.env["DeploymentEnvironment"] || defaultEnvironment,
		resourceDownloadEnvironment: process.env["ResourceDownloadEnvironment"] || defaultEnvironment,
		jobName: process.env["JOB_NAME"] || defaultEnvironment,
		buildNumber: process.env["BUILD_NUMBER"] || "non-ci",
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),

		ts: {
			options: {
				target: 'es5',
				module: 'commonjs',
				sourceMap: true,
				declaration: false,
				removeComments: false,
				noImplicitAny: true
			},

			devlib: {
				src: ["lib/**/*.ts"],
				reference: "lib/.d.ts"
			},

			devall: {
				src: ["lib/**/*.ts", "test/**/*.ts"],
				reference: "lib/.d.ts"
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts"],
				reference: "lib/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		watch: {
			devall: {
				files: ["lib/**/*.ts", 'test/**/*.ts'],
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
				command: "node bin/appbuilder.js dev-config-apply <%= resourceDownloadEnvironment %>"
			},
			
			prepare_resources: {
				command: "node bin/appbuilder.js dev-prepackage"
			},

			ci_unit_tests: {
				command: "npm test",
				options: {
					execOptions: {
						env: (function() {
							var env = shallowCopy(process.env);
							env["XUNIT_FILE"] = "test-reports.xml";
							env["LOG_XUNIT"] = "true";
							return env;
						})()
					}
				}
			},

			apply_deployment_environment: {
				command: "node bin/appbuilder.js dev-config-apply <%= deploymentEnvironment %>"
			},

			build_package: {
				command: "npm pack",
				options: {
					execOptions: {
						env: (function() {
							var env = shallowCopy(process.env);
							env["APPBUILDER_SKIP_POSTINSTALL_TASKS"] = "1";
							return env;
						})()
					}
				}
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*", "!lib/common/vendor/*.js", "!lib/hooks/**/*.js", "!lib/common/hooks/**/*.js", "*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");

	grunt.registerTask("set_package_version", function(version) {
		var fs = require("fs");
		var buildVersion = version !== undefined ? version : process.env["BUILD_NUMBER"];
		if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
			buildVersion = "PR" + buildVersion;
		}

		var packageJson = grunt.file.readJSON("package.json");
		var versionParts = packageJson.version.split("-");
		versionParts[1] = buildVersion;
		packageJson.version = versionParts.join("-");
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("test", ["ts:devall", "shell:ci_unit_tests"]);
	grunt.registerTask("pack", [
		"ts:release_build",

		"shell:apply_resources_environment",
		"shell:prepare_resources",
		"shell:apply_deployment_environment", 
		"shell:ci_unit_tests",

		"set_package_version",
		"shell:build_package"
	]);

	grunt.registerTask("default", "ts:devlib");
};
