import * as path from "path";
import * as constants from "../common/constants";
import rimraf = require("rimraf");

export class ProjectMigrationService implements Project.IProjectMigrationService {
	private shouldAskForTypeScriptMigration = true;

	constructor(private $fs: IFileSystem,
		private $npmService: INpmService,
		private $prompter: IPrompter,
		private $typeScriptService: ITypeScriptService,
		private $project: Project.IProject,
		private $logger: ILogger) { }

	public ensureAllPlatformAssets(): IFuture<void> {
		return this.$project.ensureAllPlatformAssets();
	}

	public migrateTypeScriptProject(): IFuture<void> {
		return (() => {
			if (this.shouldAskForTypeScriptMigration) {
				if (this.$typeScriptService.isTypeScriptProject(this.$project.projectDir).wait() && this.$project.projectData &&
					this.$project.projectData.Framework.toLowerCase() === constants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {

					let projectDir = this.$project.projectDir,
						pathToTypingsTnsCoreModules = path.join(projectDir, "typings", constants.TNS_CORE_MODULES);

					if (this.$fs.exists(pathToTypingsTnsCoreModules)) {
						this.$logger.printMarkdown("`AppBuilder 3.5` has introduced improved TypeScript support using npm modules. The `tns-core-modules` typings are now redundant and will be removed from your app.");
						if (this.$prompter.confirm("Do you want to continue?", () => true).wait()) {
							rimraf.sync(pathToTypingsTnsCoreModules);
							this.$fs.deleteEmptyParents(pathToTypingsTnsCoreModules);
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
