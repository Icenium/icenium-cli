import * as path from "path";
import * as constants from "../common/constants";

export class ProjectMigrationService implements Project.IProjectMigrationService {
	private shouldAskForTypeScriptMigration = true;

	constructor(private $fs: IFileSystem,
		private $npmService: INpmService,
		private $prompter: IPrompter,
		private $project: Project.IProject) { }

	public ensureAllPlatformAssets(): IFuture<void> {
		return this.$project.ensureAllPlatformAssets();
	}

	public migrateTypeScriptProject(): IFuture<void> {
		return (() => {
			if (this.shouldAskForTypeScriptMigration) {
				if (this.$project.isTypeScriptProject().wait() && this.$project.projectData &&
					this.$project.projectData.Framework.toLowerCase() === constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {

					let projectDir = this.$project.projectDir,
						pathToTypingsTnsCoreModules = path.join(projectDir, "typings", constants.TNS_CORE_MODULES);

					if (this.$fs.exists(pathToTypingsTnsCoreModules).wait()) {
						if (this.$prompter.confirm("Your project is using old version of AppBuilder TypeScript support. Do you want to migrate it? ", () => true).wait()) {
							this.$fs.deleteDirectory(pathToTypingsTnsCoreModules).wait();
							this.$npmService.install(projectDir).wait();
						}
					}
				}

				// Ask once per process.
				this.shouldAskForTypeScriptMigration = false;
			}
		}).future<void>()();
	}
}
$injector.register("projectMigrationService", ProjectMigrationService);
