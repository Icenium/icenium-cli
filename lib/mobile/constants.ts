// enumeration taken from ProvisionType.cs

export class ProvisionType {
	static Development = "Development";
	static AdHoc = "AdHoc";
	static AppStore = "AppStore";
	static Enterprise = "Enterprise";
}

export var ERROR_NO_DEVICES = "Cannot find connected devices. Reconnect any connected devices, verify that your system recognizes them, and run this command again";