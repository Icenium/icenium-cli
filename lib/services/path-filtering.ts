///<reference path="../.d.ts"/>
import _ = require("underscore");
import os = require("os");
import minimatch = require("minimatch");

export class PathFilteringService implements IPathFilteringService {

	constructor(private $fs: IFileSystem) {
	}

	public getRulesFromFile(fullFilePath: string) : string[] {
		var COMMENT_START = '#';
		var rules = [];

		try {
			var fileContent = this.$fs.readText(fullFilePath).wait();
			rules = _.reject(fileContent.split(os.EOL),
				(line: string) => line.length === 0 || line[0] === COMMENT_START);

		} catch(e) {
			if (e.code !== "ENOENT") { // file not found
				throw e;
			}
		}

		return rules;
	}

	public filterIgnoredFiles(files: string[], rules: string[]) :string[] {
		var selectedFiles = _.select(files, (file: string) => {
			var fileMatched = true;
			_.forEach(rules, rule => {
				// minimatch treats starting '!' as pattern negation
				// but we want the pattern matched and then do something else with the file
				// therefore, we manually handle leading ! (and its escaped counterpart, \!) and hide them from minimatch
				var shouldInclude = rule[0] === '!';
				if (shouldInclude) {
					rule = rule.substr(1);
					var ruleMatched = minimatch(file, rule, {nocase: true});
					if (ruleMatched) {
						fileMatched = ruleMatched;
					}
				} else {
					var options = {nocase: true, nonegate: false};
					if (rule[0] === '\\' && rule[1] === '!') {
						rule = rule.substr(1);
						options.nonegate = true;
					}
					var ruleMatched = minimatch(file, rule, options);
					fileMatched = fileMatched && !ruleMatched;
				}
			});

			return fileMatched;
		});

		return selectedFiles;
	}
}

$injector.register("pathFilteringService", PathFilteringService);