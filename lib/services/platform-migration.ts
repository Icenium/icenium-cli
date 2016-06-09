export class PlatformMigrationService implements Project.IPlatformMigrator {
	constructor(private $project: Project.IProject) { }

	public ensureAllPlatformAssets(): IFuture<void> {
		return this.$project.ensureAllPlatformAssets();
	}
}
$injector.register("platformMigrator", PlatformMigrationService);
