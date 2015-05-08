///<reference path="../../.d.ts"/>
"use strict";
import helpers = require("./../../helpers");

export class ProjectPropertyCommandBase {
	protected projectSchema: any;
	public $project: Project.IProject;

	constructor(private $staticConfig: IStaticConfig,
		private $injector: IInjector) {
		this.$staticConfig.triggerJsonSchemaValidation = false;
		this.$project = this.$injector.resolve("project");
		if (this.$project.projectData) {
			this.projectSchema = this.$project.getProjectSchema().wait();
		}
	}

	public get completionData(): string[] {
		let parseResult = /prop[ ]+([^ ]+) ([^ ]*)/.exec(process.argv.join(" "));
		if (parseResult) {
			let propName = parseResult[2];
			if (this.projectSchema[propName]) {
				let range = this.projectSchema[propName].range;
				if (range) {
					if (!_.isArray(range)) {
						range = _.map(range, (value:{ input: string }, key:string) => {
							return value.input || key;
						});
					}
					return range;
				}
			} else {
				return _.keys(this.projectSchema);
			}
		}

		return null;
	}
}