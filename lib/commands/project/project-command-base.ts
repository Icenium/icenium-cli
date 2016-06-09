export class ProjectCommandBase {
	constructor(protected $errors: IErrors,
		protected $project: Project.IProject) { }

	protected validateProjectData(): void {
		if (this.$project.projectData) {
			this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
		}
	}
}
