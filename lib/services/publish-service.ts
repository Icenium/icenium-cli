///<reference path="../.d.ts"/>
"use strict";

import {EOL} from "os";
import * as helpers from "../common/helpers";
import * as path from "path";
import * as util from "util";
let Table = require("cli-table");

export class PublishService implements IPublishService {
	private static JSON_PUBLISH_FILE_NAME = ".abpublish";
	private static ALLOWED_CONNECTION_TYPE = "ftp";
	private static ERROR_MESSAGE_WHEN_PROJECT_EXISTS_ON_REMOTE = "Project already exists on the remote server";
	private static PUBLIC_URL_DEFAULT_VALUE = "";
	private static REMOVE_ALL_CONNECTIONS_MESSAGE = "All of them";

	private allPublishConnections: IPublishConnection[];
	private ftpPublishConnections: IPublishConnection[];

	constructor(private $errors: IErrors,
				private $fs: IFileSystem,
				private $logger: ILogger,
				private $progressIndicator: IProgressIndicator,
				private $projectConstants: Project.IProjectConstants,
				private $projectFilesManager: Project.IProjectFilesManager,
				private $project: Project.IProject,
				private $prompter: IPrompter,
				private $server: Server.IServer,
				private $options: IOptions) {

		this.$project.ensureProject();

		if (!this.$project.capabilities.publish) {
			this.$errors.failWithoutHelp("This command is only applicable to %s projects ", this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite);
		}

		this.readConnections().wait();
		this.ftpPublishConnections = _.filter(this.allPublishConnections, c => c.type === PublishService.ALLOWED_CONNECTION_TYPE);
	}

	public publish(idOrUrl: string, username: string, password: string): IFuture<void> {
		let ftpConnectionData = this.getFtpConnectionData(idOrUrl, username, password).wait();
		return this.publishToRemote(ftpConnectionData);
	}

	public listAllConnections(): void {
		if (!this.ftpPublishConnections.length) {
			this.$logger.info("No connections found. To add a connection, run $ appbuilder publish add");
			return;
		}

		let table = new Table({
			head: ["Index", "Name", "Publish URL"],
			chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
		});

		_.forEach(this.ftpPublishConnections, (connection, index) => {
			table.push([index + 1, connection.name, connection.publishUrl]);
		});

		this.$logger.out(table.toString());
		this.$logger.info('To publish to a remote url you can run $ appbuilder publish <Connection Index> [<Username> [<Password>]] [--force]');
	}

	public addConnection(name: string, publishUrl: string): IFuture<void> {
		return (() => {
			let ftpPublishConnection: IPublishConnection = {
				type: PublishService.ALLOWED_CONNECTION_TYPE,
				publicUrl: PublishService.PUBLIC_URL_DEFAULT_VALUE,
				publishUrl: publishUrl,
				name: name
			};

			if (!ftpPublishConnection.name) {
				ftpPublishConnection.name = this.$prompter.getString("Name:").wait();
			}

			if (!ftpPublishConnection.publishUrl) {
				ftpPublishConnection.publishUrl = this.$prompter.getString("Publish URL:").wait();
			}

			if (_.findIndex(this.ftpPublishConnections, c => c.name === name && c.publishUrl === publishUrl) !== -1) {
				this.$errors.failWithoutHelp("This connection has already been added.");
			}

			this.allPublishConnections.push(ftpPublishConnection);
			this.savePublishJsonFile().wait();
			this.$logger.info("Connection '%s' added successfully.", ftpPublishConnection.name);
		}).future<void>()();
	}

	public removeConnection(idOrName: string): IFuture<void> {
		return (() => {
			let id = parseInt(idOrName) - 1;
			let message : string;
			if (!isNaN(id)) {
				let removedConnection = this.removeConnectionById(id);
				message = util.format("Connection '%s' successfully removed.", removedConnection.name);
			} else {
				let removedConnections = this.removeConnectionByName(idOrName).wait();
				message = removedConnections.length > 1 ? util.format("All connections named '%s' successfully removed.", idOrName) : util.format("Connection '%s' successfully removed.", removedConnections[0].name);
			}

			this.savePublishJsonFile().wait();
			this.$logger.info(message);
		}).future<void>()();
	}

	private removeConnectionById(id: number): IPublishConnection {
		this.validateId(id);

		return _.first(helpers.remove(this.allPublishConnections, c => c === this.ftpPublishConnections[id]));
	}

	private removeConnectionByName(name: string): IFuture<IPublishConnection[]> {
		return (():IPublishConnection[] => {
			name = name.toLowerCase();
			let connectionsToBeRemoved = _.filter(this.ftpPublishConnections, c => c.name.toLowerCase() === name);

			if (connectionsToBeRemoved.length > 1) {
				let connectionNameUrls = _.map(connectionsToBeRemoved, c => c.name + '(' + c.publishUrl + ')');
				connectionNameUrls.push(PublishService.REMOVE_ALL_CONNECTIONS_MESSAGE);

				let chosenConnectionNameUrl = this.$prompter.promptForChoice("Which connection do you want to remove?", connectionNameUrls).wait();
				if (chosenConnectionNameUrl === PublishService.REMOVE_ALL_CONNECTIONS_MESSAGE) {
					return <IPublishConnection[]>_.remove(this.allPublishConnections, c => c.name.toLowerCase() === name && c.type === PublishService.ALLOWED_CONNECTION_TYPE);
				} else {
					return helpers.remove(this.allPublishConnections, c => c.name + '(' + c.publishUrl + ')' === chosenConnectionNameUrl);
				}
			} else if (connectionsToBeRemoved.length === 1) {
				return <IPublishConnection[]>_.remove(this.allPublishConnections, connectionsToBeRemoved[0]);
			} else {
				this.$errors.failWithoutHelp("Cannot find connections named '%s'.", name);
			}
		}).future<IPublishConnection[]>()();
	}

	private readConnections(): IFuture<void> {
		return (() => {
			let projectDir = this.$project.getProjectDir().wait();
			let publishFilePath = path.join(projectDir, PublishService.JSON_PUBLISH_FILE_NAME);
			if (!this.$fs.exists(publishFilePath).wait()) {
				this.allPublishConnections = [];
				return;
			}

			try {
				this.allPublishConnections = this.$fs.readJson(publishFilePath).wait() || [];
			} catch (err) {
				this.$errors.failWithoutHelp("The publish file %s is corrupted." + EOL +
						"Consider restoring an earlier version from your source control or backup." + EOL +
						"Additional technical information: %s", publishFilePath, err.toString());
			}
		}).future<void>()();
	}

	private getFtpConnectionData(idOrUrl: string, username: string, password: string): IFuture<Server.FtpConnectionData> {
		return (() => {
			let ftpConnectionData: Server.FtpConnectionData = {
				RemoteUrl: idOrUrl,
				ShouldPurge: this.$options.force,
				Username: username,
				Password: password
			};

			if (!ftpConnectionData.Username) {
				ftpConnectionData.Username = this.$prompter.getString("Username:").wait();
			}

			if (!ftpConnectionData.Password) {
				ftpConnectionData.Password = this.$prompter.getPassword("Password:", {allowEmpty: true}).wait();
			}

			let id = parseInt(idOrUrl) - 1;

			// the check whether it contains a dot is performed
			// in case the user tries to publish to an IP address
			if (!isNaN(id) && idOrUrl.indexOf('.') < 0) {
				this.validateId(id);

				ftpConnectionData.RemoteUrl = this.ftpPublishConnections[id].publishUrl;
			}

			return ftpConnectionData;
		}).future<Server.FtpConnectionData>()();
	}

	private publishToRemote(ftpConnectionData: Server.FtpConnectionData): IFuture<void> {
		return (() => {
			let projectName = this.$project.projectData.ProjectName;
			let projectDir = this.$project.getProjectDir().wait();
			this.$projectFilesManager.excludeFile(projectDir, PublishService.JSON_PUBLISH_FILE_NAME);
			this.$project.importProject().wait();
			this.$logger.printInfoMessageOnSameLine("Publishing");

			try {
				this.$progressIndicator.showProgressIndicator(this.$server.publish.publishFtp(projectName, projectName, ftpConnectionData), 6000).wait();
			} catch (err) {
				if (err.message === PublishService.ERROR_MESSAGE_WHEN_PROJECT_EXISTS_ON_REMOTE) {
					this.$errors.failWithoutHelp("This project already exists on the remote server. " + EOL +
									"To remove all files and upload the new ones on the remote server, run $ appbuilder publish --force");
				}

				throw err;
			}

			this.$logger.info("Project '%s' published successfully.", projectName);
		}).future<void>()();
	}

	private savePublishJsonFile(): IFuture<void> {
		return (() => {
			let projectDir = this.$project.getProjectDir().wait();
			this.$fs.writeJson(path.join(projectDir, PublishService.JSON_PUBLISH_FILE_NAME), this.allPublishConnections).wait();
		}).future<void>()();
	}

	private validateId(id: number): void {
		if (id < 0 || this.ftpPublishConnections.length <= id) {
			this.$errors.failWithoutHelp("Incorrect index. For a complete list of the available connections and their indexes, run $ appbuilder publish");
		}
	}
}
$injector.register("publishService", PublishService);
