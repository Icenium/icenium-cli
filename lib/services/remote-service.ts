import { Request, Response } from "express";
import * as path from "path";
import * as os from "os";
import * as minimatch from "minimatch";
import * as ip from "ip";

export class RemoteService implements IRemoteService {
	private appBuilderDir: string;
	private packageLocation: string;

	constructor(private $logger: ILogger,
		private $fs: IFileSystem,
		private $express: IExpress,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $domainNameSystem: IDomainNameSystem,
		private $options: IOptions,
		private $sysInfo: ISysInfo,
		private $staticConfig: IStaticConfig) {
		this.appBuilderDir = path.join(os.tmpdir(), 'AppBuilder');
		this.packageLocation = path.join(this.appBuilderDir, 'package.zip');
	}

	public async startApiServer(portNumber: number): Promise<void> {
		this.$fs.ensureDirectoryExists(this.appBuilderDir);

		this.$express.post("/launch", (req: Request, res: Response) => this.onLaunchRequest(req, res));
		let domain = (await this.$domainNameSystem.getDomains())[0];

		this.$express.listen(portNumber, () => {
			let ipAddress = ip.address();
			this.$logger.info("Listening on port " + portNumber);
			if (domain) {
				this.$logger.info("In the AppBuilder Windows client or the extension for Visual Studio, provide the connection information for this server in one of the following formats:\n" +
					" - Address: http://" + ipAddress + " Port: " + portNumber + "\n" +
					" - Address: http://" + domain + " Port: " + portNumber);
			} else {
				this.$logger.info("In the AppBuilder Windows client or the extension for Visual Studio, provide the connection information for this server in the following format:\n" +
					" - Address: http://" + ipAddress + " Port: " + portNumber);
			}
		});
		this.$express.run();
	}

	private async onLaunchRequest(req: Request, res: Response): Promise<void> {
		this.$logger.info("launch simulator request received ... ");
		// Clean the tempdir before new launch
		this.$fs.deleteDirectory(this.appBuilderDir);
		this.$fs.createDirectory(this.appBuilderDir);

		let deviceFamily = req.query.deviceFamily.toLowerCase();
		let archive = this.$fs.createWriteStream(this.packageLocation);
		archive.on('error', (err: Error) => {
			this.$logger.error('Could not save the uploaded file. ' + err);
			res.status(500).send('Could not save the uploaded file. ' + err).end();
		});

		req.pipe(archive);
		await this.$fs.futureFromEvent(archive, 'finish');

		await this.$fs.unzip(this.packageLocation, this.appBuilderDir);

		let appLocation = path.join(this.appBuilderDir, this.$fs.readDirectory(this.appBuilderDir).filter(minimatch.filter("*.app"))[0]);

		this.$iOSEmulatorServices.checkAvailability(false);
		let xcodeVersion = (await this.$sysInfo.getSysInfo(this.$staticConfig.pathToPackageJson)).xcodeVer,
			xcodeVersionMatch = xcodeVersion.match(/Xcode (.*)/),
			splittedVersion = xcodeVersionMatch && xcodeVersionMatch[1] && xcodeVersionMatch[1].split("."),
			xcodeMajorVersion = splittedVersion && splittedVersion[0],
			mappedDeviceName: string;

		if (xcodeMajorVersion) {
			mappedDeviceName = RemoteService.AppBuilderClientToSimulatorDeviceNameMapping[xcodeMajorVersion] && RemoteService.AppBuilderClientToSimulatorDeviceNameMapping[xcodeMajorVersion][deviceFamily];
		}

		mappedDeviceName = mappedDeviceName || deviceFamily;
		await this.$iOSEmulatorServices.runApplicationOnEmulator(appLocation, { deviceType: mappedDeviceName, appId: req.query.appId });

		res.status(200).end();
	}

	private static AppBuilderClientToSimulatorDeviceNameMapping: IDictionary<IStringDictionary> = {
		"6": {
			"iphoneandipod": "iPhone-4s",
			"ipad": "iPad-2"
		},
		"7": {
			"iphoneandipod": "iPhone 6",
			"ipad": "iPad 2"
		},
		"8": {
			"iphoneandipod": "iPhone 6",
			"ipad": "iPad 2"
		}
	};
}

$injector.register("remoteService", RemoteService);
