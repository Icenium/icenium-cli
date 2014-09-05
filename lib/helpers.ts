///<reference path=".d.ts"/>
"use strict";
import fs = require("fs");
import path = require("path");
import util = require("util");
import querystring = require("querystring");
import Future = require("fibers/future");
import commonHelpers = require("./common/helpers");

export function fromWindowsRelativePathToUnix(windowsRelativePath: string): string {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function getRelativeToRootPath(rootPath: string, filePath: string): string {
	var relativeToRootPath = filePath.substr(rootPath.length);
	return relativeToRootPath;
}

export function isNumber(n: any): boolean {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export function toHash(collection: any, keySelector: (value: any, positionOrKey: any, collection: any) => string, valueSelector: (value: any, positionOrKey: any, collection: any) => any): any {
	var result = {};
	if (_.isArray(collection)) {
		for (var i = 0; i < collection.length; ++i) {
			result[keySelector(collection[i], i, collection)] =
				valueSelector(collection[i], i, collection);
		}
	} else {
		Object.keys(collection).forEach((key) => {
			result[keySelector(collection[key], key, collection)] =
				valueSelector(collection[key], key, collection);
		});
	}
	return result;
}

var _projectFileSchemas: string[] = [];
export function getProjectFileSchema(projectType: number): IFuture<any> {
	return(() => {
		if (!_projectFileSchemas[projectType]) {
			var projectTypes = require("./project-types");
			_projectFileSchemas[projectType] = getProjectFilePartSchema(projectTypes[projectType]).wait();
			var commonSchema = getProjectFilePartSchema("common").wait();
			_.extend(_projectFileSchemas[projectType], commonSchema);
		}
		return _projectFileSchemas[projectType];
	}).future<any>()();
}

export function getProjectFilePartSchema(partName: string): IFuture<string> {
	return (() => {
		var $fs:IFileSystem = $injector.resolve("fs");
		var propPath = path.join(__dirname,
				"../resources/project-properties-" + partName.toLowerCase() + ".json");
		var schema = $fs.readJson(propPath, "utf8").wait();
		return schema;
	}).future<string>()();
}

export function isStringOptionEmpty(optionValue: string): boolean {
	return optionValue === undefined || optionValue === null || optionValue === "null" || optionValue === "false" || optionValue === "true";
}

export function registerCommand(module: string, commandName: string, executor: (module: any, args: string[]) => IFuture<void>, opts?: ICommandOptions): void;
export function registerCommand(module: string, commandNames: string[], executor: (module: any, args: string[]) => IFuture<void>, opts?: ICommandOptions): void;
export function registerCommand(module: string, commandName: any, executor: (module: any, args: string[]) => IFuture<void>, opts?: ICommandOptions): void {
	var factory = (): ICommand => {
		return {
			execute: (args: string[]): IFuture<void> => {
				var mod = $injector.resolve(module);
				return executor(mod, args);
			},
			disableAnalytics: opts && opts.disableAnalytics
		};
	};

	$injector.registerCommand(commandName, factory);
}

export function stringReplaceAll(string: string, find: any, replace: string): string {
	return string.split(find).join(replace);
}

export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatListOfNames(names: string[], conjunction = "or"): string {
	if (names.length <= 1) {
		return names[0];
	} else {
		return _.initial(names).join(", ") + " " + conjunction + " " + names[names.length - 1];
	}
}

export function getCountries(): string[] {
	return ["Afghanistan", "Aland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina",
		"Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
		"Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam",
		"Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile",
		"China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo, The Democratic Republic of The", "Cook Islands", "Costa Rica",
		"Cote D'ivoire", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
		"Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana",
		"French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada",
		"Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-bissau", "Guyana", "Haiti", "Heard Island and Mcdonald Islands", "Holy See (Vatican City State)",
		"Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica",
		"Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, Republic of", "Kuwait", "Kyrgyzstan",
		"Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libyan Arab Jamahiriya", "Liechtenstein", "Lithuania", "Luxembourg",
		"Macao", "Macedonia, The Former Yugoslav Republic of", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania",
		"Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Moldova, Republic of", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco",
		"Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria",
		"Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestinian Territory, Occupied", "Panama", "Papua New Guinea",
		"Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation", "Rwanda", "Saint Helena",
		"Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", "Saint Vincent and The Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
		"Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
		"South Georgia and The South Sandwich Islands", "Spain", "Sri Lanka", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland",
		"Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of", "Thailand", "Timor-leste", "Togo", "Tokelau", "Tonga",
		"Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
		"United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Viet Nam", "Virgin Islands, British", "Virgin Islands, U.S.",
		"Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"];
}

interface IFormatting {
	formatted: string;
	width: number;
}

function formatListInMultipleColumns(list: string[], columns: number): IFormatting {
	var rows = Math.ceil(list.length / columns);
	var columnList = new Array<Array<string>>();
	for (var i = 0; i < columns; ++i) {
		columnList.push(_.take(list, rows));
		list = _.rest(list, rows);
	}

	var extents = _.map(columnList, (sublist) => _.max(sublist, (element: string) => element.length).length);

	var formattedRows: string[] = [];
	var width: number;
	for (var r = 0; r < rows; ++r) {
		var rowItems:string[] = [];
		for (var c = 0; c < columns; ++c) {
			var item = columnList[c][r] || "";
			var padding = _.map(_.range(extents[c] - item.length), (x) => " ").join("");
			rowItems.push(item + padding);
		}
		var formattedRow = rowItems.join(" ");
		formattedRows.push(formattedRow);
		width = formattedRow.length;
	}
	return {
		formatted: formattedRows.join("\n"),
		width: width
	};
}

export function formatListForDisplayInMultipleColumns(list: string[]): string {
	var consoleWidth = process.stdout.columns;
	var bestFormatting: IFormatting;
	for (var i = 1; i <= 8; ++i) {
		var formatting = formatListInMultipleColumns(list, i);
		if (formatting.width <= consoleWidth || !bestFormatting) {
			bestFormatting = formatting;
		}
	}
	return bestFormatting.formatted;
}

export function findByNameOrIndex<T>(identityStr: string, data: T[], selector: (item: T) => string): T {
	if (!identityStr) {
		return undefined;
	}

	data = _.sortBy(data, selector);

	var identityData = _.find(data, (item) => selector(item).indexOf(identityStr) === 0);
	if (identityData) {
		return identityData;
	}

	if (identityStr[0] === "#") {
		identityStr = identityStr.substr(1);
	}

	var index = parseInt(identityStr, 10) - 1;
	if (index >= 0 && index < data.length) {
		return data[index];
	}

	return undefined;
}

export function exitOnStdinEnd(): void {
	process.stdin.on("data", () => {});
	process.stdin.on("end", () => process.exit());
}

export function versionCompare(version1: string, version2: string): number {
	version1 = version1.split("-")[0];
	version2 = version2.split("-")[0];
	var v1array = _.map(version1.split("."), (x) => parseInt(x, 10)),
		v2array = _.map(version2.split("."), (x) => parseInt(x, 10));

	if (v1array.length !== v2array.length) {
		throw new Error("Version strings are not in the same format");
	}

	for (var i = 0; i < v1array.length; ++i) {
		if (v1array[i] !== v2array[i]) {
			return v1array[i] > v2array[i] ? 1 : -1;
		}
	} 

	return 0;
}

export function isInteractive(): boolean {
	return process.stdout.isTTY && process.stdin.isTTY;
}

export function toBoolean(str: string): boolean {
	return str === "true" ? true : false;
}

export function mergeRecursive(obj1: Object, obj2: Object): Object {
	for (var p in obj2) {
		if(!obj1.hasOwnProperty(p)) {
			obj1[p] = obj2[p];
			continue;
		}

		if (obj2[p].constructor === Object ) {
			obj1[p] = mergeRecursive(obj1[p], obj2[p]);
		} else {
			obj1[p] = obj2[p];
		}
	}

	return obj1;
}

export function block(operation: () => void): void {
	if (isInteractive()) {
		process.stdin.setRawMode(false);
	}
	operation();
	if (isInteractive()) {
		process.stdin.setRawMode(true);
	}
}

