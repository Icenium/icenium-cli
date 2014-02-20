///<reference path="../.d.ts"/>
"use strict";

var options: any = require("../options");
import _ = require("underscore");
import Future = require("fibers/future");
import util = require("util");
import helpers = require("../helpers");
import log = require("../logger");
import path = require("path");
import moment = require("moment");
import validators = require("../validators/cryptographic-identity-validators");
import readline = require("readline");
import stream = require("stream");

class CryptographicIdentityConstants {
	public static FILE_FORMAT_TYPE = "Pkcs12";
	public static FILE_FORMAT_EXTENSION = "p12";
}

export class CryptographicIdentityStoreService implements ICryptographicIdentityStoreService{
	constructor(private $server: Server.IServer) { }

	public getAllProvisions(): IFuture<IProvision[]> {
		return(() => {
			var data = this.$server.mobileprovisions.getProvisions().wait();
			return _.map(data, (identityData) => <IProvision>identityData);
		}).future<IProvision[]>()();
	}

	public getAllIdentities(): IFuture<ICryptographicIdentity[]> {
		return(() => {
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
		private $logger: ILogger,
		private $errors: IErrors) {
	}

	public listCertificates(): IFuture<any> {
		return ((): any => {
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			identities = _.sortBy(identities, (identity) => identity.Alias);
			_.forEach(identities, (identity, index) => {
				this.$logger.out(util.format("#%d: '%s'", index + 1, identity.Alias));
			});
		}).future<any>()();
	}

	public listProvisions(): IFuture<any> {
		return ((): any => {
			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			provisions = _.sortBy(provisions, (provision) => provision.Name);

			_.forEach(provisions, (provision, provisionIndex) => {
				this.$logger.out(util.format("#%d: '%s'; type: %s, App ID: '%s.%s'", provisionIndex + 1, provision.Name, provision.ProvisionType,
					provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier));
				if (options.verbose) {
					this.$logger.out("  Provisioned devices:");
					var devices = provision.ProvisionedDevices;
					_.forEach(provision.ProvisionedDevices, (device, deviceIndex) => {
						this.$logger.out("    " + devices[deviceIndex])
					});
				}
			});
		}).future<any>()();
	}

	public findCertificate(identityStr): IFuture<any> {
		return ((): any => {
			this.$logger.debug("Looking for certificate '%s'", identityStr);
			var identities = this.$cryptographicIdentityStoreService.getAllIdentities().wait();
			identities = _.sortBy(identities, (identity) => identity.Alias);

			var result = this.findIdentityData(identityStr, identities, (ident) => ident.Alias);
			if (!result) {
				this.$errors.fail(util.format("Could not find certificate named '%s' or was not given a valid index. List registered certificates with 'list-certificates' command.", identityStr));
			} else {
				return result;
			}
		}).future<any>()();
	}

	public findProvision(provisionStr): IFuture<any> {
		return ((): any => {
			log.debug("Looking for provision '%s'", provisionStr);
			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			provisions = _.sortBy(provisions, (provision) => provision.Name);
			var result = this.findIdentityData(provisionStr, provisions, (ident) => ident.Name);

			if (!result) {
				this.$errors.fail(util.format("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'list-provisions' command.", provisionStr));
			} else {
				return result;
			}
		}).future<any>()();
	}

	private findIdentityData<T>(identityStr: string, data: T[], selector: (item: T) => string): T {
		if (!identityStr) {
			return undefined;
		}

		var identityData = _.find(data, (item) => selector(item).indexOf(identityStr) > -1);
		if (identityData) {
			return identityData;
		}

		var index = parseInt(identityStr, 10) - 1;
		if (index >= 0 && index < data.length) {
			return data[index];
		}

		return undefined;
	}
}
$injector.register("identityManager", IdentityManager);
helpers.registerCommand("identityManager", "list-certificates", false, (identityManager, args) => identityManager.listCertificates());
helpers.registerCommand('identityManager', "list-provisions", false, (identityManager, args) => identityManager.listProvisions());

class IdentityGenerationData {
	private static derObjectIdentifierNames = {
		C: "2.5.4.6",
		CN: "2.5.4.3",
		EmailAddress: "1.2.840.113549.1.9.1"
	};

	public SubjectNameValues;
	public StartDate: Date;
	public EndDate: Date;

	public constructor(identityModel: ISelfSignedIdentityModel) {
		this.StartDate = new Date(identityModel.StartDate);
		this.EndDate = new Date(identityModel.EndDate);
		this.SubjectNameValues = this.getDistinguishedNameValues(identityModel.Name,
			identityModel.Email, identityModel.Country);
	}

	private getDistinguishedNameValues(name: string, email: string, countryCode: string) {
		var distinguishedNameValues = {};
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.CN] = name;
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.EmailAddress] = email;
		distinguishedNameValues[IdentityGenerationData.derObjectIdentifierNames.C] = countryCode;
		return distinguishedNameValues;
	}
}

export class CreateSelfSignedIdentity implements ICommand {
	private model: any;

	constructor(private $server: Server.IServer,
		private $selfSignedIdentityValidator: IValidator<ISelfSignedIdentityModel>,
		private $prompter: IPrompter,
		private $userDataStore: IUserDataStore,
		private $httpClient: Server.IHttpClient,
		private $errors: IErrors) {}

	execute(args: string[]): void {
		(() => {

			var type = args[3];
			if (type && type.toLowerCase() !== "generic" && type.toLowerCase() !== "googleplay") {
				this.$errors.fail("Certificate type must be either 'Generic' or 'GooglePlay'");
			}

			this.model = {
				Name: args[0],
				Email: args[1],
				Country: args[2],
				ForGooglePlayPublishing: args[3] ? (args[3].toLowerCase() === "googleplay" ? "y" : "n") : undefined,
				StartDate: args[4],
				EndDate: args[5]
			};

			var promptSchema: IPromptSchema = this.getPromptSchema(this.model).wait();

			this.$prompter.start();
			this.$prompter.override(this.model);

			this.model = this.$prompter.get(promptSchema).wait();

			var identityGenerationData = new IdentityGenerationData(this.model);
			this.$server.identityStore.generateSelfSignedIdentity(identityGenerationData).wait();

		}).future<void>()().wait();
	}

	private getPromptSchema(defaults:any): IFuture<IPromptSchema> {
		return ((): IPromptSchema => {
			var user = this.$userDataStore.getUser().wait();
			var defaultCountry = this.getDefaultCountry().wait();

			var promptSchema:IPromptSchema = {
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
						default: () => {
							return user.email;
						},
						conform: (value: string) => {
							var validationResult = this.$selfSignedIdentityValidator.
								validateProperty(<ISelfSignedIdentityModel>{ Email: value }, "Email");

							if (!validationResult.IsSuccessful) {
								promptSchema.properties["Email"].message = validationResult.Error;
								return false;
							}
							return true;
						}
					},
					Country: {
						required: true,
						type: "string",
						default: () => defaultCountry,
						conform: (value: string) => {
							var validationResult = this.$selfSignedIdentityValidator.
								validateProperty(<ISelfSignedIdentityModel>{ Country: value }, "Country");

							if (!validationResult.IsSuccessful) {
								var message = [validationResult.Error, "Valid countries are:"];

								message.push(helpers.formatListForDisplayInMultipleColumns(helpers.getCountries()));

								promptSchema.properties["Country"].message = message.join("\n");
								return false;
							}
							return true;
						}
					},
					ForGooglePlayPublishing: {
						description: "Is for Google Play publishing? (y/n)",
						required: true,
						type: "string",
						default: () => "n",
						conform: (value: string) => {
							if (!/^[yn]$/i.test(value)) {
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

							if (!validationResult.IsSuccessful) {
								promptSchema.properties["StartDate"].message = validationResult.Error;
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

							if (!validationResult.IsSuccessful) {
								promptSchema.properties["EndDate"].message = validationResult.Error;
								return false;
							}
							return true;
						}
					}
				}
			};
			return promptSchema;
		}).future<IPromptSchema>()();
	}

	private isForGooglePlay(): boolean {
		if (this.model.ForGooglePlayPublishing) {
			return this.model.ForGooglePlayPublishing === "y";
		} else {
			return /^y$/i.test(this.getHistoryValue("ForGooglePlayPublishing"))
		}
	}

	private getHistoryValue(name: string): any {
		var entry = this.$prompter.history(name);
		return entry && entry.value;
	}

	private getDefaultCountry(): IFuture<string> {
		return (() => {
			var locationResponse: Server.IResponse = this.$httpClient.httpRequest("http://api.wipmania.com/json").wait();
			var location: any = JSON.parse(locationResponse.body);
			return location.address.country;
		}).future<string>()();
	}

	private getDefaultEndDate(forGooglePlayPublishing: boolean): string {
		if (forGooglePlayPublishing) {
			return moment(validators.SelfSignedIdentityValidator.GOOGLE_PLAY_IDENTITY_MIN_EXPIRATION_DATE)
				.format(validators.SelfSignedIdentityValidator.DATE_FORMAT);
		}
		return moment().add("years", 1).format(validators.SelfSignedIdentityValidator.DATE_FORMAT);
	}
}
$injector.registerCommand("create-self-signed-certificate", CreateSelfSignedIdentity);

export class RemoveCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $errors: IErrors,
		private $prompter: IPrompter,
		private $identityManager: Server.IIdentityManager) {}

	execute(args: string[]): void {
		(() => {
			if (args.length < 1) {
				this.$errors.fail("Specify certificate name or index.");
			}

			var nameOrIndex = args[0];
			var identity = this.$identityManager.findCertificate(nameOrIndex).wait();

			if (this.$prompter.confirm(util.format("Are you sure you want to delete certificate '%s'?", identity.Alias)).wait()) {
				this.$server.identityStore.removeIdentity(identity.Alias).wait();
			}
		}).future<void>()().wait();
	}
}
$injector.registerCommand("remove-certificate", RemoveCryptographicIdentity);

export class ExportCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $identityManager: Server.IIdentityManager,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $errors: IErrors) {}

	execute(args: string[]): void {
		(() => {
			if (args.length < 1) {
				this.$errors.fail("Specify certificate name and optionally a password.");
			}

			var nameOrIndex = args[0];
			var password = args[1];

			var identity = this.$identityManager.findCertificate(nameOrIndex).wait();
			var name = identity.Alias;

			var targetFileName = path.join(this.getPath(), util.format("%s.%s", name,
				CryptographicIdentityConstants.FILE_FORMAT_EXTENSION));

			if (this.$fs.exists(targetFileName).wait()) {
				this.$errors.fail("The target file '%s' already exists.", targetFileName);
			}

			if (!password) {
				password = this.$prompter.getPassword("Exported file password").wait();
			}

			var targetFile = this.$fs.createWriteStream(targetFileName);

			this.$server.identityStore.getIdentity(name, password, targetFile).wait();
		}).future<void>()().wait();
	}

	private getPath(): string {
		var path: string = options.path;
		delete options.path;

		if (!path) {
			path = process.cwd();
		} else if (!this.$fs.exists(path).wait()) {
			this.$errors.fail("The path '%s' does not exist.", path);
		}
		return path;
	}
}
$injector.registerCommand("export-certificate", ExportCryptographicIdentity);

export class ImportCryptographicIdentity implements ICommand {
	constructor(private $server: Server.IServer,
		private $fs: IFileSystem,
		private $importCryptographicIdentityValidator: IAsyncValidator<any>,
		private $prompter: IPrompter,
		private $logger: ILogger,
		private $errors: IErrors) {
	}

	execute(args: string[]): void {
		(() => {
			var model = {
				CertificateFile: args[0],
				Password: args[1]
			};

			if (!model.Password) {
				model.Password = this.$prompter.getPassword("Certificate file password").wait();
			}

			var validationResult = this.$importCryptographicIdentityValidator.validate(model).wait();
			if (!validationResult.IsSuccessful) {
				this.$errors.fail(validationResult.Error);
			}

			var targetFile = this.$fs.createReadStream(model.CertificateFile);
			var result = this.$server.identityStore.importIdentity(CryptographicIdentityConstants.FILE_FORMAT_TYPE,
				model.Password, targetFile).wait();

			result.forEach((identity) => {
				this.$logger.info("Imported certificate '%s'.", identity.Alias);
			});
		}).future<void>()().wait();
	}
}
$injector.registerCommand("import-certificate", ImportCryptographicIdentity);