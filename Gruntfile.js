var util = require("util");

var now = new Date().toISOString();

module.exports = function(grunt) {
	grunt.initConfig({
		copyPackageTo: "\\\\telerik.com\\Resources\\BlackDragon\\Builds\\appbuilder-cli",

		deploymentEnvironment: process.env["DeploymentEnvironment"] || "local",
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
					"node bin\\appbuilder.js dev-config-apply cibuild",
					"call node_modules\\.bin\\mocha.cmd --ui mocha-fibers --recursive --reporter xunit --require test/test-bootstrap.js --timeout 15000 test/ > test-reports.xml"
				].join("&&")
			},

			build_package: {
				command: [
					"node bin\\appbuilder.js dev-config-apply <%= deploymentEnvironment %>",
					"npm pack"
				].join("&&")
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
			src: ["test/**/*.js*", "lib/**/*.js*", "*.tgz"]
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
		"shell:ci_unit_tests",
		"set_package_version",
		"shell:build_package",
		"copy:package_to_drop_folder",
		"copy:package_to_qa_drop_folder"
	]);

	grunt.registerTask("default", "ts:devlib");
};
