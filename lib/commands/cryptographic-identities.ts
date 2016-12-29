import * as util from "util";
import * as helpers from "../helpers";
import * as path from "path";
import moment = require("moment");
import validators = require("../validators/cryptographic-identity-validators");
import iosValidators = require("../validators/ios-deployment-validator");
import * as os from "os";
import commandParams = require("../common/command-params");

class CryptographicIdentityConstants {
	public static PKCS12_EXTENSION = "p12";
	public static X509_EXTENSION = "cer";
	public static PKCS12CERTIFICATE = "Pkcs12";
	public static X509CERTIFICATE = "X509Certificate";
	public static APPLE_INC = "Apple Inc.";
	public static MAX_ALLOWED_PASSWORD_ATTEMPTS = 3;
}

interface IFailedProvision {
	provision: IProvision;
	error: string;
}

export class CryptographicIdentityStoreService implements ICryptographicIdentityStoreService {
	constructor(private $server: Server.IServer,
		private $x509: IX509CertificateLoader) { }

	public async getAllProvisions(): Promise<IProvision[]> {
			let data = await  this.$server.mobileprovisions.getProvisions();
			return _.map(data, (identityData) => <IProvision>identityData);
	}

	public async getAllIdentities(): Promise<ICryptographicIdentity[]> {
			let data = await  this.$server.identityStore.getIdentities();
			return _.map(data, (identityData) => {
				let identity: any = identityData;
				let certificateOrganization = this.$x509.load(identity.Certificate).issuerData['O'];
				identity.isiOS = certificateOrganization === CryptographicIdentityConstants.APPLE_INC;
				return <ICryptographicIdentity>identity;
			});
	}
}
$injector.register("cryptographicIdentityStoreService", CryptographicIdentityStoreService);

export class IdentityManager implements Server.IIdentityManager {
	constructor(private $cryptographicIdentityStoreService: ICryptographicIdentityStoreService,
		private $selfSignedIdentityValidator: validators.SelfSignedIdentityValidator,
		private $logger: ILogger,
		private $errors: IErrors,
		private $x509: IX509CertificateLoader,
		private $injector: IInjector,
		private $options: IOptions) {
	}

	public async listCertificates(): Promise<void> {
			let identities = await  this.$cryptographicIdentityStoreService.getAllIdentities();
			identities = _.sortBy(identities, (identity) => identity.Alias);
			_.forEach(identities, (identity, index) => {
				let cert = this.$x509.load(identity.Certificate);
				this.$logger.out("%s: '%s', expires on %s, issued by %s", (index + 1).toString(), identity.Alias,
					cert.expiresOn.toDateString(), cert.issuerData["CN"]);
			});
			if (!identities.length) {
				this.$logger.info("No certificates found. To add a certificate, run `certificate import` " +
					"to import an existing certificate or `certificate create-self-signed` to create a new one.");
			}
	}

	private printProvisionData(provision: IProvision, provisionIndex: number): void {
		this.$logger.out("%s: '%s', type: %s, App ID: '%s.%s'", (provisionIndex + 1).toString(), provision.Name, provision.ProvisionType,
			provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier);
		if (this.$options.verbose) {
			let devices = provision.ProvisionedDevices;
			if (devices && devices.length) {
				this.$logger.out("  Provisioned device identifiers:");
				devices.sort();
				_.forEach(devices, (device, deviceIndex) => {
					this.$logger.out("    " + devices[deviceIndex]);
				});
			} else {
				this.$logger.out("  No provisioned devices.");
			}
		}
	}

	public async listProvisions(provisionStr?: string): Promise<void> {
			if (provisionStr) {
				let provision = await  this.findProvision(provisionStr);
				this.printProvisionData(provision, 0);
				return;
			}

			let provisions = await  this.$cryptographicIdentityStoreService.getAllProvisions();
			provisions = _.sortBy(provisions, (provision) => provision.Name);

			_.forEach(provisions, (provision, provisionIndex) => {
				this.printProvisionData(provision, provisionIndex);
			});

			if (!provisions.length) {
				this.$logger.info("No provisioning profiles found. To add a provisioning profile, run `provision import`.");
			}
	}

	public async findCertificate(identityStr: string): Promise<ICryptographicIdentity> {
			this.$logger.debug("Looking for certificate '%s'", identityStr);
			let identities = await  this.$cryptographicIdentityStoreService.getAllIdentities();
			let result = helpers.findByNameOrIndex(identityStr, identities, (ident) => ident.Alias);
			if (!result) {
				this.$errors.fail("Could not find certificate named '%s' or was not given " +
					"a valid index. List registered certificates with 'certificate' command.", identityStr);
			} else {
				return result;
			}
	}

	public async findProvision(provisionStr: string): Promise<IProvision> {
			this.$logger.debug("Looking for provision '%s'", provisionStr);
			let provisions = await  this.$cryptographicIdentityStoreService.getAllProvisions();
			let result = helpers.findByNameOrIndex(provisionStr, provisions, (provision) => provision.Name);

			if (!result) {
				this.$errors.fail("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'provision' command.", provisionStr);
			}

			return result;
	}

	public async autoselectProvision(appIdentifier: string, provisionTypes: string[], deviceIdentifier?: string): Promise<IProvision> {
			let provisions = await  this.$cryptographicIdentityStoreService.getAllProvisions();
			let identities = await  this.$cryptographicIdentityStoreService.getAllIdentities();

			provisions = _.filter(provisions, (prov) => _.includes(provisionTypes, prov.ProvisionType));
			if (provisions.length === 0) {
				this.$errors.fail("No provision of type %s found.", helpers.formatListOfNames(provisionTypes));
			}

			let validator = this.$injector.resolve(iosValidators.IOSDeploymentValidator,
				{ deviceIdentifier: deviceIdentifier, appIdentifier: appIdentifier });

			let passedProvisions: IProvision[] = [];
			let failedProvisions: IFailedProvision[] = [];

			_.each(provisions, (prov: IProvision) => {
				let validationResult = validator.validateProvision(prov);
				let hasCompatibleCertificate = false;
				let error = validationResult.error;
				if (validationResult.isSuccessful) {
					hasCompatibleCertificate = (await  _.some(identities, (identity: ICryptographicIdentity) => validator.validateCertificate(identity, prov)).isSuccessful);
					if (!hasCompatibleCertificate) {
						error = `Unable to find applicable certificate for provision ${prov.Name}.`;
					}
				}

				if (validationResult.isSuccessful && hasCompatibleCertificate) {
					passedProvisions.push(prov);
				} else {
					failedProvisions.push({ provision: prov, error: error });
				}
			});

			let provision = _(provisionTypes)
				.map((type) => _.find(passedProvisions, (prov) => prov.ProvisionType === type))
				.find((prov) => Boolean(prov));

			if (provision) {
				return provision;
			} else {
				let composedError = util.format("Cannot find applicable provisioning profiles. %s", os.EOL);

				let iterator = (result: string, data: IFailedProvision) => {
					let currentError = util.format('Cannot use provision "%s" because the following error occurred: %s %s',
						data.provision.Name, data.error, os.EOL);
					return result + currentError;
				};
				composedError = _.reduce(failedProvisions, iterator, composedError);

				this.$errors.fail(composedError);
			}
			return null;
	}

	public async autoselectCertificate(provisionData: IProvision): Promise<ICryptographicIdentity> {
			let identities = await  this.$cryptographicIdentityStoreService.getAllIdentities();

			let validator = this.$injector.resolve(iosValidators.IOSDeploymentValidator,
				{ deviceIdentifier: null, appIdentifier: null });

			let identity = (await  _.find(identities, (ident) => validator.validateCertificate(ident, provisionData)).isSuccessful);

			if (identity) {
				return identity;
			} else {
				this.$errors.fail("No certificate compatible with provision '%s' found.", provisionData.Name);
				return null;
			}
	}

	public isCertificateCompatibleWithProvision(certificate: ICryptographicIdentity, provision: IProvision): boolean {
		let formattedCertificate = helpers.stringReplaceAll(certificate.Certificate, /[\r\n]/, "");

		return _.some(provision.Certificates, (c: string) => formattedCertificate.indexOf(c) >= 0);
	}

	public async findReleaseCertificate(): Promise<ICryptographicIdentity> {
			let identities = await  this.$cryptographicIdentityStoreService.getAllIdentities();
			return _.find(identities, (identity: ICryptographicIdentity) => this.$selfSignedIdentityValidator.validateCertificate(true, identity.Certificate));
	}
}
$injector.register("identityManager", IdentityManager);

class IdentityGenerationDataFactory {
	private static derObjectIdentifierNames = {
		C: "2.5.4.6",
		CN: "2.5.4.3",
		EmailAddress: "1.2.840.113549.1.9.1"
	};

	public static create(identityModel: ISelfSignedIdentityModel): Server.IdentityGenerationData {
		let identityGenerationData = <Server.IdentityGenerationData>{
			StartDate: new Date(identityModel.StartDate),
			Attributes: {},
			EndDate: new Date(identityModel.EndDate),
			SubjectNameValues: IdentityGenerationDataFactory.getDistinguishedNameValues(
				identityModel.Name, identityModel.Email, identityModel.Country)
		};
		return identityGenerationData;
	}

	public static getDistinguishedNameValues(name: string, email: string, countryCode: string): any {
		let distinguishedNameValues: IStringDictionary = Object.create(null);
		distinguishedNameValues[IdentityGenerationDataFactory.derObjectIdentifierNames.CN] = name;
		distinguishedNameValues[IdentityGenerationDataFactory.derObjectIdentifierNames.EmailAddress] = email;
		distinguishedNameValues[IdentityGenerationDataFactory.derObjectIdentifierNames.C] = countryCode;
		return distinguishedNameValues;
	}
}

export interface IIdentityInformation {
	Name?: string;
	Email?: string;
	Country?: string;
}

export interface IIdentityInformationGatherer {
	gatherIdentityInformation(defaults: IIdentityInformation): IFuture<IIdentityInformation>;
}

class IdentityInformationGatherer implements IIdentityInformationGatherer {
	constructor(
		private $selfSignedIdentityValidator: IValidator<ISelfSignedIdentityModel>,
		private $userDataStore: IUserDataStore,
		private $prompter: IPrompter,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger) { }

	gatherIdentityInformation(model: IIdentityInformation): IFuture<IIdentityInformation> {
		return (() => {
			let myCountry = model.Country;
			if (!myCountry) {
				this.$logger.trace("Find default country with call to http://freegeoip.net/json/");
				myCountry = await  this.getDefaultCountry();
			}

			let user = await  this.$userDataStore.getUser();
			let schema: any = [];

			if (!model.Name) {
				schema.push({
					type: "input",
					name: "Name",
					message: "Name",
					default: () => user.name
				});
			}

			if (!model.Email) {
				schema.push({
					type: "input",
					name: "Email",
					message: "Email",
					default: () => user.email,
					validate: (value: string) => {
						let validationResult = this.$selfSignedIdentityValidator.validateProperty(<ISelfSignedIdentityModel>{ Email: value }, "Email");
						return validationResult.isSuccessful ? true : validationResult.error;
					}
				});
			}

			if (!model.Country) {
				schema.push({
					type: "input",
					name: "Country",
					message: "Country",
					default: () => myCountry,
					validate: (value: string) => {
						let validationResult = this.$selfSignedIdentityValidator.validateProperty(<ISelfSignedIdentityModel>{ Country: value }, "Country");
						let message = [validationResult.error, "Valid countries are:"];
						message.push(helpers.formatListForDisplayInMultipleColumns(helpers.getCountries()));
						return validationResult.isSuccessful ? true : message.join("\n");
					}
				});
			}

			return schema.length ? await this.$prompter.get(schema) : {};

		}).future<IIdentityInformation>()();
	}

	private async getDefaultCountry(): Promise<string> {
			try {
				let locationResponse: Server.IResponse = await  this.$httpClient.httpRequest("http://freegeoip.net/json/");
				let location: any = JSON.parse(locationResponse.body);
				return location.country_name;
			} catch (err) {
				return "";
			}
	}
}
$injector.register("identityInformationGatherer", IdentityInformationGatherer);

export class CreateSelfSignedIdentity implements ICommand {
	private model: any;

	constructor(private $server: Server.IServer,
		private $identityInformationGatherer: IIdentityInformationGatherer,
		private $selfSignedIdentityValidator: IValidator<ISelfSignedIdentityModel>,
		private $prompter: IPrompter,
		private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			let type = args[3];
			if (type && type.toLowerCase() !== "generic" && type.toLowerCase() !== "googleplay") {
				this.$errors.fail("Certificate type must be either 'Generic' or 'GooglePlay'");
			}

			let identityInfo: IIdentityInformation = {
				Name: args[0],
				Email: args[1],
				Country: args[2]
			};
			this.model = identityInfo;

			identityInfo = await  this.$identityInformationGatherer.gatherIdentityInformation(identityInfo);

			this.model.ForGooglePlayPublishing = args[3] ? (args[3].toLowerCase() === "googleplay" ? "y" : "n") : undefined;
			this.model.StartDate = args[4];
			this.model.EndDate = args[5];

			let promptSchema = this.getPromptSchema(this.model);

			if (promptSchema.length > 0) {
				this.model = await  this.$prompter.get(promptSchema);
				_.extend(this.model, identityInfo);
			}

			let endDate = this.model.EndDate;
			if (!endDate) {
				endDate = this.$prompter.get([{
					message: "Valid until (yyyy-mm-dd)",
					type: "input",
					name: "EndDate",
					default: () => this.getDefaultEndDate(this.isForGooglePlay()),
					validate: (value: string) => {
						let validationResult = this.$selfSignedIdentityValidator.
							validateProperty(<ISelfSignedIdentityModel>{
								ForGooglePlayPublishing: this.isForGooglePlay().toString(),
								StartDate: this.model["StartDate"] || this.getHistoryValue("StartDate"),
								EndDate: value
							}, "EndDate");

						return validationResult.isSuccessful ? true : validationResult.error;
					}
				await }]);
				_.extend(this.model, endDate);
			}

			let identityGenerationData = IdentityGenerationDataFactory.create(this.model);
			let result = await  this.$server.identityStore.generateSelfSignedIdentity(identityGenerationData);
			this.$logger.info("Successfully created certificate '%s'.", result.Alias);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	private getPromptSchema(defaults: any): IPromptSchema[] {
		let promptSchema: any = [];
		if (!defaults.ForGooglePlayPublishing) {
			promptSchema.push({
				message: "Is for Google Play publishing?",
				type: "confirm",
				name: "ForGooglePlayPublishing",
				default: () => false
			});
		}

		if (!defaults.StartDate) {
			promptSchema.push({
				message: "Valid from (yyyy-mm-dd)",
				type: "input",
				name: "StartDate",
				default: () => moment(new Date()).format(validators.SelfSignedIdentityValidator.DATE_FORMAT),
				validate: (value: string) => {
					let validationResult = this.$selfSignedIdentityValidator.validateProperty(<ISelfSignedIdentityModel>{ StartDate: value }, "StartDate");
					return validationResult.isSuccessful ? true : validationResult.error;
				}
			});
		}

		return promptSchema;
	}

	private isForGooglePlay(): boolean {
		return this.getHistoryValue("ForGooglePlayPublishing");
	}

	private getHistoryValue(name: string): any {
		return this.model[name];
	}

	private getDefaultEndDate(forGooglePlayPublishing: boolean): string {
		if (forGooglePlayPublishing) {
			return moment(validators.SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE)
				.format(validators.SelfSignedIdentityValidator.DATE_FORMAT);
		}
		return moment().add("years", 1).format(validators.SelfSignedIdentityValidator.DATE_FORMAT);
	}
}
$injector.registerCommand("certificate|create-self-signed", CreateSelfSignedIdentity);

export class ListCertificatesCommand implements ICommand {
	constructor(private $identityManager: Server.IIdentityManager) { }
	execute(args: string[]): IFuture<void> {
		return this.$identityManager.listCertificates();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("certificate|*list", ListCertificatesCommand);

export class RemoveCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $prompter: IPrompter,
		private $options: IOptions,
		private $identityManager: Server.IIdentityManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate name or index.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let nameOrIndex = args[0];
			let identity = await  this.$identityManager.findCertificate(nameOrIndex);

			if (this.$options.force || await  this.$prompter.confirm(util.format("Are you sure you want to delete certificate '%s'?", identity.Alias), () => false)) {
				await this.$server.identityStore.removeIdentity(identity.Alias);
			}
		}).future<void>()();
	}
}
$injector.registerCommand("certificate|remove", RemoveCryptographicIdentity);

export class ExportCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $identityManager: Server.IIdentityManager,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $errors: IErrors,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $injector: IInjector,
		private $options: IOptions) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate name or index."),
		new commandParams.StringCommandParameter(this.$injector)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let nameOrIndex = args[0];
			let password = args[1];

			let identity = await  this.$identityManager.findCertificate(nameOrIndex);
			let name = identity.Alias;
			let sanitizedName = helpers.stringReplaceAll(name, /[^\w|\d|\s|\-|_|\(|\)|]/, "");

			if (sanitizedName.length === 0) {
				sanitizedName = "exported_certificate";
				this.$logger.warn("Certificate name contains only invalid characters: Defaulting to %s!", sanitizedName);
			} else {
				sanitizedName = (sanitizedName + "_certificate").trim();
			}

			let targetFileName = path.join(this.getPath(), util.format("%s.%s", sanitizedName,
				CryptographicIdentityConstants.PKCS12_EXTENSION));

			if (this.$fs.exists(targetFileName)) {
				this.$errors.fail("The target file '%s' already exists.", targetFileName);
			}

			if (!password) {
				password = await  this.$prompter.getPassword("Exported file password");
			}

			let targetFile = this.$fs.createWriteStream(targetFileName);

			this.$logger.info("Exporting certificate to file '%s'.", targetFileName);
			await this.$server.identityStore.getIdentity(name, password, targetFile);
		}).future<void>()();
	}

	private getPath(): string {
		let path: string = this.$options.path;
		delete this.$options.path;

		if (!path) {
			path = process.cwd();
		} else if (!this.$fs.exists(path)) {
			this.$errors.fail("The path '%s' does not exist.", path);
		}
		return path;
	}
}
$injector.registerCommand("certificate|export", ExportCryptographicIdentity);

export class ImportCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $fs: IFileSystem,
		private $prompter: IPrompter,
		private $logger: ILogger,
		private $errors: IErrors,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $injector: IInjector) {
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("No certificate file specified."),
		new commandParams.StringCommandParameter(this.$injector)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let certificateFile = args[0],
				password = args[1],
				extension = path.extname(certificateFile).toLowerCase();

			if (extension !== ".p12" && extension !== ".cer") {
				this.$errors.fail("To add a cryptographic identity to the list, import a P12 file " +
					"that contains an existing cryptographic identity or a CER file that contains the " +
					"certificate generated from a certificate signing request.");
			}

			let importType = extension === ".p12" ? CryptographicIdentityConstants.PKCS12CERTIFICATE : CryptographicIdentityConstants.X509CERTIFICATE;

			if (!this.$fs.exists(certificateFile)) {
				this.$errors.fail("The file '%s' does not exist.", certificateFile);
			}

			let result = importType === CryptographicIdentityConstants.PKCS12CERTIFICATE ?
				await this.importCertificateWithPassword(importType, password, certificateFile) :
				await this.importCertificateWithoutPassword(importType, certificateFile);

			_.each(result, identity => {
				this.$logger.info("Imported certificate '%s'.", identity.Alias);
			});
		}).future<void>()();
	}

	private async importCertificateWithPassword(importType: string, password: string, certificateFile: string): Promise<Server.CryptographicIdentityData[]> {
			let result: Server.CryptographicIdentityData[],
				targetFile: any,
				noErrorOccurred: boolean,
				isPasswordRequired = !password;

			for (let i = 0; i < CryptographicIdentityConstants.MAX_ALLOWED_PASSWORD_ATTEMPTS; ++i) {
				noErrorOccurred = true;
				targetFile = this.$fs.createReadStream(certificateFile);
				if (isPasswordRequired) {
					password = await  this.$prompter.getPassword("Certificate file password", { allowEmpty: true });
				}

				try {
					result = await  this.$server.identityStore.importIdentity(<any>importType, password, targetFile);
				} catch (err) {
					noErrorOccurred = false;
					isPasswordRequired = true;
					this.$logger.error(err.message + os.EOL + "Verify that you have provided the correct file and password and try again.");
				}

				if (noErrorOccurred) {
					break;
				}
			}

			if (!noErrorOccurred) {
				this.$errors.failWithoutHelp("You have reached the maximum number of authentication attempts for this operation.");
			}

			return result;
	}

	private async importCertificateWithoutPassword(importType: string, certificateFile: string): Promise<Server.CryptographicIdentityData[]> {
			try {
				let targetFile = this.$fs.createReadStream(certificateFile);
				return await this.$server.identityStore.importIdentity(<any>importType, '', targetFile);
			} catch (error) {
				this.$errors.failWithoutHelp(error.message);
			}
	}
}
$injector.registerCommand("certificate|import", ImportCryptographicIdentity);

class CreateCertificateSigningRequest implements ICommand {
	constructor(private $server: Server.IServer,
		private $injector: IInjector,
		private $identityInformationGatherer: IIdentityInformationGatherer) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let model: IIdentityInformation = {
				Name: args[0],
				Email: args[1],
				Country: args[2]
			};

			model = await  this.$identityInformationGatherer.gatherIdentityInformation(model);

			let subjectNameValues = IdentityGenerationDataFactory.getDistinguishedNameValues(
				model.Name, model.Email, model.Country);
			let certificateData: ICertificateSigningRequest = await  this.$server.identityStore.generateCertificationRequest(subjectNameValues);

			let downloader: ICertificateDownloader = this.$injector.resolve(DownloadCertificateSigningRequestCommand);
			await downloader.downloadCertificate(certificateData.UniqueName);
		}).future<void>()();
	}
}
$injector.registerCommand("certificate-request|create", CreateCertificateSigningRequest);

class ListCertificateSigningRequestsCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $server: Server.IServer) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let requests: any[] = await  this.$server.identityStore.getCertificateRequests();
			requests = _.sortBy(requests, (req) => req.UniqueName);
			_.forEach(requests, (req, i, list) => {
				this.$logger.out("%s: %s", (i + 1).toString(), req.Subject);
			});
			if (!requests.length) {
				this.$logger.info("No certificate signing requests.");
			}
		}).future<void>()();
	}
}
$injector.registerCommand("certificate-request|*list", ListCertificateSigningRequestsCommand);

interface ICertificateSigningRequest {
	UniqueName: string;
	Subject: string;
}

async function parseCertificateIndex(indexStr: string, $errors: IErrors, $server: Server.IServer): Promise<ICertificateSigningRequest> {
		let requests: ICertificateSigningRequest[] = await  $server.identityStore.getCertificateRequests();
		requests = _.sortBy(requests, (req) => req.UniqueName);

		let index = parseInt(indexStr, 10) - 1;
		if (index < 0 || index >= requests.length) {
			$errors.fail("No certificate with number '%s' exists", indexStr);
		}
		let req = requests[index];
		return req;
}

class RemoveCertificateSigningRequestCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector,
		private $prompter: IPrompter,
		private $server: Server.IServer,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate signing request index to delete.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let indexStr = args[0];

			let req = await  this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr });

			if (await this.$prompter.confirm(util.format("Are you sure that you want to delete certificate request '%s'?", req.Subject))) {
				await this.$server.identityStore.removeCertificateRequest(req.UniqueName);
				this.$logger.info("Removed certificate request '%s'", req.Subject);
			}
		}).future<void>()();
	}
}
$injector.registerCommand("certificate-request|remove", RemoveCertificateSigningRequestCommand);

interface ICertificateDownloader {
	downloadCertificate(uniqueName: string): IFuture<void>;
}

class DownloadCertificateSigningRequestCommand implements ICommand, ICertificateDownloader {
	constructor(private $logger: ILogger,
		private $injector: IInjector,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $server: Server.IServer,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $options: IOptions) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate signing request index to delete.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let indexStr = args[0];
			if (!indexStr) {
				this.$errors.fail("Specify certificate signing request index to download.");
			}

			let req = await  this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr });
			await this.downloadCertificate(req.UniqueName);
		}).future<void>()();
	}

	public async downloadCertificate(uniqueName: string): Promise<void> {
			let targetFileName = this.$options.saveTo;
			if (targetFileName) {
				if (this.$fs.exists(targetFileName)) {
					this.$errors.fail("The output file already exists.");
				}
			} else {
				targetFileName = this.$fs.getUniqueFileName("certificate_request.csr");
			}

			let targetFile = this.$fs.createWriteStream(targetFileName);
			this.$logger.info("Writing certificate signing request to %s", path.resolve(targetFileName));
			await this.$server.identityStore.getCertificateRequest(uniqueName, targetFile);
	}
}
$injector.registerCommand("certificate-request|download", DownloadCertificateSigningRequestCommand);

class FileNameCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			let fileName = validationValue;
			if (!fileName) {
				this.$errors.fail("No file specified.");
			}

			if (!this.$fs.exists(fileName)) {
				this.$errors.fail({ formatStr: "File '%s' does not exist.", suppressCommandHelp: true }, fileName);
			}

			return true;
		}).future<boolean>()();
	}
}

export class ListProvisionsCommand implements ICommand {
	constructor(private $identityManager: Server.IIdentityManager,
		private $stringParameter: ICommandParameter) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			await this.$identityManager.listProvisions(args[0]);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameter];
}
$injector.registerCommand("provision|*list", ListProvisionsCommand);

class ImportProvisionCommand implements ICommand {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $errors: IErrors,
		private $server: Server.IServer,
		private $commandsService: ICommandsService) { }

	allowedParameters: ICommandParameter[] = [new FileNameCommandParameter(this.$errors, this.$fs)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let fileName = args[0];
			if (!fileName) {
				this.$errors.fail("No file specified.");
			}

			if (!this.$fs.exists(fileName)) {
				this.$errors.fail({ formatStr: "File '%s' does not exist.", suppressCommandHelp: true }, fileName);
			}

			let provisionFile = this.$fs.createReadStream(fileName);
			let provisionData = await  this.$server.mobileprovisions.importProvision(provisionFile);
			this.$logger.info("Successfully imported provision '%s'.", provisionData.Name);

			await this.$commandsService.tryExecuteCommand("provision", []);
		}).future<void>()();
	}
}
$injector.registerCommand("provision|import", ImportProvisionCommand);

class ProvisionIdCommandParameter implements ICommandParameter {
	constructor(private $identityManager: Server.IIdentityManager) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			await this.$identityManager.findProvision(validationValue);
			return true;
		}).future<boolean>()();
	}
}

class RemoveProvisionCommand implements ICommand {
	constructor(private $identityManager: Server.IIdentityManager,
		private $logger: ILogger,
		private $server: Server.IServer,
		private $commandsService: ICommandsService) { }

	allowedParameters: ICommandParameter[] = [new ProvisionIdCommandParameter(this.$identityManager)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let provisionData = await  this.$identityManager.findProvision(args[0]);
			await this.$server.mobileprovisions.removeProvision(provisionData.Identifier);
			this.$logger.info("Removed provisioning profile '%s'.", provisionData.Name);

			await this.$commandsService.tryExecuteCommand("provision", []);
		}).future<void>()();
	}
}
$injector.registerCommand("provision|remove", RemoveProvisionCommand);
