export class KendoUIService implements IKendoUIService {
	private static VERIFIED_TAG = "verified";
	private static KENDO_CORE = "Kendo UI Core";
	private static KENDO_PROFESSIONAL = "Kendo UI Professional";

	private _packages: Server.IKendoDownloadablePackageData[] = null;

	constructor(private $server: Server.IServer) {
	}

	public async getKendoPackages(options: IKendoUIFilterOptions): Promise<Server.IKendoDownloadablePackageData[]> {
			if (!this._packages) {
				let packages: Server.IKendoDownloadablePackageData[] = await  _.filter(<Server.IKendoDownloadablePackageData[]>this.$server.kendo.getPackages(), p => !p.NeedPurchase);
				if (options.verified) {
					packages = _.filter(packages, pack => _.some(pack.VersionTags, tag => tag.toLowerCase() === KendoUIService.VERIFIED_TAG));
				}

				if (options.core) {
					packages = _.filter(packages, pack => pack.Name === KendoUIService.KENDO_CORE);
				}

				if (options.professional) {
					packages = _.filter(packages, pack => pack.Name === KendoUIService.KENDO_PROFESSIONAL);
				}

				if (options.withReleaseNotesOnly) {
					packages = _.filter(packages, pack => pack.HasReleaseNotes);
				}

				if (options.latest) {
					let latestPackage = _.first(packages);
					packages = _.filter(packages, pack => pack.Version === latestPackage.Version);
				}

				this._packages = packages;
			}

			return this._packages;
	}
}

$injector.register("kendoUIService", KendoUIService);
