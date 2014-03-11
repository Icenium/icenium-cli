var util = require("util");

module.exports = function(grunt) {
	grunt.initConfig({
		deploymentEnvironment: process.env["DeploymentEnvironment"] || "local",
		copyPackageTo: "\\\\telerik.com\\Resources\\BlackDragon\\Builds\\appbuilder-cli",

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
				src: ["lib/**/*.ts", "test/**/*.ts"]
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts"],
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
			npm_test: {
				command: "npm test",
				options: {
					stdout: true,
					stderr: true
				}
			},

			ci_unit_tests: {
				command: [
					"node bin\\appbuilder.js config-apply cibuild",
					"call node_modules\\.bin\\mocha.cmd --ui mocha-fibers --recursive --reporter xunit --require test/test-bootstrap.js --timeout 15000 test/ > test-reports.xml"
				].join("&&")
			},

			build_package: {
				command: [
					"node bin\\appbuilder.js config-apply <%= deploymentEnvironment %>",
					"npm pack"
				].join("&&")
			},

			copy_package: {
				command: function() {
					var now = new Date().toISOString();
					var jobName = process.env["JOB_NAME"] || "local";
					var buildNumber = process.env["BUILD_NUMBER"] || "non-ci";
					var subfolder = util.format("%s\\<%= deploymentEnvironment %>\\%s #%s", jobName, now.substr(0, now.indexOf("T")), buildNumber);
					return util.format("robocopy . \"<%= copyPackageTo %>\\%s\" *.tgz", subfolder);
				},
				options: {
					callback: function(err, stdout, stderr, cb) {
						// ROBOCOPY exit codes:
						// http://ss64.com/nt/robocopy-exit.html
						if (err && err.code >= 8) {
							grunt.warn(err);
						}
						cb();
					}
				}
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*", "*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");

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

	grunt.registerTask("test", ["ts:devtest", "shell:npm_test"]);
	grunt.registerTask("pack", [
		"ts:release_build",
		"shell:ci_unit_tests",
		"set_package_version",
		"shell:build_package",
		"shell:copy_package"
	]);

	grunt.registerTask("default", "ts:devlib");
};
