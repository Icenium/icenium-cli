///<reference path="../.d.ts"/>
"use strict";

let options: any = require("../common/options");
import Future = require("fibers/future");
import util = require("util");
import helpers = require("../helpers");
import path = require("path");
import moment = require("moment");
import validators = require("../validators/cryptographic-identity-validators");
import iosValidators = require("../validators/ios-deployment-validator");
import os = require("os");
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
	error: string
}

export class CryptographicIdentityStoreService implements ICryptographicIdentityStoreService {
	constructor(private $server: Server.IServer,
		private $x509: IX509CertificateLoader) { }

	public getAllProvisions(): IFuture<IProvision[]> {
		return (() => {
			let data = this.$server.mobileprovisions.getProvisions().wait();
			return _.map(data, (identityData) => <IProvision>identityData);
		}).future<IProvision[]>()();
	}

	public getAllIdentities(): IFuture<ICryptographicIdentity[]> {
		return (() => {
			let data = this.$server.identityStore.getIdentities().wait();
			return _.map(data, (identityData) => {
				let identity: any = identityData;
				let certificateOrganization = this.$x509.load(identity.Certificate).issuerData['O'];
				identity.isiOS = certificateOrganization === CryptographicIdentityConstants.APPLE_INC;
				return <ICryptographicIdentity>identity;
			});
		}).future<ICryptographicIdentity[]>()();
	}
}
$injector.register("cryptographicIdentityStoreService", CryptographicIdentityStoreService);

export class IdentityManager implements Server.IIdentityManager {
	constructor(private $cryptographicIdentityStoreService: ICryptographicIdentityStoreService,
		private $selfSignedIdentityValidator: validators.SelfSignedIdentityValidator,
		private $logger: ILogger,
		private $errors: IErrors,
		private $x509: IX509CertificateLoader,
		private $injector: IInjector) {
	}

	public listCertificates(): IFuture<void> {
		return ((): any => {
			let identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			identities = _.sortBy(identities, (identity) => identity.Alias);
			_.forEach(identities, (identity, index) => {
				let cert = this.$x509.load(identity.Certificate);
				this.$logger.out("%s: '%s', expires on %s, issued by %s", (index + 1).toString(), identity.Alias,
					cert.expiresOn.toDateString(), cert.issuerData["CN"]);
			});
			if(!identities.length) {
				this.$logger.info("No certificates found. To add a certificate, run `certificate import` " +
					"to import an existing certificate or `certificate create-self-signed` to create a new one.");
			}
		}).future<void>()();
	}

	private printProvisionData(provision: IProvision, provisionIndex: number): void {
		this.$logger.out("%s: '%s', type: %s, App ID: '%s.%s'", (provisionIndex + 1).toString(), provision.Name, provision.ProvisionType,
			provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier);
		if (options.verbose || options.v) {
			let devices = provision.ProvisionedDevices;
			if(devices && devices.length) {
				this.$logger.out("  Provisioned device identifiers:");
				devices.sort();
				_.forEach(devices, (device, deviceIndex) => {
					this.$logger.out("    " + devices[deviceIndex])
				});
			} else {
				this.$logger.out("  No provisioned devices.");
			}
		}
	}

	public listProvisions(provisionStr?: string): IFuture<void> {
		return (() => {
			if(provisionStr) {
				let provision = this.findProvision(provisionStr).wait();
				this.printProvisionData(provision, 0);
				return;
			}

			let provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			provisions = _.sortBy(provisions, (provision) => provision.Name);

			_.forEach(provisions, (provision, provisionIndex) => {
				this.printProvisionData(provision, provisionIndex);
			});

			if(!provisions.length) {
				this.$logger.info("No provisioning profiles found. To add a provisioning profile, run `provision import`.");
			}
		}).future<void>()();
	}

	public findCertificate(identityStr: string): IFuture<ICryptographicIdentity> {
		return ((): any => {
			this.$logger.debug("Looking for certificate '%s'", identityStr);
			let identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			let result = helpers.findByNameOrIndex(identityStr, identities, (ident) => ident.Alias);
			if(!result) {
				this.$errors.fail("Could not find certificate named '%s' or was not given " +
					"a valid index. List registered certificates with 'certificate' command.", identityStr);
			} else {
				return result;
			}
		}).future<any>()();
	}

	public findProvision(provisionStr: string): IFuture<IProvision> {
		return ((): any => {
			this.$logger.debug("Looking for provision '%s'", provisionStr);
			let provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			let result = helpers.findByNameOrIndex(provisionStr, provisions, (provision) => provision.Name);

			if(!result) {
				this.$errors.fail("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'provision' command.", provisionStr);
			}

			return result;

		}).future<any>()();
	}

	public autoselectProvision(appIdentifier: string, provisionTypes: string[], deviceIdentifier?: string): IFuture<IProvision> {
		return ((): IProvision => {
			let provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			let identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();

			provisions = _.filter(provisions, (prov) => _.contains(provisionTypes, prov.ProvisionType));
			if(provisions.length === 0) {
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
				if(validationResult.isSuccessful) {
					hasCompatibleCertificate = _.any(identities, identity => validator.validateCertificate(identity, prov).wait().isSuccessful);
					if(!hasCompatibleCertificate) {
						error = `Unable to find applicable certificate for provision ${prov.Name}.`;
					}
				}

				if(validationResult.isSuccessful && hasCompatibleCertificate) {
					passedProvisions.push(prov);
				} else {
					failedProvisions.push({ provision: prov, error: error });
				}
			});

			let provision = _(provisionTypes)
				.map((type) => _.find(passedProvisions, (prov) => prov.ProvisionType === type))
				.find((prov) => Boolean(prov));

			if(provision) {
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
		}).future<IProvision>()();
	}

	public autoselectCertificate(provisionData: IProvision): IFuture<ICryptographicIdentity> {
		return ((): ICryptographicIdentity => {
			let identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();

			let validator = this.$injector.resolve(iosValidators.IOSDeploymentValidator,
				{ deviceIdentifier: null, appIdentifier: null });

			let identity = _.find(identities, (ident) => validator.validateCertificate(ident, provisionData).wait().isSuccessful);

			if(identity) {
				return identity;
			} else {
				this.$errors.fail("No certificate compatible with provision '%s' found.", provisionData.Name);
				return null;
			}
		}).future<ICryptographicIdentity>()();
	}

	public isCertificateCompatibleWithProvision(certificate: ICryptographicIdentity, provision: IProvision): boolean {
		let formattedCertificate = helpers.stringReplaceAll(certificate.Certificate, /[\r\n]/, "");

		return _.some(provision.Certificates, (c: string) => formattedCertificate.indexOf(c) >= 0);
	}

	public findReleaseCertificate(): IFuture<ICryptographicIdentity> {
		return (() => {
			let identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			return _.find(identities, (identity: ICryptographicIdentity) => this.$selfSignedIdentityValidator.validateCertificate(true, identity.Certificate));
		}).future<ICryptographicIdentity>()();
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
		let identityGenerationData = <Server.IdentityGenerationData> {
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
			if(!myCountry) {
				this.$logger.trace("Find default country with call to http://freegeoip.net/json/");
				myCountry = this.getDefaultCountry().wait();
			}

			let user = this.$userDataStore.getUser().wait();
			let schema: any = [];

			if(!model.Name) {
				schema.push({
						type: "input",
						name: "Name",
						message: "Name",
						default: () => user.name
				});
			}

			if(!model.Email) {
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

			if(!model.Country) {
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

			return this.$prompter.get(schema).wait();

		}).future<IIdentityInformation>()();
	}

	private getDefaultCountry(): IFuture<string> {
		return (() => {
			try {
				let locationResponse:Server.IResponse = this.$httpClient.httpRequest("http://freegeoip.net/json/").wait();
				let location:any = JSON.parse(locationResponse.body);
				return location.country_name;
			} catch(err) {
				return "";
			}
		}).future<string>()();
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
			if(type && type.toLowerCase() !== "generic" && type.toLowerCase() !== "googleplay") {
				this.$errors.fail("Certificate type must be either 'Generic' or 'GooglePlay'");
			}

			let identityInfo: IIdentityInformation = {
				Name: args[0],
				Email: args[1],
				Country: args[2]
			};
			this.model = identityInfo;

			identityInfo = this.$identityInformationGatherer.gatherIdentityInformation(identityInfo).wait();

			this.model.ForGooglePlayPublishing = args[3] ? (args[3].toLowerCase() === "googleplay" ? "y" : "n") : undefined;
			this.model.StartDate = args[4];
			this.model.EndDate = args[5];

			let promptSchema = this.getPromptSchema(this.model);

			if(promptSchema.length > 0) {
				this.model = this.$prompter.get(promptSchema).wait();
				_.extend(this.model, identityInfo);
			}

			let endDate = this.model.EndDate;
			if(!endDate) {
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
				}]).wait();
				_.extend(this.model, endDate);
			}

			let identityGenerationData = IdentityGenerationDataFactory.create(this.model);
			let result = this.$server.identityStore.generateSelfSignedIdentity(identityGenerationData).wait();
			this.$logger.info("Successfully created certificate '%s'.", result.Alias);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector),
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	private getPromptSchema(defaults: any): IPromptSchema[] {
		let promptSchema: any = [];
		if(!defaults.ForGooglePlayPublishing) {
			promptSchema.push({
					message: "Is for Google Play publishing?",
					type: "confirm",
					name: "ForGooglePlayPublishing",
					default: () => false
				});
		}

		if(!defaults.StartDate) {
			promptSchema.push({
					message: "Valid from (yyyy-mm-dd)",
					type: "input",
					name: "StartDate",
					default: () => moment(new Date()).format(validators.SelfSignedIdentityValidator.DATE_FORMAT),
					validate: (value:string) => {
						let validationResult = this.$selfSignedIdentityValidator.validateProperty(<ISelfSignedIdentityModel>{StartDate: value}, "StartDate");
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
		if(forGooglePlayPublishing) {
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
		private $identityManager: Server.IIdentityManager,
		private $stringParameterBuilder : IStringParameterBuilder) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate name or index.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let nameOrIndex = args[0];
			let identity = this.$identityManager.findCertificate(nameOrIndex).wait();

			if(this.$prompter.confirm(util.format("Are you sure you want to delete certificate '%s'?", identity.Alias), () => false).wait()) {
				this.$server.identityStore.removeIdentity(identity.Alias).wait();
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
		private $injector: IInjector) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate name or index."),
		new commandParams.StringCommandParameter(this.$injector)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let nameOrIndex = args[0];
			let password = args[1];

			let identity = this.$identityManager.findCertificate(nameOrIndex).wait();
			let name = identity.Alias;
			let sanitizedName = helpers.stringReplaceAll(name, /[^\w|\d|\s|\-|_|\(|\)|]/, "");

			if(sanitizedName.length == 0) {
				sanitizedName = "exported_certificate";
				this.$logger.warn("Certificate name contains only invalid characters: Defaulting to %s!", sanitizedName);
			} else {
				sanitizedName = (sanitizedName + "_certificate").trim();
			}

			let targetFileName = path.join(this.getPath(), util.format("%s.%s", sanitizedName,
				CryptographicIdentityConstants.PKCS12_EXTENSION));

			if(this.$fs.exists(targetFileName).wait()) {
				this.$errors.fail("The target file '%s' already exists.", targetFileName);
			}

			if(!password) {
				password = this.$prompter.getPassword("Exported file password").wait();
			}

			let targetFile = this.$fs.createWriteStream(targetFileName);

			this.$logger.info("Exporting certificate to file '%s'.", targetFileName);
			this.$server.identityStore.getIdentity(name, password, targetFile).wait();
		}).future<void>()();
	}

	private getPath(): string {
		let path: string = options.path;
		delete options.path;

		if(!path) {
			path = process.cwd();
		} else if(!this.$fs.exists(path).wait()) {
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
			let certificateFile = args[0];
			let password = args[1];
			let isPasswordRequired = false;

			let extension = path.extname(certificateFile).toLowerCase();
			if(extension !== ".p12" && extension !== ".cer") {
				this.$errors.fail("To add a cryptographic identity to the list, import a P12 file " +
					"that contains an existing cryptographic identity or a CER file that contains the " +
					"certificate generated from a certificate signing request.")
			}
			let importType = extension === ".p12" ? CryptographicIdentityConstants.PKCS12CERTIFICATE : CryptographicIdentityConstants.X509CERTIFICATE;

			if(!this.$fs.exists(certificateFile).wait()) {
				this.$errors.fail("The file '%s' does not exist.", certificateFile);
			}

			if(!password && importType === CryptographicIdentityConstants.PKCS12CERTIFICATE) {
				isPasswordRequired = true;
			}

			let targetFile : any;
			let result : Server.CryptographicIdentityData[];
			let noErrorOccurred : boolean;

			for (let i = 0; i < CryptographicIdentityConstants.MAX_ALLOWED_PASSWORD_ATTEMPTS; ++i) {
				noErrorOccurred = true;
				targetFile = this.$fs.createReadStream(certificateFile);
				if (isPasswordRequired) {
					password = this.$prompter.getPassword("Certificate file password", { allowEmpty: true }).wait();
				}

				try {
					result = this.$server.identityStore.importIdentity(<any>importType, password, targetFile).wait();
				} catch(err) {
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

			_.each(result, identity => {
				this.$logger.info("Imported certificate '%s'.", identity.Alias);
			});
		}).future<void>()();
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

			model = this.$identityInformationGatherer.gatherIdentityInformation(model).wait();

			let subjectNameValues = IdentityGenerationDataFactory.getDistinguishedNameValues(
				model.Name, model.Email, model.Country);
			let certificateData: ICertificateSigningRequest = this.$server.identityStore.generateCertificationRequest(subjectNameValues).wait();

			let downloader: ICertificateDownloader = this.$injector.resolve(DownloadCertificateSigningRequestCommand);
			downloader.downloadCertificate(certificateData.UniqueName).wait();
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
			let requests: any[] = this.$server.identityStore.getCertificateRequests().wait();
			requests = _.sortBy(requests, (req) => req.UniqueName);
			_.forEach(requests, (req, i, list) => {
				this.$logger.out("%s: %s", (i + 1).toString(), req.Subject);
			});
			if(!requests.length) {
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

function parseCertificateIndex(indexStr: string, $errors: IErrors, $server: Server.IServer): IFuture<ICertificateSigningRequest> {
	return ((): ICertificateSigningRequest => {
		let requests: ICertificateSigningRequest[] = $server.identityStore.getCertificateRequests().wait();
		requests = _.sortBy(requests, (req) => req.UniqueName);

		let index = parseInt(indexStr, 10) - 1;
		if(index < 0 || index >= requests.length) {
			$errors.fail("No certificate with number '%s' exists", indexStr);
		}
		let req = requests[index];
		return req;
	}).future<ICertificateSigningRequest>()();
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

			let req = this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr }).wait();

			if(this.$prompter.confirm(util.format("Are you sure that you want to delete certificate request '%s'?", req.Subject)).wait()) {
				this.$server.identityStore.removeCertificateRequest(req.UniqueName).wait();
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
		private $stringParameterBuilder: IStringParameterBuilder) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify certificate signing request index to delete.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let indexStr = args[0];
			if(!indexStr) {
				this.$errors.fail("Specify certificate signing request index to download.");
			}

			let req = this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr }).wait();
			this.downloadCertificate(req.UniqueName).wait();
		}).future<void>()();
	}

	public downloadCertificate(uniqueName: string): IFuture<void> {
		return ((): void => {
			let targetFileName = options["save-to"];
			if(targetFileName) {
				if(this.$fs.exists(targetFileName).wait()) {
					this.$errors.fail("The output file already exists.");
				}
			} else {
				targetFileName = this.$fs.getUniqueFileName("certificate_request.csr").wait();
			}

			let targetFile = this.$fs.createWriteStream(targetFileName);
			this.$logger.info("Writing certificate signing request to %s", path.resolve(targetFileName));
			this.$server.identityStore.getCertificateRequest(uniqueName, targetFile).wait();
		}).future<void>()();
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
			if(!fileName) {
				this.$errors.fail("No file specified.");
			}

			if(!this.$fs.exists(fileName).wait()) {
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
			this.$identityManager.listProvisions(args[0]).wait();
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
			if(!fileName) {
				this.$errors.fail("No file specified.");
			}

			if(!this.$fs.exists(fileName).wait()) {
				this.$errors.fail({ formatStr: "File '%s' does not exist.", suppressCommandHelp: true }, fileName);
			}

			let provisionFile = this.$fs.createReadStream(fileName);
			let provisionData = this.$server.mobileprovisions.importProvision(provisionFile).wait();
			this.$logger.info("Successfully imported provision '%s'.", provisionData.Name);

			this.$commandsService.tryExecuteCommand("provision", []).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("provision|import", ImportProvisionCommand);

class ProvisionIdCommandParameter implements ICommandParameter {
	constructor(private $identityManager: Server.IIdentityManager) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			this.$identityManager.findProvision(validationValue).wait();
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
			let provisionData = this.$identityManager.findProvision(args[0]).wait();
			this.$server.mobileprovisions.removeProvision(provisionData.Identifier).wait();
			this.$logger.info("Removed provisioning profile '%s'.", provisionData.Name);

			this.$commandsService.tryExecuteCommand("provision", []).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("provision|remove", RemoveProvisionCommand);
