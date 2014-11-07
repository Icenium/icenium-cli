///<reference path="../.d.ts"/>
"use strict";

var options: any = require("../options");
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
	public static PKCS12_TYPE = "Pkcs12";
	public static PKCS12_EXTENSION = "p12";
	public static X509_TYPE = "X509Certificate";
	public static X509_EXTENSION = "cer";
	public static ExtensionToTypeMap: IStringDictionary = {
		".p12": CryptographicIdentityConstants.PKCS12_TYPE,
		".cer": CryptographicIdentityConstants.X509_TYPE
	};
}

interface IFailedProvision {
	provision: IProvision;
	error: string
}

export class CryptographicIdentityStoreService implements ICryptographicIdentityStoreService {
	constructor(private $server: Server.IServer) { }

	public getAllProvisions(): IFuture<IProvision[]> {
		return (() => {
			var data = this.$server.mobileprovisions.getProvisions().wait();
			return _.map(data, (identityData) => <IProvision>identityData);
		}).future<IProvision[]>()();
	}

	public getAllIdentities(): IFuture<ICryptographicIdentity[]> {
		return (() => {
			var data = this.$server.identityStore.getIdentities().wait();
			return _.map(data, (identityData) => {
				var identity: any = identityData;
				identity.Type = identity.$type;
				delete identity.$type;
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
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			identities = _.sortBy(identities, (identity) => identity.Alias);
			_.forEach(identities, (identity, index) => {
				var cert = this.$x509.load(identity.Certificate);
				this.$logger.out("#%d: '%s', expires on %s, issued by %s", (index + 1).toString(), identity.Alias,
					cert.expiresOn.toDateString(), cert.issuerData["CN"]);
			});
			if(!identities.length) {
				this.$logger.info("No certificates found. To add a certificate, run `certificate import` " +
					"to import an existing certificate or `certificate create-self-signed` to create a new one.");
			}
		}).future<void>()();
	}

	private printProvisionData(provision: IProvision, provisionIndex: number): void {
		this.$logger.out("#%d: '%s', type: %s, App ID: '%s.%s'", (provisionIndex + 1).toString(), provision.Name, provision.ProvisionType,
			provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier);
		if (options.verbose || options.v) {
			var devices = provision.ProvisionedDevices;
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
				var provision = this.findProvision(provisionStr).wait();
				this.printProvisionData(provision, 0);
				return;
			}

			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
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
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();

			var result = helpers.findByNameOrIndex(identityStr, identities, (ident) => ident.Alias);
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
			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			var result = helpers.findByNameOrIndex(provisionStr, provisions, (provision) => provision.Name);

			if(!result) {
				this.$errors.fail("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'provision' command.", provisionStr);
			}

			return result;

		}).future<any>()();
	}

	public autoselectProvision(appIdentifier: string, provisionTypes: string[], deviceIdentifier?: string): IFuture<IProvision> {
		return ((): IProvision => {
			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();

			provisions = _.filter(provisions, (prov) => _.contains(provisionTypes, prov.ProvisionType));
			if(provisions.length === 0) {
				this.$errors.fail("No provision of type %s found.", helpers.formatListOfNames(provisionTypes));
			}

			var validator = this.$injector.resolve(iosValidators.IOSDeploymentValidator,
				{ deviceIdentifier: deviceIdentifier, appIdentifier: appIdentifier });

			var passedProvisions: IProvision[] = [];
			var failedProvisions: IFailedProvision[] = [];

			_.each(provisions, (prov: IProvision) => {
				var validationResult = validator.validateProvision(prov);
				var hasCompatibleCertificate = _.any(identities, identity => validator.validateCertificate(identity, prov).wait().isSuccessful);

				if(validationResult.isSuccessful && hasCompatibleCertificate) {
					passedProvisions.push(prov);
				} else {
					failedProvisions.push({ provision: prov, error: validationResult.error });
				}
			});

			var provision = _.chain(provisionTypes)
				.map((type) => _.find(passedProvisions, (prov) => prov.ProvisionType === type))
				.find((prov) => Boolean(prov))
				.value();

			if(provision) {
				return provision;
			} else {
				var composedError = util.format("Cannot find applicable provisioning profiles. %s", os.EOL);

				var iterator = (result: string, data: IFailedProvision) => {
					var currentError = util.format('Cannot use provision "%s" because the following error occurred: %s %s',
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
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();

			var validator = this.$injector.resolve(iosValidators.IOSDeploymentValidator,
				{ deviceIdentifier: null, appIdentifier: null });

			var identity = _.find(identities, (ident) => validator.validateCertificate(ident, provisionData).wait().isSuccessful);

			if(identity) {
				return identity;
			} else {
				this.$errors.fail("No certificate found compatible with provision '%s' found.", provisionData.Name);
				return null;
			}
		}).future<ICryptographicIdentity>()();
	}

	public isCertificateCompatibleWithProvision(certificate: ICryptographicIdentity, provision: IProvision): boolean {
		var formattedCertificate = helpers.stringReplaceAll(certificate.Certificate, /[\r\n]/, "");

		return _.some(provision.Certificates, (c: string) => formattedCertificate.indexOf(c) >= 0);
	}

	public findReleaseCertificate(): IFuture<ICryptographicIdentity> {
		return (() => {
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			return _.find(identities, (identity: ICryptographicIdentity) => this.$selfSignedIdentityValidator.validateCertificate(true, identity.Certificate));
		}).future<ICryptographicIdentity>()();
	}
}
$injector.register("identityManager", IdentityManager);

class IdentityGenerationData {
	private static derObjectIdentifierNames = {
		C: "2.5.4.6",
		CN: "2.5.4.3",
		EmailAddress: "1.2.840.113549.1.9.1"
	};

	public SubjectNameValues: any[];
	public StartDate: Date;
	public EndDate: Date;

	public constructor(identityModel: ISelfSignedIdentityModel) {
		this.StartDate = new Date(identityModel.StartDate);
		this.EndDate = new Date(identityModel.EndDate);
		this.SubjectNameValues = IdentityGenerationData.getDistinguishedNameValues(
			identityModel.Name, identityModel.Email, identityModel.Country);
	}

	public static getDistinguishedNameValues(name: string, email: string, countryCode: string): any {
		var distinguishedNameValues: any = {};
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.CN] = name;
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.EmailAddress] = email;
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.C] = countryCode;
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
		private $httpClient: Server.IHttpClient) { }

	gatherIdentityInformation(model: IIdentityInformation): IFuture<IIdentityInformation> {
		return ((): IIdentityInformation => {
			var myCountry = this.getDefaultCountry().wait();

			var user = this.$userDataStore.getUser().wait();
			var schema: IPromptSchema = {
				properties: {
					Name: {
						required: true,
						type: "string",
						default: () => user.name
					},
					Email: {
						description: "E-mail",
						required: true,
						type: "string",
						default: () => user.email,
						conform: (value: string) => {
							var validationResult = this.$selfSignedIdentityValidator.
								validateProperty(<ISelfSignedIdentityModel>{ Email: value }, "Email");

							if(!validationResult.isSuccessful) {
								schema.properties["Email"].message = validationResult.error;
								return false;
							}
							return true;
						}
					},
					Country: {
						required: true,
						type: "string",
						default: () => myCountry,
						conform: (value: string) => {
							var validationResult = this.$selfSignedIdentityValidator.
								validateProperty(<ISelfSignedIdentityModel>{ Country: value }, "Country");

							if(!validationResult.isSuccessful) {
								var message = [validationResult.error, "Valid countries are:"];

								message.push(helpers.formatListForDisplayInMultipleColumns(helpers.getCountries()));

								schema.properties["Country"].message = message.join("\n");
								return false;
							}
							return true;
						}
					}
				}
			}

			this.$prompter.start();
			this.$prompter.override(model);
			return <IIdentityInformation> this.$prompter.get(schema).wait();
		}).future<IIdentityInformation>()();
	}

	private getDefaultCountry(): IFuture<string> {
		return (() => {
			var locationResponse: Server.IResponse = this.$httpClient.httpRequest("http://freegeoip.net/json/").wait();
			var location: any = JSON.parse(locationResponse.body);
			return location.country_name;
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
		private $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var type = args[3];
			if(type && type.toLowerCase() !== "generic" && type.toLowerCase() !== "googleplay") {
				this.$errors.fail("Certificate type must be either 'Generic' or 'GooglePlay'");
			}

			var identityInfo: IIdentityInformation = {
				Name: args[0],
				Email: args[1],
				Country: args[2]
			};

			identityInfo = this.$identityInformationGatherer.gatherIdentityInformation(identityInfo).wait();

			this.model = {
				ForGooglePlayPublishing: args[3] ? (args[3].toLowerCase() === "googleplay" ? "y" : "n") : undefined,
				StartDate: args[4],
				EndDate: args[5]
			};

			var promptSchema = this.getPromptSchema(this.model);

			this.$prompter.start();
			this.$prompter.override(this.model);
			this.model = this.$prompter.get(promptSchema).wait();
			_.extend(this.model, identityInfo);

			var identityGenerationData = new IdentityGenerationData(this.model);
			var result = this.$server.identityStore.generateSelfSignedIdentity(identityGenerationData).wait();
			this.$logger.info("Successfully created certificate '%s'.", result.Alias);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	private getPromptSchema(defaults: any): IPromptSchema {
		var promptSchema: IPromptSchema = {
			properties: {
				ForGooglePlayPublishing: {
					description: "Is for Google Play publishing? (y/n)",
					required: true,
					type: "string",
					default: () => "n",
					conform: (value: string) => {
						if(!/^[yn]$/i.test(value)) {
							promptSchema.properties["ForGooglePlayPublishing"].message = "Choose 'y' (yes) or 'n' (no).";
							return false;
						}
						return true;
					}
				},
				StartDate: {
					description: "Valid from (yyyy-mm-dd)",
					required: true,
					type: "string",
					default: () => moment(new Date()).format(validators.SelfSignedIdentityValidator.DATE_FORMAT),
					conform: (value: string) => {
						var validationResult = this.$selfSignedIdentityValidator.
							validateProperty(<ISelfSignedIdentityModel>{ StartDate: value }, "StartDate");

						if(!validationResult.isSuccessful) {
							promptSchema.properties["StartDate"].message = validationResult.error;
							return false;
						}

						return true;
					}
				},
				EndDate: {
					description: "Valid until (yyyy-mm-dd)",
					required: true,
					type: "string",
					default: () => this.getDefaultEndDate(this.isForGooglePlay()),
					conform: (value: string) => {
						var validationResult = this.$selfSignedIdentityValidator.
							validateProperty(<ISelfSignedIdentityModel>{
								ForGooglePlayPublishing: this.isForGooglePlay().toString(),
								StartDate: defaults["StartData"] || this.getHistoryValue("StartDate"),
								EndDate: value
							}, "EndDate");

						if(!validationResult.isSuccessful) {
							promptSchema.properties["EndDate"].message = validationResult.error;
							return false;
						}
						return true;
					}
				}
			}
		};
		return promptSchema;
	}

	private isForGooglePlay(): boolean {
		if(this.model.ForGooglePlayPublishing) {
			return this.model.ForGooglePlayPublishing === "y";
		} else {
			return /^y$/i.test(this.getHistoryValue("ForGooglePlayPublishing"))
		}
	}

	private getHistoryValue(name: string): any {
		var entry = this.$prompter.history(name);
		return entry && entry.value;
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
		return (() => {
			this.$identityManager.listCertificates().wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("certificate|*list", ListCertificatesCommand);

export class RemoveCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $errors: IErrors,
		private $prompter: IPrompter,
		private $identityManager: Server.IIdentityManager) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true, "Specify certificate name or index.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var nameOrIndex = args[0];
			var identity = this.$identityManager.findCertificate(nameOrIndex).wait();

			if(this.$prompter.confirm(util.format("Are you sure you want to delete certificate '%s'?", identity.Alias)).wait()) {
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
		private $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true, "Specify certificate name or index."), new commandParams.StringCommandParameter()];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var nameOrIndex = args[0];
			var password = args[1];

			var identity = this.$identityManager.findCertificate(nameOrIndex).wait();
			var name = identity.Alias;
			var sanitizedName = helpers.stringReplaceAll(name, /[^\w|\d|\s|\-|_|\(|\)|]/, "");

			if(sanitizedName.length == 0) {
				sanitizedName = "exported_certificate";
				this.$logger.warn("Certificate name contains only invalid characters: Defaulting to %s!", sanitizedName);
			} else {
				sanitizedName = (sanitizedName + "_certificate").trim();
			}

			var targetFileName = path.join(this.getPath(), util.format("%s.%s", sanitizedName,
				CryptographicIdentityConstants.PKCS12_EXTENSION));

			if(this.$fs.exists(targetFileName).wait()) {
				this.$errors.fail("The target file '%s' already exists.", targetFileName);
			}

			if(!password) {
				password = this.$prompter.getPassword("Exported file password").wait();
			}

			var targetFile = this.$fs.createWriteStream(targetFileName);

			this.$logger.info("Exporting certificate to file %s.", targetFileName);
			this.$server.identityStore.getIdentity(name, password, targetFile).wait();
		}).future<void>()();
	}

	private getPath(): string {
		var path: string = options.path;
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
		private $errors: IErrors) {
	}

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true, "No certificate file specified."), new commandParams.StringCommandParameter()];


	execute(args: string[]): IFuture<void> {
		return (() => {
			var certificateFile = args[0];
			var password = args[1];

			var extension = path.extname(certificateFile).toLowerCase();
			if(extension !== ".p12" && extension !== ".cer") {
				this.$errors.fail("To add a cryptographic identity to the list, import a P12 file " +
					"that contains an existing cryptographic identity or a CER file that contains the " +
					"certificate generated from a certificate signing request.")
			}
			var importType = CryptographicIdentityConstants.ExtensionToTypeMap[extension];

			if(!this.$fs.exists(certificateFile).wait()) {
				this.$errors.fail("The file '%s' does not exist.", certificateFile);
			}

			if(!password) {
				password = this.$prompter.getPassword("Certificate file password", { allowEmpty: true }).wait();
			}

			var targetFile = this.$fs.createReadStream(certificateFile);
			var result = this.$server.identityStore.importIdentity(importType, password, targetFile).wait();

			result.forEach((identity: ICryptographicIdentity) => {
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

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(), new commandParams.StringCommandParameter(), new commandParams.StringCommandParameter()];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var model: IIdentityInformation = {
				Name: args[0],
				Email: args[1],
				Country: args[2]
			};

			model = this.$identityInformationGatherer.gatherIdentityInformation(model).wait();

			var subjectNameValues = IdentityGenerationData.getDistinguishedNameValues(
				model.Name, model.Email, model.Country);
			var certificateData: ICertificateSigningRequest = this.$server.identityStore.generateCertificationRequest(subjectNameValues).wait();

			var downloader: ICertificateDownloader = this.$injector.resolve(DownloadCertificateSigningRequestCommand);
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
			var requests: any[] = this.$server.identityStore.getCertificateRequests().wait();
			requests = _.sortBy(requests, (req) => req.UniqueName);
			_.forEach(requests, (req, i, list) => {
				this.$logger.out("#%s: %s", (i + 1).toString(), req.Subject);
			})
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
		var requests: ICertificateSigningRequest[] = $server.identityStore.getCertificateRequests().wait();
		requests = _.sortBy(requests, (req) => req.UniqueName);

		var index = parseInt(indexStr, 10) - 1;
		if(index < 0 || index >= requests.length) {
			$errors.fail("No certificate with number '%s' exists", indexStr);
		}
		var req = requests[index];
		return req;
	}).future<ICertificateSigningRequest>()();
}

class RemoveCertificateSigningRequestCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector,
		private $prompter: IPrompter,
		private $server: Server.IServer) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true, "Specify certificate signing request index to delete.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var indexStr = args[0];

			var req = this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr }).wait();

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
		private $server: Server.IServer) { }

	allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true, "Specify certificate signing request index to delete.")];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var indexStr = args[0];
			if(!indexStr) {
				this.$errors.fail("Specify certificate signing request index to download.");
			}

			var req = this.$injector.resolve(parseCertificateIndex, { indexStr: indexStr }).wait();
			this.downloadCertificate(req.UniqueName).wait();
		}).future<void>()();
	}

	public downloadCertificate(uniqueName: string): IFuture<void> {
		return ((): void => {
			var targetFileName = options["save-to"];
			if(targetFileName) {
				if(this.$fs.exists(targetFileName).wait()) {
					this.$errors.fail("The output file already exists.");
				}
			} else {
				targetFileName = this.$fs.getUniqueFileName("certificate_request.csr").wait();
			}

			var targetFile = this.$fs.createWriteStream(targetFileName);
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
			var fileName = validationValue;
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
			var fileName = args[0];
			if(!fileName) {
				this.$errors.fail("No file specified.");
			}

			if(!this.$fs.exists(fileName).wait()) {
				this.$errors.fail({ formatStr: "File '%s' does not exist.", suppressCommandHelp: true }, fileName);
			}

			var provisionFile = this.$fs.createReadStream(fileName);
			var provisionData = this.$server.mobileprovisions.importProvision(provisionFile).wait();
			this.$logger.info("Successfully imported provision '%s'.", provisionData.Name);

			this.$commandsService.executeCommand("provision", []).wait();
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
			var provisionData = this.$identityManager.findProvision(args[0]).wait();
			this.$server.mobileprovisions.removeProvision(provisionData.Identifier).wait();
			this.$logger.info("Removed provisioning profile '%s'.", provisionData.Name);

			this.$commandsService.executeCommand("provision", []).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("provision|remove", RemoveProvisionCommand);
