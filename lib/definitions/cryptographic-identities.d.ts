interface ICryptographicIdentityStoreService {
	getAllProvisions(): IFuture<IProvision[]>;
	getAllIdentities(): IFuture<ICryptographicIdentity[]>;
}

interface IProvision {
	Name: string;
	Identifier: string;
	ApplicationIdentifierPrefix: string;
	ApplicationIdentifier: string;
	ProvisionType: string;
	ExpirationDate: any;
	Certificates: string[];
	ProvisionedDevices: string[];
}

interface ICryptographicIdentity {
	Alias: string;
	Attributes: string[];
	Type: string;
	Certificate: string;
}

interface ISelfSignedIdentityModel {
	Name: string;
	Email: string;
	Country: string;
	ForGooglePlayPublishing: string;
	StartDate: string;
	EndDate: string;
}