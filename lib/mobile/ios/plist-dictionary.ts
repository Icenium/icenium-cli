///<reference path="../../.d.ts"/>

import plistlib = require("plistlib");
import _ = require("underscore");

export class PlistDictionary implements Mobile.IPlistDictionary {
	constructor(private $logger: ILogger) { }

	public createPlist(data: {[key: string]: {}}) : {} {
		var keys = _.keys(data);
		var values = _.values(data);
		var plist = {type: "dict", value: {}} ;

		for(var i=0; i<keys.length; i++) {
			var type = values[i] instanceof Object ? "dict" : "string";
			var value = type === "dict" ? {} : values[i];

			plist.value[keys[i]] = {type: type, value: value};
		}

		this.$logger.trace("created plist: '%s'" + plist);

		return plist;
	}

	public buildMessageTemplate(messageType: Mobile.MessageType): {} {
		return this.createPlist({
			"BundleID": "com.telerik.Ice",
			"ClientVersionString": "1.0",
			"MessageType": "Listen",
			"ProgName": "Ice"
		});
	}
}
$injector.register("plistDictionary", PlistDictionary);
