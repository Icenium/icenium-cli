import { EOL } from "os";

export class PortCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors,
		private $hostInfo: IHostInfo) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp("You can use remote command only on MacOS.");
			}

			if(!validationValue) {
				this.$errors.fail("You must specify a port number.");
			}

			let parsedPortNumber = parseInt(validationValue);

			if(isNaN(parsedPortNumber) || parsedPortNumber <= 0 || parsedPortNumber >= 65536) {
				this.$errors.failWithoutHelp("You must specify a valid port number. Valid values are between 1 and 65535.");
			}

			if(parsedPortNumber < 1024) {
				this.$errors.failWithoutHelp("Port %s is a system port and cannot be used." + EOL +
					"To use a non-system port, re-run the command with a port number greater than 1023.", parsedPortNumber.toString());
			}
			return true;
		}).future<boolean>()();
	}
}

export class RemoteCommand implements ICommand {
	constructor(private $remoteService: IRemoteService,
		private $errors: IErrors,
		private $hostInfo: IHostInfo) {
	}

	public async execute(args: string[]): Promise<void> {
			let portNumber = parseInt(args[0]);
			this.$remoteService.startApiServer(portNumber).wait();
	}

	allowedParameters = [new PortCommandParameter(this.$errors, this.$hostInfo)];
}

$injector.registerCommand("remote", RemoteCommand);
