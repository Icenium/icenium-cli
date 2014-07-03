var util = require("util");

var now = new Date().toISOString();

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function(key) {
		result[key] = obj[key];
	});
	return result;
}

module.exports = function(grunt) {
	grunt.initConfig({
		copyPackageTo: "\\\\telerik.com\\Resources\\BlackDragon\\Builds\\appbuilder-cli",

		deploymentEnvironment: process.env["DeploymentEnvironment"] || "local",
		resourceDownloadEnvironment: process.env["ResourceDownloadEnvironment"] || "local",
		jobName: process.env["JOB_NAME"] || "local",
		buildNumber: process.env["BUILD_NUMBER"] || "non-ci",
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),

		ts: {
			options: {
				target: 'es5',
				module: 'commonjs',
				sourceMap: true,
				declaration: false,
				removeComments: false
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

			prepare_resources: {
				command: [
					"node bin\\appbuilder.js dev-config-apply <%= resourceDownloadEnvironment %>",
					"node bin\\appbuilder.js dev-prepackage"
				].join("&&")
			},

			ci_unit_tests: {
				command: [
					"call node_modules\\.bin\\mocha.cmd --ui mocha-fibers --recursive --reporter xunit --require test/test-bootstrap.js --timeout 15000 test/ > test-reports.xml"
				].join("&&")
			},

			apply_deployment_environment: {
				command: "node bin\\appbuilder.js dev-config-apply <%= deploymentEnvironment %>"
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

		copy: {
			package_to_drop_folder: {
				src: "*.tgz",
				dest: "<%= copyPackageTo %>/<%= jobName %>/<%= deploymentEnvironment %>/<%= dateString %> #<%= buildNumber %>/"
			},
			package_to_qa_drop_folder: {
				src: "*.tgz",
				dest: "<%= copyPackageTo %>/<%= jobName %>/<%= deploymentEnvironment %>/appbuilder.tgz"
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*", "!lib/common/vendor/*.js", "*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
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

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);
	grunt.registerTask("pack", [
		"clean",
		"ts:release_build",
		"shell:prepare_resources",

		"shell:apply_deployment_environment",
		"shell:ci_unit_tests",

		"set_package_version",
		"shell:build_package",

		"copy:package_to_drop_folder",
		"copy:package_to_qa_drop_folder"
	]);

	grunt.registerTask("default", "ts:devlib");
};
