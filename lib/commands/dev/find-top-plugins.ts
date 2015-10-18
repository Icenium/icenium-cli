///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");

export class FindTopPlugins implements ICommand {
	constructor(private $httpClient: Server.IHttpClient,
	private $fs: IFileSystem) {}

execute(args: string[]): IFuture<void> {
	return (() => {
		let dirPath = path.join(__dirname, "..", "..", "..", "scratch", "NpmSearchResults");
		let files = this.$fs.readDirectory(dirPath).wait();
		let topPackages: any[] = [];
		while(files.length) {
			let filesToCheck = files.splice(0, 50);
			let readFilesFutures = _.map(filesToCheck, f =>{
				return this.$fs.readJson(path.join(dirPath,f));
			});

			Future.wait(readFilesFutures);
			let mostUsed = (<any>(_(readFilesFutures)
				.map(f => f.get())
				.filter(f => !!f)
				.flatten<any>()
				.sortBy(f => parseInt(f.downloads))))
				.takeRight(100)
				.value();
			topPackages.push(mostUsed);
		}

		let mostUsed = (<any>(_(topPackages)
			.flatten<any>()
			.sortBy(f => parseInt(f.downloads))))
			.takeRight(100)
			.value();
		this.$fs.writeJson(path.join(dirPath, "..", "mostDownloadedPackage.json"), mostUsed).wait();
		console.log("FINISHED!!!");
	}).future<void>()();
	//return this.getPack(args[0]);
}

canExecute(args: string[]): IFuture<boolean> {
	return Future.fromResult(true);
}
	allowedParameters: ICommandParameter[];
	getPack(name: string): IFuture<void> {
		return (()=> {
			let endKeyName = "";

			_.range(20 - name.length).forEach(num => { endKeyName += 'Z' });
			console.log("ENDKEYNAME = " + endKeyName, "LENGTH = " + (name.length + endKeyName.length));
			let url = `http://npmsearch.com/query?fields=name&size=1000000&startkey="${name}"&endkey="${name}${endKeyName}"`;

			let result = this.$httpClient.httpRequest(url).wait().body;
			if(result) {
				let npmSearchResult: any[] = JSON.parse(result).results;
				console.log("npmSearchResults.length = " + npmSearchResult.length);
				let currentIteration = 0;
				let step = 500;
				while(npmSearchResult.length) {
					let currentItems = npmSearchResult.splice(0, step);


					let packagesFutures =_.map(currentItems, (pluginResult: any) => {
						if(pluginResult && pluginResult.name && _.first(pluginResult.name)) {
							return this.getDownloadsOfPackage(_.first(pluginResult.name).toString());
						}

						return null;
					}).filter(pl => !!pl);
					Future.wait(packagesFutures);
					let results = (<any>( _(packagesFutures)
									.map(f => f.get())
									.filter(f => !!f)
									.sortBy(f => parseInt(f.downloads))))
									.takeRight(50)
									.value();
					let filePath = path.join(__dirname, "..", "..", "..", "scratch", "NpmSearchResults", currentIteration + ".js");
					this.$fs.writeJson(filePath, results).wait();
					currentIteration++;
					console.log("New npmSearchResult length = " + npmSearchResult.length);
				}
			}
		}).future<void>()();
	}

	private getDownloadsOfPackage(packageName: string): any {
		return (() => {
			let baseApi = "https://api.npmjs.org/downloads/point/2015-09-16:2015-10-15/" + packageName;
			let result = this.$httpClient.httpRequest(baseApi).wait().body;
			if(result) {
				let jsonResult = JSON.parse(result);
				if(jsonResult && jsonResult.downloads) {
					return { name: packageName, downloads: jsonResult.downloads };
				}
			}
			return null
		}).future<any>()();
	}
}
$injector.registerCommand("dev-find-plugins", FindTopPlugins);
