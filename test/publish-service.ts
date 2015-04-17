///<reference path=".d.ts"/>
"use strict";

import publishService = require("./../lib/services/publish-service");
import errorsLib = require("./../lib/common/errors");
import stubs = require("./stubs");
import Future = require("fibers/future");
import yok = require("../lib/common/yok");

import assert = require("assert");

var writeJsonData: any;
var timesPrompterHasAskedForString: number;
var serverFtpConnectionData: Server.FtpConnectionData;

function createTestInjector(publishConnections: IPublishConnection[]): IInjector {
	var testInjector = new yok.Yok();
	testInjector.register("errors", errorsLib.Errors);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("staticConfig", stubs.StaticConfig);
	testInjector.register("projectConstants", {});
	testInjector.register("project", {});
	testInjector.register("projectConstants", {});

	// Register mocked dependencies
	testInjector.register("progressIndicator", {
		showProgressIndicator: (future: IFuture<any>, timeout: number) => { 
			return future; 
		}
	});

	testInjector.register("projectFilesManager", {
		excludeFile: (projectDir: string, excludeFilePath: string) => {}
	});
	
	testInjector.register("prompter", {
		getString: (prompt: string) => {
			return (() => {
				++timesPrompterHasAskedForString;
				return '';
			}).future<string>()();
		},
		getPassword: (prompt: string, options?: {allowEmpty?: boolean}) => {
			return (() => {
				++timesPrompterHasAskedForString;
				return '';
			}).future<string>()();
		}
	});

	testInjector.register("fs", {
		readJson: (filename:string, encoding?:string) => {
			return Future.fromResult(publishConnections);
		},
		exists: (path: string) => {
			return Future.fromResult(true);
		},
		writeJson: (filename:string, data:any, space?: string, encoding?: string) => {
			return (() => {
				writeJsonData = data;
			}).future<void>()();
		}
	});

	testInjector.register("project", {
		getProjectDir: () => {
			return (() => {
				return '';
			}).future<string>()();
		},
		capabilities : {
			publish: true
		},
		projectData: {
			ProjectName: "ProjectName"
		},
		ensureProject: () => { 
		},
		importProject: () => { 
			return (() => {}).future<void>()();
		}
	});

	testInjector.register("server", {
		publish: {
			publishFtp: (solutionName: string, projectName: string, ftpConnectionData: Server.FtpConnectionData) => {
				return (() => {
					serverFtpConnectionData = ftpConnectionData;
				}).future<void>()();
			}
		}
	});

	return testInjector;
}

describe("publish-service", () => {
	var service: IPublishService;
	beforeEach(() => {
		writeJsonData = null;
		timesPrompterHasAskedForString = 0;
	});

	describe("publish", () => {
		it("when publish by id should call server with correct data", () => {
			var remotePublishUrl = 'firstUrl';
			var initialPublishConnections: IPublishConnection[] = [{
				type: 'ftp',
				publicUrl: '',
				publishUrl: remotePublishUrl,
				name: 'firstName'
			}];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			
			var expected: Server.FtpConnectionData = { 
				RemoteUrl: remotePublishUrl,
				ShouldPurge: undefined,
				Username: 'username',
				Password: 'password' 
			}

			service.publish('1', 'username', 'password').wait();

			assert.deepEqual(serverFtpConnectionData, expected, 'Incorrect data to server provided');
		});

		it("when publish by id with invalid id should throw", () => {
			var initialPublishConnections: IPublishConnection[] = [];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);

			assert.throws(() => service.publish('1', '', '').wait(), 'Connection with invalid id successfully published to remote');
		});

		it("when publish by url should call server with correct data", () => {
			var initialPublishConnections: IPublishConnection[] = [{
				type: 'ftp',
				publicUrl: '',
				publishUrl: 'firstUrl',
				name: 'firstName'
			}];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			
			var expected: Server.FtpConnectionData = { 
				RemoteUrl: '127.0.0.1',
				ShouldPurge: undefined,
				Username: 'username',
				Password: 'password' 
			}

			service.publish('127.0.0.1', 'username', 'password').wait();

			assert.deepEqual(serverFtpConnectionData, expected, 'Incorrect data to server provided');
		});

		it("when publishing without password should prompt for password", () => {
			var initialPublishConnections: IPublishConnection[] = [];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);

			service.publish('127.0.0.1', 'username', '').wait();

			assert.strictEqual(timesPrompterHasAskedForString, 1, 'User is not prompted to provide mandatory parameter password');
		});

		it("when publishing without username and password should prompt for both", () => {
			var initialPublishConnections: IPublishConnection[] = [];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);

			service.publish('127.0.0.1', '', '').wait();

			assert.strictEqual(timesPrompterHasAskedForString, 2, 'User is not prompted to provide mandatory parameters username password');
		});
	});

	describe("publish-add", () => {
		it("when adding first connection should call $fs.writeJson with correct data", () => {
			var initialPublishConnections: IPublishConnection[] = [];
			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			var name = 'name';
			var url = 'url';
			service.addConnection(name, url).wait();
			var ftpPublishConnection: IPublishConnection = {
				type: 'ftp',
				publicUrl: '',
				publishUrl: url,
				name: name
			};

			assert.deepEqual(writeJsonData, [ftpPublishConnection], '$fs.writeJson called with incorrect data');
		});

		it("when adding multiple connections should call $fs.writeJson with correct data", () => {
			var initialPublishConnections: IPublishConnection[] = [];
			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			var name1 = 'name';
			var url1 = 'url';

			var name2 = 'name';
			var url2 = 'url';

			service.addConnection(name1, url1).wait();
			service.addConnection(name2, url2).wait();
			var ftpPublishConnections: IPublishConnection[] = [{
				type: 'ftp',
				publicUrl: '',
				publishUrl: url1,
				name: name1
			},
			{
				type: 'ftp',
				publicUrl: '',
				publishUrl: url2,
				name: name2
			}];

			assert.deepEqual(writeJsonData, ftpPublishConnections, '$fs.writeJson called with incorrect data');
		});

		it("when adding duplicate connections should throw", () => {
			var name = 'name';
			var url = 'url';

			var initialPublishConnections: IPublishConnection[] = [{
				type: 'ftp',
				publicUrl: '',
				publishUrl: url,
				name: name
			}];
			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			assert.throws(() => service.addConnection(name, url).wait(), 'Duplicate connections added without error');
		});

		it("when adding connection without url should prompt for url", () => {
			var name = 'name';
			var url = '';

			var initialPublishConnections: IPublishConnection[] = [];
			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			service.addConnection(name, url).wait();
			assert.strictEqual(timesPrompterHasAskedForString, 1, 'User is not prompted to provide mandatory parameter URL');
		});

		it("when adding connection without name and url should prompt for both", () => {
			var name = '';
			var url = '';

			var initialPublishConnections: IPublishConnection[] = [];
			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			service.addConnection(name, url).wait();
			assert.strictEqual(timesPrompterHasAskedForString, 2, 'User is not prompted to provide mandatory parameters name and URL');
		});
	});

	describe("publish-remove", () => {
		it("when removing new connection by id should call $fs.writeJson with correct data", () => {
			var ftpPublishConnection: IPublishConnection = {
				type: 'ftp',
				publicUrl: '',
				publishUrl: 'secondUrl',
				name: 'secondName'
			};

			var initialPublishConnections: IPublishConnection[] = [{
				// id = 1
				type: 'ftp',
				publicUrl: '',
				publishUrl: 'firstUrl',
				name: 'firstName'
			},
			ftpPublishConnection];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			
			service.removeConnection('1').wait();

			assert.deepEqual(writeJsonData, [ftpPublishConnection], '$fs.writeJson called with incorrect data');
		});

		it("when removing connection with invalid connection id should throw", () => {
			var initialPublishConnections: IPublishConnection[] = [];

			var testInjector = createTestInjector(initialPublishConnections);
			service = testInjector.resolve(publishService.PublishService);
			
			assert.throws(() => service.removeConnection('1').wait(), 'Connection with invalid id successfully deleted');
		});
	});

});

