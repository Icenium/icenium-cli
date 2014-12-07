///<reference path="../../.d.ts"/>
"use strict";
import helpers = require("./../../helpers");

export class ProjectPropertyCommandBase {
	protected projectSchema: any;

	constructor(public $project: Project.IProject) {
		this.projectSchema = helpers.getProjectFileSchema(this.$project.projectType).wait();
	}

	public get completionData(): string[] {
		var parseResult = /prop[ ]+([^ ]+) ([^ ]*)/.exec(process.argv.join(" "));
		if (parseResult) {
			var propName = parseResult[2];
			if (this.projectSchema[propName]) {
				var range = this.projectSchema[propName].range;
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