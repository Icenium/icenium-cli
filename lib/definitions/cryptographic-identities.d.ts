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
	Certificates: ICryptographicIdentity[];
	ProvisionedDevices: string[];
}

interface ICryptographicIdentity {
	Alias: string;
	Attributes: string[];
	Type: string;
	Certificate: any;
}

interface ISelfSignedIdentityModel {
	Name: string;
	Email: string;
	Country: string;
	ForGooglePlayPublishing: string;
	StartDate: string;
	EndDate: string;
}