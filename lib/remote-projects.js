(function() {
	"use strict";
	var server = require("./server"),
		util = require("util"),
		options = require("./options"),
		path = require("path"),
		helpers = require("./helpers"),
		log = require("./log"),
		project = require("./project"),
		Q = require("q"),
		_ = require("underscore"),
		user = require("./user");

	function listProjects() {
		getProjects()
			.then(function(data) {
				printProjects(data);
			})
			.done();
	}

	function printProjects(projects) {
		console.log("Projects:");
		projects.forEach(function (project, index) {
			console.log(util.format("#%d: '%s'", index + 1, project.name));
		});
	}

	function exportProject(projectId) {
		getProjectName(projectId)
			.then(doExportRemoteProject)
			.then(function(result) {
				console.log(result);
			})
			.catch(function(error) {
				log.error(error);
			})
			.done();
	}

	function doExportRemoteProject(remoteProjectName) {
		var projectDir = path.join(getProjectDir(), remoteProjectName);
		return getProjectProperties(remoteProjectName)
			.then(function(properties) {
				return project.createProjectFile(projectDir, remoteProjectName, properties);
			})
			.then(function() {
				var unzip = require("unzip");

				var parameters = server.createAuthenticatedRequestParameters("GET");
				parameters.path = util.format("/api/projects/export/%s", encodeURIComponent(remoteProjectName));
				parameters.pipeTo = unzip.Extract({ path: projectDir});

				return user.getUserState()
					.then(function(userState) {
						parameters.setSolutionSpace(userState.tenant.id);

						var deferred = Q.defer();
						server.httpRequest(parameters, function(result) {
							if (result.error) {
								deferred.reject(result.error);
							} else {
								deferred.resolve(result.response);
							}
						});
						return deferred.promise;
					});
			})
			.then(function() {
				return util.format("%s has been successfully exported to %s", remoteProjectName, projectDir);
			});
	}

	function getProjectName(projectId) {
		var parsedProjectId = parseProjectId(projectId);
		return getProjects()
			.then(function(data) {
				if (parsedProjectId.index !== undefined && parsedProjectId.index !== null) {
					if (parsedProjectId.index < 1 || parsedProjectId.index > data.length) {
						throw new Error(util.format("The project index must be between 1 and %s", data.length));
					} else {
						return data[parsedProjectId.index - 1].name;
					}
				} else if (parsedProjectId.name && _.findWhere(data, {name: parsedProjectId.name})) {
					return parsedProjectId.name;
				} else {
					throw new Error(util.format("The project %s cannot be found", parsedProjectId.name));
				}
			});
	}

	function getProjects() {
		var parameters = server.createAuthenticatedRequestParameters("GET");
		parameters.headers["Content-Type"] = "application/json";
		parameters.path = "/api/tap/projects";

		var deferred = Q.defer();
		server.httpRequest(parameters, function(result) {
			var error = result.error;
			var data = !error ? JSON.parse(result.body) : null;

			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve(data);
			}
		});
		return deferred.promise;
	}

	function parseProjectId(projectId) {
		var parsedProjectId = { index: null, name: null };
		if (helpers.isNumber(projectId)) {
			parsedProjectId.index = parseInt(projectId);
		} else {
			parsedProjectId.name = projectId;
		}
		return parsedProjectId;
	}

	function getProjectDir() {
		return options.path || path.resolve(".");
	}

	function getProjectProperties(projectName) {
		return getSolutionData(projectName)
			.then(function(result) {
				var solutionData = JSON.parse(result);
				return solutionData.Items[0].Properties;
			});
	}

	function getSolutionData(projectName) {
		var parameters = server.createAuthenticatedRequestParameters("GET");
		parameters.path = util.format("/api/projects/%s?checkUpgradability=True", encodeURIComponent(projectName));
		return user.getUserState()
			.then(function(userState) {
				parameters.setSolutionSpace(userState.tenant.id);
				parameters.headers["Content-Type"] = "application/json";

				var deferred = Q.defer();
				server.httpRequest(parameters, function(result) {
					if (result.error) {
						deferred.reject(result.error);
					} else {
						deferred.resolve(result.body);
					}
				});
				return deferred.promise;
			});
	}

	exports.listProjects = listProjects;
	exports.exportProject = exportProject;
}());
