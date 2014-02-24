module.exports = function(grunt) {
	grunt.initConfig({
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

			devtest: {
				src: ["test/**/*.ts"],
				options: {
					sourceMap: true,
					removeComments: false
				}
			},

			build: {
				src: ["lib/**/*.ts"],
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		watch: {
			devlib: {
				files: ['lib/**/*.ts'],
				tasks: ['ts:devlib'],
				options: {
				  atBegin: true,
				  interrupt: true
				},
			},

			devtest: {
				files: ['test/**/*.ts'],
				tasks: ['ts:devtest'],
				options: {
				  atBegin: true,
				  interrupt: true
				},
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*"]
		}
	});

	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask("default", ["ts:devlib", "ts:devtest"]);
};
