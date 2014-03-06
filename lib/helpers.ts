///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import path = require("path");
import _ = require("underscore");
import util = require("util");
import querystring = require("querystring");
import log = require("./logger");
import Future = require("fibers/future");

function enumerateFilesInDirectorySyncRecursive(foundFiles, directoryPath, filterCallback) {
	var contents = fs.readdirSync(directoryPath);
	for (var i = 0; i < contents.length; ++i) {
		var file = path.join(directoryPath, contents[i]);
		var stat = fs.statSync(file);
		if (filterCallback && !filterCallback(file, stat)) {
			continue;
		}

		if (stat.isDirectory()) {
			enumerateFilesInDirectorySyncRecursive(foundFiles, file, filterCallback);
		} else {
			foundFiles.push(file);
		}
	}
}

// filterCallback: function(path: String, stat: fs.Stats): Boolean
export function enumerateFilesInDirectorySync(directoryPath, filterCallback?: (file: string, stat: fs.Stats) => boolean) {
	var result = [];
	enumerateFilesInDirectorySyncRecursive(result, directoryPath, filterCallback);
	return result;
}

export function createQrUrl(data) {
	var $config = $injector.resolve("config");
	return util.format("http://api.qrserver.com/v1/create-qr-code/?size=%dx%d&qzone=4&data=%s",
		$config.QR_SIZE, $config.QR_SIZE, querystring.escape(data));
}

export function fromWindowsRelativePathToUnix(windowsRelativePath) {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function isRequestSuccessful(request) {
	return request.statusCode >= 200 && request.statusCode < 300;
}

export function getRelativeToRootPath(rootPath, filePath) {
	var relativeToRootPath = filePath.substr(rootPath.length);
	return relativeToRootPath;
}

export function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export function toHash(collection, keySelector, valueSelector): any {
	var result = {};
	if (_.isArray(collection)) {
		for (var i = 0; i < collection.length; ++i) {
			result[keySelector(collection[i], i, collection)] =
				valueSelector(collection[i], i, collection);
		}
	} else {
		Object.keys(collection).forEach(function(key) {
			result[keySelector(collection[key], key, collection)] =
				valueSelector(collection[key], key, collection);
		});
	}
	return result;
}

var _projectFileSchema;
export function getProjectFileSchema(): any {
	if (!_projectFileSchema) {
		var propPath = path.join(__dirname, "../resources/project-properties.json");
		var contents = fs.readFileSync(propPath, { encoding: "utf8" });
		_projectFileSchema = JSON.parse(contents);
	}
	return _projectFileSchema;
}

export function isStringOptionEmpty(optionValue) {
	return optionValue === undefined || optionValue === null || optionValue === "null" || optionValue === "false" || optionValue === "true";
}

export function registerCommand(module: string, commandName: string, executor: (module, args: string[]) => IFuture<void>) {
	var factory = function (): ICommand {
		return {
			execute: (args: string[]): IFuture<void> => {
				var mod = $injector.resolve(module);
				return executor(mod, args);
			}
		};
	};

	$injector.registerCommand(commandName, factory);
}

export function isWindows() {
	return /^win/.test(process.platform);
}

export function isWindows64() {
	return process.arch === "x64" && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")
}

export function isWindows32() {
	return isWindows() && !isWindows64();
}

export function isDarwin() {
	return process.platform.toUpperCase() === "DARWIN";
}

export function stringReplaceAll(string: string, find: any, replace: string): string {
	return string.split(find).join(replace);
}

export function isNullOrWhitespace(input: string): boolean {
	if (!input) {
		return true;
	}

	return input.replace(/\s/gi, '').length < 1;
}

export function formatListOfNames(names: string[]): string {
	if (names.length <= 1) {
		return names[0];
	} else {
		return names.slice(0, -1).join(", ") + " or " + names[names.length - 1];
	}
}

export function getCountries() {
	return ["Afghanistan", "Aland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina",
		"Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
		"Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam",
		"Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile",
		"China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo, The Democratic Republic of The", "Cook Islands", "Costa Rica",
		"Cote D'ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
		"Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana",
		"French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada",
		"Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-bissau", "Guyana", "Haiti", "Heard Island and Mcdonald Islands", "Holy See (Vatican City State)",
		"Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica",
		"Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan",
		"Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libyan Arab Jamahiriya", "Liechtenstein", "Lithuania", "Luxembourg",
		"Macao", "Macedonia, The Former Yugoslav Republic of", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania",
		"Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Moldova, Republic of", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco",
		"Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria",
		"Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestinian Territory, Occupied", "Panama", "Papua New Guinea",
		"Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation", "Rwanda", "Saint Helena",
		"Saint Kitts and Nevis", "Saint Lucia", "Saint Pierre and Miquelon", "Saint Vincent and The Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
		"Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
		"South Georgia and The South Sandwich Islands", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland",
		"Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of", "Thailand", "Timor-leste", "Togo", "Tokelau", "Tonga",
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

	var extents = _.map(columnList, (sublist) => _.max(sublist, (element) => element.length).length);

	var formattedRows = [];
	var width: number;
	for (var r = 0; r < rows; ++r) {
		var rowItems = [];
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
