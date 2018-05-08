import { join } from "path";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import * as url from "url";
const _ = require("lodash");
import * as request from "request";

async function buildNpmRegistryUrl(packageName: string): Promise<string> {
	let registryUrl = await getNpmRegistryUrl();
	if (!_.endsWith(registryUrl, "/")) {
		registryUrl += "/";
	}

	return `${registryUrl}${packageName.replace("/", "%2F")}`;
}

async function getNpmRegistryUrl(): Promise<string> {
	let currentNpmRegistry: string;

	try {
		currentNpmRegistry = (execSync("npm config get registry") || "").toString().trim();
	} catch (err) {
		console.warn(`Unable to get current npm registry. Error is: ${err}`);
	}

	return currentNpmRegistry || "http://registry.npmjs.org";
}

function toBoolean(str: any): boolean {
	return !!(str && str.toString && str.toString().toLowerCase() === "true");
}

async function getNpmProxySettings(): Promise<IProxySettings> {
	try {
		const npmProxy = (execSync("npm config get proxy") || "").toString().trim();

		// npm will return null as string in case there's no proxy set.
		if (npmProxy && npmProxy !== "null") {
			const strictSslString = (execSync("npm config get strict-ssl") || "").toString().trim();
			const uri = url.parse(npmProxy);
			return {
				hostname: uri.hostname,
				port: uri.port,
				rejectUnauthorized: toBoolean(strictSslString)
			};
		}
	} catch (err) {
		console.warn(`Unable to get npm proxy configuration. Error is: ${err.message}`);
		this.$logger.trace(`Unable to get npm proxy configuration. Error is: ${err.message}.`);
	}

	return null;
}

async function getPackageJsonFromNpmRegistry(packageName: string, version?: string): Promise<any> {
	let packageJsonContent: any;
	version = version || "latest";
	try {
		const url = await buildNpmRegistryUrl(packageName);

		const options: any = {
			url,
			encoding: null,
			followAllRedirects: true,
			timeout: 5000
		};

		const proxySettings = await getNpmProxySettings();
		if (proxySettings) {
			const proto = proxySettings && proxySettings.protocol || "http:";
			const host = proxySettings && proxySettings.hostname;
			const port = proxySettings && proxySettings.port;

			// Note that proto ends with :
			options.proxy = `${proto}//${host}:${port}`;
			options.rejectUnauthorized = proxySettings ? proxySettings.rejectUnauthorized : true;
		}

		const result = await new Promise((resolve, reject) => {

			request.get(options, (error: Error, response: any, body: any) => {
				if (error) {
					reject(error);
				}

				resolve(body.toString());
			});
		});

		// This call will return error with message '{}' in case there's no such package.
		const fullData = JSON.parse(result.toString());
		const distTags = fullData["dist-tags"];
		const versions = fullData.versions;

		// check if passed version is in fact tag (for example latest, next, etc.) In this case - get the real version.
		_.each(distTags, (ver: string, tagName: string) => {
			if (tagName === version) {
				version = ver;
				return false;
			}
		});

		packageJsonContent = versions[version];
	} catch (err) {
		console.warn(`Unable to get package.json from npm registry. Error is: ${err}`);
	}

	return packageJsonContent;
}

async function getInformationFromRegistry(): Promise<string> {
	const packageJson = await getPackageJsonFromNpmRegistry("appbuilder");

	if (!packageJson) {
		throw new Error("Unable to get information from registry.");
	}

	return packageJson.version;
}

function versionCompare(version1: string | IVersionData, version2: string | IVersionData): number {
	let v1array = getVersionArray(version1),
		v2array = getVersionArray(version2);

	if (v1array.length !== v2array.length) {
		throw new Error("Version strings are not in the same format");
	}

	for (let i = 0; i < v1array.length; ++i) {
		if (v1array[i] !== v2array[i]) {
			return v1array[i] > v2array[i] ? 1 : -1;
		}
	}

	return 0;
}

function getVersionArray(version: string | IVersionData): number[] {
	let result: number[] = [],
		parseLambda = (x: string) => parseInt(x, 10),
		filterLambda = (x: number) => !isNaN(x);

	if (typeof version === "string") {
		let versionString = <string>version.split("-")[0];
		result = _.map(versionString.split("."), parseLambda);
	} else {
		result = _(version).map(parseLambda).filter(filterLambda).value();
	}

	return result;
}

async function ensureUpToDate(): Promise<void> {
	let latestVersion: string;

	try {
		latestVersion = await getInformationFromRegistry();
	} catch (error) {
		console.warn("Failed to retrieve AppBuilder version from npm. Make sure you are running latest version of AppBuilder CLI.");
	}

	const pathToPackageJson = join(__dirname, "..", "package.json");
	const packageJsonContent = readFileSync(pathToPackageJson).toString();
	const currentVersion = JSON.parse(packageJsonContent).version;
	if (latestVersion && versionCompare(latestVersion, currentVersion) > 0) {
		console.error("You are running an outdated version of the Telerik AppBuilder CLI. To run this command, you need to update to the latest version of the Telerik AppBuilder CLI. To update now, run 'npm install -g appbuilder'.");
	}
}

module.exports.ensureUpToDate = ensureUpToDate;
