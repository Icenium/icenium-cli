import { WriteStream, ReadStream } from "tty";

export function fromWindowsRelativePathToUnix(windowsRelativePath: string): string {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function getRelativeToRootPath(rootPath: string, filePath: string): string {
	let relativeToRootPath = filePath.substr(rootPath.length);
	return relativeToRootPath;
}

export function toHash(collection: any,
	keySelector: (value: any, positionOrKey: any, _collection: any) => string,
	valueSelector: (_value: any, _positionOrKey: any, _collection1: any) => any
): any {
	let result: any = {};
	if (_.isArray(collection)) {
		for (let i = 0; i < collection.length; ++i) {
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

export function isStringOptionEmpty(optionValue: string): boolean {
	return optionValue === undefined || optionValue === null || optionValue === "null" || optionValue === "false" || optionValue === "true";
}

export function stringReplaceAll(inputString: string, find: any, replace: string): string {
	return inputString.split(find).join(replace);
}

export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatListOfNames(names: string[], conjunction?: string): string {
	conjunction = conjunction === undefined ? "or" : conjunction;

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
	let rows = Math.ceil(list.length / columns);
	let columnList = new Array<Array<string>>();
	for (let i = 0; i < columns; ++i) {
		columnList.push(_.take(list, rows));
		list = _.dropRight(list, rows);
	}

	let extents = _.map(columnList, (sublist) => _.maxBy(sublist, (element: string) => element.length).length);

	let formattedRows: string[] = [];
	let width: number;
	for (let r = 0; r < rows; ++r) {
		let rowItems: string[] = [];
		for (let c = 0; c < columns; ++c) {
			let item = columnList[c][r] || "";
			let padding = _.map(_.range(extents[c] - item.length), (x) => " ").join("");
			rowItems.push(item + padding);
		}
		let formattedRow = rowItems.join(" ");
		formattedRows.push(formattedRow);
		width = formattedRow.length;
	}
	return {
		formatted: formattedRows.join("\n"),
		width: width
	};
}

export function formatListForDisplayInMultipleColumns(list: string[]): string {
	let consoleWidth = (<WriteStream>process.stdout).columns;
	let bestFormatting: IFormatting;
	for (let i = 1; i <= 8; ++i) {
		let formatting = formatListInMultipleColumns(list, i);
		if (formatting.width <= consoleWidth || !bestFormatting) {
			bestFormatting = formatting;
		}
	}
	return bestFormatting.formatted;
}

export function findByNameOrIndex<T>(identityStr: string, data: T[], selector: (_item: T) => string): T {
	if (!identityStr) {
		return undefined;
	}

	data = _.sortBy(data, selector);

	let identityData = _.find(data, item => selector(item).indexOf(identityStr) === 0);
	if (identityData) {
		return identityData;
	}

	if (identityStr[0] === "#") {
		identityStr = identityStr.substr(1);
	}

	let index = parseInt(identityStr, 10) - 1;
	if (index >= 0 && index < data.length) {
		return data[index];
	}

	return undefined;
}

export function exitOnStdinEnd(): void {
	process.stdin.on("end", () => process.exit());
}

export function versionCompare(version1: string, version2: string): number {
	version1 = version1.split("-")[0];
	version2 = version2.split("-")[0];
	let v1array = _.map(version1.split("."), (x) => parseInt(x, 10)),
		v2array = _.map(version2.split("."), (x) => parseInt(x, 10));

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

export function isInteractive(): boolean {
	return process.stdout.isTTY && process.stdin.isTTY;
}

export function toBoolean(str: string): boolean {
	return str === "true" ? true : false;
}

export function mergeRecursive(obj1: Object, obj2: Object): Object {
	for (let p in obj2) {
		if (!obj1.hasOwnProperty(p)) {
			obj1[p] = obj2[p];
			continue;
		}

		if (obj2[p].constructor === Object) {
			obj1[p] = mergeRecursive(obj1[p], obj2[p]);
		} else {
			obj1[p] = obj2[p];
		}
	}

	return obj1;
}

export function block(operation: () => void): void {
	if (isInteractive()) {
		(<ReadStream>process.stdin).setRawMode(false);
	}
	operation();
	if (isInteractive()) {
		(<ReadStream>process.stdin).setRawMode(true);
	}
}

// Remove when node incorporates ES6 array.fill
export function fill(value: string, times: number): string[] {
	let repeatedValues: string[] = [];
	for (let repeat = 0; repeat < times; repeat++) {
		repeatedValues.push(value);
	}

	return repeatedValues;
}

function getDottedStringObjectRecursive(arr: string[], val: any): any {
	if (arr.length <= 0) {
		return val;
	}

	let first = _.head(arr),
		rest = _.tail(arr),
		result: any = {};

	if (_.isUndefined(result[first])) {
		result[first] = {};
	}

	result[first] = getDottedStringObjectRecursive(rest, val);
	return result;
}

export function convertDottedStringToObject(data: any): any {
	let output: any = {};

	if (_.isObject(data) && !_.isArray(data)) {
		_(data).keys().each(key => {
			if (data.hasOwnProperty(key)) {
				let dotSplit = key.split("."),
					value = data[key];

				_.extend(output, getDottedStringObjectRecursive(dotSplit, value));
			}
		});
	}

	return output;
}
