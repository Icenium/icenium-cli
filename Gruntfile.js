module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		ts: {
			devlib: {
				src: ["lib/**/*.ts"],
				reference: "lib/.d.ts",
				//watch: 'lib',
				options: {
					target: 'es5',
					module: 'commonjs',
					sourceMap: true,
					declaration: false,
					removeComments: false
				}
			},

			devtest: {
				src: ["test/**/*.ts"],
				options: {
					sourceMap: true,
					removeComments: false
				}
			},

			build: {
				src: ["**/*.ts"],
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*"]
		}
	});

	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-contrib-clean");

	grunt.registerTask("default", ["ts:devlib", "ts:devtest"]);
};
