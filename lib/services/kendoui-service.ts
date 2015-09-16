///<reference path="../.d.ts"/>
"use strict";

export class KendoUIService implements IKendoUIService {
	private static VERIFIED_TAG = "verified";
	private static KENDO_CORE = "Kendo UI Core";
	private static KENDO_PROFESSIONAL = "Kendo UI Professional";

	private _packages: Server.IKendoDownloadablePackageData[] = null;

	constructor(private $server: Server.IServer) {
	}

	public getKendoPackages(options: IKendoUIFilterOptions): IFuture<Server.IKendoDownloadablePackageData[]> {
		return (() => {
			if (!this._packages) {
				let packages: Server.IKendoDownloadablePackageData[] = _.filter(<Server.IKendoDownloadablePackageData[]>this.$server.kendo.getPackages().wait(), p => !p.NeedPurchase);
				if (options.verified) {
					packages = _.filter(packages, pack => _.any(pack.VersionTags, tag => tag.toLowerCase() === KendoUIService.VERIFIED_TAG));
				}

				if (options.core) {
					packages = _.filter(packages, pack => pack.Name === KendoUIService.KENDO_CORE);
				}

				if (options.professional) {
					packages = _.filter(packages, pack => pack.Name === KendoUIService.KENDO_PROFESSIONAL);
				}

				this._packages = packages;
			}

			return this._packages;
		}).future<Server.IKendoDownloadablePackageData[]>()();
	}
}

$injector.register("kendoUIService", KendoUIService);
