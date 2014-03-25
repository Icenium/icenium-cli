/**
 * The Telerik Analytics module contains defines the `_eqatec` global variable that is the gateway
 * to interacting with the Telerik Analytics functionality.
 *
 * The main access to the functionality is provided by the {{#crossLink "AnalyticsMonitorFactory"}}{{/crossLink}}
 * static class which is exposed through the `_eqatec` global variable.
 *
 * To start using this module you should
 * generate a monitor instance by configuring a settings object (constructed via {{#crossLink "AnalyticsMonitorFactory/createSettings"}}{{/crossLink}})
 * and passing it to the {{#crossLink "AnalyticsMonitorFactory/createMonitor"}}{{/crossLink}} method. See the simple example below:
 *
 var settings = _eqatec.createSettings('YOUR-PRODUCT-KEY-HERE');
 // your adjustments to the settings...
 var monitor = _eqatec.createMonitor(settings);
 * @module Telerik Analytics
 */

(function (global) {
	global.navigator = {};
	// Defining a number of utility methods utilized internally
	var eqatecUtil = {
		// Returns true if the argument is a function
		isFunction: function (theArgument) {
			return theArgument && (typeof theArgument === "function");
		},
		// Essentially call function (if possible) and swallow any exception
		callIfFunction: function (callback) {
			try {
				if (eqatecUtil.isFunction(callback))
					callback();
			}
			catch (e) { }
		},
		// Returns true if the argument is a string
		isString: function (theArgument) {
			return theArgument && (typeof theArgument === "string");
		},
		// Returns the argument as a string, regardless of type
		asString: function (obj) {
			var ret = "";
			if (obj)
				ret = (eqatecUtil.isFunction(obj) ? eqatecUtil.asString(obj()) : obj.toString());
			return ret;
		},
		// Trim the string argument
		trim: function (str) {
			if (str) {
				if (!String.prototype.trim) {
					return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); //IE7 does not have trim on string object
				}
				return str.trim();
			}
			return "";
		},
		// Get a timestamp for the current time
		getTimeStamp: function () {
			return new Date().getTime(); //will return milliseconds since 1/1 1970
		},
		// Returns true if the argument is a number
		isNumber: function (val) {
			var to = typeof val;
			return (to === "number");
		},
		// parsing the argument as a url
		parseURL: function (url) {
			// inspired by http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
			var po = {
				key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
				reg: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
			};
			var uri = {}, i = 14;
			var parsed = po.reg.exec(url);
			while (i--) uri[po.key[i]] = parsed[i] || "";

			return uri;
		},
		// Returns the default server Uri, using the productid notation
		getServerUri: function (logger, productId, inputServerUri) {
			if (inputServerUri && eqatecUtil.isString(inputServerUri)) {
				try {
					// parsing into
					var parser = eqatecUtil.parseURL(inputServerUri);
					if (parser && parser.host) {
						var protocol = parser.protocol ? parser.protocol + "://" : "//";
						return protocol + parser.host + (parser.port ? ":" + parser.port : "") + "/json.ashx";
					}
					eqatecUtil.log(logger, 'Could not parse serverUri to valid format:' + inputServerUri);
				}
				catch (ex) {
					eqatecUtil.log(logger, 'unable to parse serverUri to valid format:' + inputServerUri);
				}
			}

			var targetProtocol = "https";
			if (global && global.location && global.location.protocol != "https:")
				targetProtocol = "http";
			return targetProtocol + "://" + productId + ".monitor-eqatec.com/json.ashx";
		},
		// Safely logs a message
		log: function (logger, message) {
			try {
				if (logger && eqatecUtil.isFunction(logger.logMessage) &&
					message && eqatecUtil.isString(message))
					logger.logMessage(message);
			}
			catch (e) { }
		},
		// Safely logs an error
		error: function (logger, message) {
			try {
				if (logger && eqatecUtil.isFunction(logger.logError) &&
					message && eqatecUtil.isString(message))
					logger.logError(message);
			}
			catch (e) { }
		},
		// Get the environment information of the current client
		getInfo: function (logger) {
			var info = {}, nav = global.navigator, scr = global.screen, doc = global.document;

			info.screen = scr ? scr.width + "x" + scr.height : "-";
			info.depth = scr ? scr.colorDepth + "-bit" : "-";

			if(nav) {
				info.language = (nav && (nav.language || nav.userLanguage) || "-").toLowerCase();
			}
			if(doc) {
				info.characterSet = doc.characterSet || doc.charset || "-";
				try {
					var docElem = doc.documentElement,
						docBody = doc.body,
						bodyDim = docBody && docBody["clientWidth"] && docBody["clientHeight"],
						dimensions = [];

					if (docElem) {
						if (docElem["clientWidth"] && docElem["clientHeight"] && ("CSS1Compat" === doc.compatMode || !bodyDim)) {
							dimensions = [docElem["clientWidth"], docElem["clientHeight"]];
						}
						else if (bodyDim) {
							dimensions = [docBody["clientWidth"], docBody["clientHeight"]];
						}
					}

					info.clientsize = dimensions.join("x");
				} catch (err) {
					eqatecUtil.error(logger, 'Unable to read browser info: ' + err.message);
				}
			}

			return info;
		},
		// generates a random id to simulate a guid
		generateId: function (productId) {
			// Code: random guid based off https://gist.github.com/1308368 (freely licensed)
			var f = function (a, b) {
				for (b = a = ''; a++ < 36; b += a * 51 & 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-');
				return b;
			};
			return f();
			// again random guid based off https://gist.github.com/982883  (freely licensed)
			//var x = function b(a) {
			//    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
			//}
		},
		// assign a cookie
		setCookie: function (name, value, path, expires, domain) {
			var doc = document;
			if (doc) {
				var cVal = name + "=" + value + ";path=" + path + ";";
				if (expires && expires > 0) {
					var t = new Date(eqatecUtil.getTimeStamp() + expires);
					cVal += "expires=" + t.toUTCString() + ";";
				}
				if (domain) {
					cVal += "domain=" + domain + ";";
				}

				doc.cookie = cVal;
			}
		},
		// read the value of a specifically named cookie
		getCookie: function (key) {
			// Separate key / value pairs
			var cookies = document.cookie.split(";");
			var index;
			for (index = 0; index < cookies.length; index++) {
				var cookieEntry = cookies[index].split("=");
				if (cookieEntry.length != 2)
					continue;

				var cKey = eqatecUtil.trim(cookieEntry[0]);
				if (key === cKey) {
					return eqatecUtil.trim(cookieEntry[1]);
				}
			}
			return null;
		},
		parseCookieStringToLiteral: function (decimalSeparatedString) {
			if (decimalSeparatedString) {
				var parts = decimalSeparatedString.split('.');
				if (parts.length == 2) {
					return {
						first: parts[0],
						second: parts[1]
					};
				}
			}
			return undefined;
		},
		// setting timeout on the window
		setTimeout: function (callback, timeoutInMilliseconds) {
			try {
				if (eqatecUtil.isFunction(callback) && eqatecUtil.isNumber(timeoutInMilliseconds)) {
					return global.setTimeout(callback, timeoutInMilliseconds);
				}
			}
			catch (e) { }
			return 0;
		},
		// clearing a timeout on the window with a specific timeout id
		clearTimeout: function (timeoutId) {
			try {
				if (eqatecUtil.isNumber(timeoutId))
					global.clearTimeout(timeoutId);
			}
			catch (e) { }
		},
		// returns true if cookies are enabled in browser
		cookiesEnabled: function () {
			try {
				var isCookieEnabled = (navigator.cookieEnabled) ? true : false;
				if (typeof navigator.cookieEnabled == "undefined" && !isCookieEnabled) {
					document.cookie = "testcookie";
					isCookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
				}
				return (isCookieEnabled);
			}
			catch (ex) { }
			return false;
		},
		// returns true if tracking is disabled in browser (e.g. DoNotTrack)
		trackingDisabled: function () {
			try {
				//                if (navigator) {
				//                    if ("1" == navigator.doNotTrack || "1" == navigator.msDoNotTrack)
				//                        return true;
				//                }
				//                if (global && global.external) {
				//                    if ((global.external.InPrivateFilteringEnabled && global.external.InPrivateFilteringEnabled())
				//                        ||
				//                        (global.external.msTrackingProtectionEnabled && global.external.msTrackingProtectionEnabled())
				//                        )
				//                        return true;
				//                }
			}
			catch (ex) { }
			return false;
		},
		// returns true if the given input is above the limitation
		stringTooLong: function (logger, input, limit) {
			if (!eqatecUtil.isString(input) || !eqatecUtil.isNumber(limit))
				return true;

			var inputStr = eqatecUtil.asString(input);
			if (inputStr.length > limit) {
				eqatecUtil.error(logger, 'Input is too long: ' + input);
				return true;
			}
			return false;
		}
	};

	// implementing just enough to do simple JSON encoding
	(function () {
		function a(b) {
			return 10 > b ? "0" + b : b;
		}
		function b(b) {
			d.lastIndex = 0;
			return d.test(b) ? '"' + b.replace(d, function (b) {
				var a = i[b];
				return "string" === typeof a ? a : "\\u" + ("0000" + b.charCodeAt(0).toString(16)).slice(-4);
			}) +
				'"' : '"' + b + '"';
		}
		function e(a, c) {
			var d, f, i, l, p = j, o, n = c[a];
			n && "object" === typeof n && "function" === typeof n.toJSON && (n = n.toJSON(a));
			"function" === typeof g && (n = g.call(c, a, n));
			switch (typeof n) {
				case "string":
					return b(n);
				case "number":
					return isFinite(n) ? "" + n : "null";
				case "boolean":
				case "null":
					return "" + n;
				case "object":
					if (!n)
						return "null";
					j += k;
					o = [];
					if ("[object Array]" === Object.prototype.toString.apply(n)) {
						l = n.length;
						for (d = 0; d < l; d += 1)
							o[d] = e(d, n) || "null";
						i = 0 === o.length ? "[]" : j ? "[\n" + j + o.join(",\n" + j) + "\n" + p + "]" : "[" +
							o.join(",") + "]";
						j = p;
						return i;
					}
					if (g && "object" === typeof g) {
						l = g.length;
						for (d = 0; d < l; d += 1)
							"string" === typeof g[d] && (f = g[d], (i = e(f, n)) && o.push(b(f) + (j ? ": " : ":") + i));
					} else
						for (f in n)
							Object.prototype.hasOwnProperty.call(n, f) && (i = e(f, n)) && o.push(b(f) + (j ? ": " : ":") + i);
					i = 0 === o.length ? "{}" : j ? "{\n" + j + o.join(",\n" + j) + "\n" + p + "}" : "{" + o.join(",") + "}";
					j = p;
					return i;
				default:
					return "" + n;
			}
		}
		var c;
		c || (c = {});
		"function" !== typeof Date.prototype.toJSON && (Date.prototype.toJSON = function () {
			return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + a(this.getUTCMonth() +
				1) + "-" + a(this.getUTCDate()) + "T" + a(this.getUTCHours()) + ":" + a(this.getUTCMinutes()) + ":" + a(this.getUTCSeconds()) + "Z" : null;
		}, String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () {
			return this.valueOf();
		});
		var d = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, j, k, i = { "\u0008": "\\b", "\t": "\\t", "\n": "\\n", "\u000c": "\\f", "\r": "\\r", '"': '\\"', "\\": "\\\\" }, g;
		"function" !== typeof c.stringify && (c.stringify = function (b, a, c) {
			var d;
			k = j = "";
			if ("number" === typeof c)
				for (d = 0; d < c; d += 1)
					k += " ";
			else
				"string" === typeof c && (k = c);
			if ((g = a) && "function" !== typeof a && ("object" !== typeof a || "number" !== typeof a.length))
				throw Error("JSON.stringify");
			return e("", { "": b });
		});
		eqatecUtil.encodeJSON = c.stringify;
	})(); //end of JSON encoder/decoder

	//stacktrace formatting from stacktrace.js
	// Note possible improvements using: http://blogs.msdn.com/b/ie/archive/2012/05/10/diagnosing-javascript-errors-faster-with-error-stack.aspx
	// and info from: http://wiki.ecmascript.org/doku.php?id=strawman:error_stack
	// (IE10+ only and different formats for each browser)
	(function () {
		function a(b) {
			b = b && b.e ? b.e : null;
			return (new a.implementation).run(b);
		}
		a.implementation = function () {
		};
		a.implementation.prototype = {
			run: function (b) {
				if (!b)
					return "";
				var a;
				if (!(a = b))
					a = void 0;
				b = a;
				a = this._mode || this.mode(b);

				if ("other" === a) {
					// there is issues with strict mode (in non-IE browsers)
					// since some of the functions up the stacktrace cannot access the
					// 'arguments', 'caller' and 'callee' methods.
					return this.other(arguments.callee);
				}
				else
					return this[a](b);
			},
			mode: function (b) {
				return b.arguments ? this._mode = "chrome" : global.opera && b.stacktrace ? this._mode = "opera10" : b.stack ? this._mode = "firefox" : global.opera && !("stacktrace" in b) ? this._mode = "opera" : this._mode = "other";
			},
			chrome: function (b) {
				return b.stack.replace(/^[^\(]+?[\n$]/gm, "").replace(/^\s+at\s+/gm, "").replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@").split("\n");
			},
			firefox: function (b) {
				return b.stack.replace(/(?:\n@:0)?\s+$/m, "").replace(/^\(/gm, "{anonymous}(").split("\n");
			},
			opera10: function (b) {
				var b =
					b.stacktrace.split("\n"), a = /.*line (\d+), column (\d+) in ((<anonymous function\:?\s*(\S+))|([^\(]+)\([^\)]*\))(?: in )?(.*)\s*$/i, c, d, j;
				for (c = 2, d = 0, j = b.length; c < j - 2; c++)
					if (a.test(b[c])) {
						var f = RegExp.$6 + ":" + RegExp.$1 + ":" + RegExp.$2, i = RegExp.$3, i = i.replace(/<anonymous function\:?\s?(\S+)?>/g, "{anonymous}");
						b[d++] = i + "@" + f;
					}
				b.splice(d, b.length - d);
				return b;
			},
			opera: function (b) {
				var b = b.message.split("\n"), a = /Line\s+(\d+).*script\s+(http\S+)(?:.*in\s+function\s+(\S+))?/i, c, d, f;
				for (c = 4, d = 0, f = b.length; c < f; c +=
					2)
					a.test(b[c]) && (b[d++] = (RegExp.$3 ? RegExp.$3 + "()@" + RegExp.$2 + RegExp.$1 : "{anonymous}()@" + RegExp.$2 + ":" + RegExp.$1) + " -- " + b[c + 1].replace(/^\s+/, ""));
				b.splice(d, b.length - d);
				return b;
			},
			other: function (b) {
				for (var a = /function\s*([\w\-$]+)?\s*\(/i, c = [], d = 0, f, k; b && 10 > c.length; ) {
					var r1 = a.test(b.toString());
					var args = [];
					try {
						args = Array.prototype.slice.call(b.arguments);
						b = b.caller;
					}
					catch (ex) {
						b = null;
					}
					f = r1 ? RegExp.$1 || "{anonymous}" : "{anonymous}",
						k = args,
						c[d++] = f + "(" + this.stringifyArguments(k) + ")";

					if (!b)
						break;
				}
				return c;
			},
			stringifyArguments: function (b) {
				for (var a = 0; a < b.length; ++a) {
					var c =
						b[a];
					void 0 === c ? b[a] = "undefined" : null === c ? b[a] = "null" : c.constructor && (c.constructor === Array ? b[a] = 3 > c.length ? "[" + this.stringifyArguments(c) + "]" : "[" + this.stringifyArguments(Array.prototype.slice.call(c, 0, 1)) + "..." + this.stringifyArguments(Array.prototype.slice.call(c, -1)) + "]" : c.constructor === Object ? b[a] = "#object" : c.constructor === Function ? b[a] = "#function" : c.constructor === String && (b[a] = '"' + c + '"'));
				}
				return b.join(",");
			}
		};
		eqatecUtil.stackTrace = a;
	})();

	// Encapsulating accessing the statistics
	function StatisticsContainer(theLogger) {
		var logger = theLogger;
		var isStarted = false;
		var installationId = "";
		var startTime = 0;
		var version = 1;
		var featureUsages = {};
		var featureValues = [];
		var exceptions = [];
		var restrictions = {
			maxFeatureNameLength: 1000,
			maxExceptions: 10,
			maxInstallationIdSize: 50
		};
		var StartSession = function () {
			startTime = eqatecUtil.getTimeStamp();
			isStarted = true;
		};
		var StopSession = function () {
			isStarted = false;
		};
		var getFeature = function (featureName) {
			if (!eqatecUtil.isString(featureName))
				return undefined;
			var name = eqatecUtil.trim(eqatecUtil.asString(featureName));
			if (name) {
				if (eqatecUtil.stringTooLong(logger, name, restrictions.maxFeatureNameLength))
					return null;

				// we use a prepending operation when assigning into the object-hash
				// to ensure we do not conflict with existing properties and/or
				// methods on the Object (such as hasOwnProperty or similar)
				var trackedName = "eq_" + featureName;
				var existingFeature = featureUsages[trackedName];
				if (!(existingFeature)) {
					existingFeature = {
						featureName: name,
						sessionHitCount: 0,
						timingStart: 0
					};
					featureUsages[trackedName] = existingFeature;
				}
				return existingFeature;
			}
			return null;
		};
		var GetVersion = function () {
			return version;
		};
		var AddFeatureUsage = function (featureName) {
			var feature = getFeature(featureName);
			if (feature) {
				feature.sessionHitCount += 1;
				version++;
			}
		};
		var StartFeatureTiming = function (featureName) {
			var feature = getFeature(featureName);
			if (feature) {
				if (feature.timingStart > 0)
					return;

				feature.timingStart = eqatecUtil.getTimeStamp();
			}
		};
		var EndFeatureTiming = function (featureName) {
			var feature = getFeature(featureName);
			if (feature) {
				if (feature.timingStart === 0)
					return;

				var timeStamp = eqatecUtil.getTimeStamp();
				var timeValue = timeStamp - feature.timingStart;
				feature.timingStart = 0;

				featureValues.push({
					name: feature.featureName,
					value: timeValue,
					type: 1,
					runtime: timeStamp - startTime
				});
				version++;
			}
		};
		var CancelFeatureTiming = function (featureName) {
			var feature = getFeature(featureName);
			if (feature) {
				feature.timingStart = 0;
			}
		};
		var AddFeatureValue = function (featureName, value) {
			var name = eqatecUtil.trim(eqatecUtil.asString(featureName));
			if (name && eqatecUtil.isNumber(value)) {
				var timeStamp = eqatecUtil.getTimeStamp();
				featureValues.push({
					name: name,
					value: value,
					type: 0,
					runtime: timeStamp - startTime
				});
				version++;
			}
		};
		var AddException = function (exc, message) {
			if (exc) {
				var contextMessage = eqatecUtil.asString(message);
				var timeStamp = eqatecUtil.getTimeStamp();
				var formattedStackTrace = "";
				var type = exc.name || typeof exc;
				var exmessage = exc.message || exc.name || "";

				try {
					formattedStackTrace = eqatecUtil.stackTrace({ e: exc });
				}
				catch (e) {
					eqatecUtil.error(logger, "could not format stacktrace: " + e.message);
				}

				if (exceptions.length > restrictions.maxExceptions) {
					eqatecUtil.logMessage(logger, "removing oldest exception");
					exceptions.pop(); //remove the oldest entry
				}

				exceptions.push({
					type: type,
					message: exmessage,
					runtime: timeStamp - startTime,
					info: contextMessage,
					stacktrace: formattedStackTrace
				});
				version++;
			}
		};
		var Reset = function () {
			exceptions = [];
			featureValues = [];
		};
		var Clear = function () {
			Reset();
			featureUsages = {};
		};
		var GetPayload = function () {
			var features = [];
			for (var f in featureUsages) {
				if (featureUsages.hasOwnProperty(f)) {
					var item = featureUsages[f];
					if (item.sessionHitCount) {
						features.push({
							name: item.featureName,
							sessionHitCount: item.sessionHitCount
						});
					}
				}
			}

			var session = {
				installationId: installationId,
				stopped: isStarted ? "0" : "1",
				features: features,
				exceptions: exceptions,
				featurevalues: featureValues
			};
			return session;
		};
		var SetInstallationID = function (installationID) {
			if (eqatecUtil.stringTooLong(logger, installationID, restrictions.maxInstallationIdSize))
				return;

			var str = eqatecUtil.asString(installationID);
			if (str) {
				installationId = str;
				version++;
			}
		};

		return {
			addFeatureUsage: AddFeatureUsage,
			startFeatureTiming: StartFeatureTiming,
			endFeatureTiming: EndFeatureTiming,
			cancelFeatureTiming: CancelFeatureTiming,
			addFeatureValue: AddFeatureValue,
			addException: AddException,
			setInstallationID: SetInstallationID,
			reset: Reset,
			clear: Clear,
			getPayload: GetPayload,
			startTime: startTime,
			version: GetVersion,
			startSession: StartSession,
			stopSession: StopSession
		};
	}

	/**
	 * Encapsulating the full API for the analytics monitor. This is the main monitor class and an instance
	 * is retrieved by calling the {{#crossLink "AnalyticsMonitorFactory/createMonitor"}}{{/crossLink}} method on
	 * the {{#crossLink "AnalyticsMonitorFactory"}}{{/crossLink}}. You should only
	 * create a single instance of this class for each specific product that you want to monitor which is typically
	 * only a single instance.
	 *
	 * Note that this class cannot be instantiated directly but must be created through a call to
	 * {{#crossLink "AnalyticsMonitorFactory/createMonitor"}}{{/crossLink}}
	 *
	 * @class AnalyticsMonitor
	 * @type {AnalyticsMonitor}
	 */
	function CreateAnalyticsMonitor(settings) {
		var startTime = 0,
			protocolVersion = 4,
		//the line below is modified by buildsever, do not change
			monitorversion = '0.0.0.0',

			productId = "",
			isStarted = false,
			logger = {
				logError: function () { },
				logMessage: function () { }
			},

			payloadsSend = 0,
			versionSend = 0,
			lastSendTime = 0,
			isSending = false,
			hasForceSyncBeenCalledWhileSending = false,
			startCount = 0,

			sessionId = "",
			userId = "",
			version = "",
			location = {},
			useCookies = false,
			isDisabled = false,
			serverUri = '',
			statisticsContainer = {};

		// self-executing anonymous function, essentially the constructor...
		(function () {
			try {
				settings = settings || {};
				productId = eqatecUtil.trim(eqatecUtil.asString(settings.productId)) || "";
				logger = settings.loggingInterface || logger;
				version = settings.version;
				location = settings.location || {};
				useCookies = eqatecUtil.cookiesEnabled() && settings.useCookies;
				isDisabled = eqatecUtil.trackingDisabled();

				serverUri = eqatecUtil.getServerUri(logger, productId, settings.serverUri);
				statisticsContainer = StatisticsContainer(logger);

				if (productId.length < 32 || productId.length > 36)
					eqatecUtil.error(logger, 'Invalid productId assigned, expecting between 32 and 36 characters: ' + productId);
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while initializing monitor');
			}
		})();

		var Start = function () {
			try {
				if (isStarted || isDisabled)
					return;

				var resultingSessionId = '';
				var resultingUserId = userId || '';
				var resultingStartCount = 1;
				var resultingStartTime = eqatecUtil.getTimeStamp();
				if (useCookies) {
					// if cookies are enabled, we try to recreate the sessionid and userid from the
					// cookies and store them again
					var isNewSession = false;
					var path = "/";
					var domain = "";

					// check if the session cookie is already assigned
					var sessionCookieValue = eqatecUtil.getCookie("__eqtSession");
					var parsedLiteral = eqatecUtil.parseCookieStringToLiteral(sessionCookieValue);
					if (!parsedLiteral) {
						//can't seem to find a valid session cookie, so we'll create a new one
						resultingSessionId = eqatecUtil.generateId(productId);
						isNewSession = true;

						// this is a session cookie, maintained by the browser, so no expiration
						// on this item...
						sessionCookieValue = resultingSessionId + "." + resultingStartTime;
						eqatecUtil.setCookie("__eqtSession", sessionCookieValue, path, 0, domain);
					} else {
						//parse the session cookie into an id and a start time
						resultingSessionId = parsedLiteral.first;
						resultingStartTime = parseInt(parsedLiteral.second);
					}

					// if no user id is assigned, we'll generate a new user id and push to cookies
					var existingUserId = eqatecUtil.getCookie("__eqtUser");
					parsedLiteral = eqatecUtil.parseCookieStringToLiteral(existingUserId);
					if (!parsedLiteral) {
						resultingUserId = eqatecUtil.generateId(productId);
						resultingStartCount = 1;
					}
					else {
						resultingUserId = parsedLiteral.first || eqatecUtil.generateId(productId);
						resultingStartCount = parseInt(parsedLiteral.second) + (isNewSession ? 1 : 0);
					}

					var userIdTimeout = 1000 * 60 * 60 * 24 * 365; // 1 year
					var userCookieValue = resultingUserId + "." + resultingStartCount;
					eqatecUtil.setCookie("__eqtUser", userCookieValue, path, userIdTimeout, domain);
				}

				sessionId = resultingSessionId || eqatecUtil.generateId(productId); // from the cookie or generate new
				userId = resultingUserId; // only get a userid if received from cookies
				startCount = resultingStartCount;
				startTime = resultingStartTime;
				statisticsContainer.startSession();
				payloadsSend = 0;
				statisticsContainer.clear();
				isStarted = true;
				eqatecUtil.log(logger, 'monitor has started, connecting to ' + serverUri);

				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling start. ' + e.description);
			}
		};
		var Stop = function () {
			try {
				if (!isStarted || isDisabled)
					return;

				if (useCookies) {
					// explicitly clear the session id from cookies
					eqatecUtil.setCookie("__eqtSession", "");
				}
				statisticsContainer.stopSession();

				ForceSync(true);
				isStarted = false;
				eqatecUtil.log(logger, 'monitor has stopped');
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling stop');
			}
		};
		var SetInstallationID = function (installationID) {
			try {
				statisticsContainer.setInstallationID(installationID);
				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling setInstallationID');
			}
		};
		var SetUserID = function (userid) {
			try {
				if (userId) {
					eqatecUtil.logMessage(logger, 'UserID has already been assigned');
					return;
				}
				if (userid) {
					userId = eqatecUtil.asString(userid);
					ForceSync();
				}
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling setUserID');
			}
		};
		var TrackFeature = function (featureName) {
			try {
				if (!isStarted) {
					eqatecUtil.log(logger, 'Monitor is not started');
					return;
				}

				statisticsContainer.addFeatureUsage(featureName);
				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackFeature');
			}
		};
		var TrackException = function (exceptionInstance, message) {
			try {
				if (!isStarted)
					return;
				statisticsContainer.addException(exceptionInstance, message);
				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackException');
			}
		};
		var TrackValue = function (featureName, value) {
			try {
				if (!isStarted)
					return;

				statisticsContainer.addFeatureValue(featureName, value);
				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackFeatureValue');
			}
		};
		var TrackFeatureStart = function (featureName) {
			try {
				if (!isStarted)
					return;

				statisticsContainer.startFeatureTiming(featureName);
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackFeatureStart');
			}
		};
		var TrackFeatureStop = function (featureName) {
			try {
				if (!isStarted)
					return;

				statisticsContainer.endFeatureTiming(featureName);
				ForceSync();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackFeatureStop');
			}
		};
		var TrackFeatureCancel = function (featureName) {
			try {
				if (!isStarted)
					return;

				statisticsContainer.cancelFeatureTiming(featureName);
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling trackFeatureCancel');
			}
		};
		var ForceSync = function (isStopMessage) {
			try {
				if (!isStarted && !isStopMessage) {
					eqatecUtil.log(logger, "monitor not started");
					return;
				}

				if (isSending && !isStopMessage) {
					hasForceSyncBeenCalledWhileSending = true;
					return;
				}

				sendPayloadToServer(isStopMessage);
				statisticsContainer.reset();
			}
			catch (e) {
				eqatecUtil.log(logger, 'failed while calling forceSync');
			}
		};
		var createPayload = function (queryStringArray) {
			var clientTime = eqatecUtil.getTimeStamp();
			var runtime = (clientTime - startTime);
			var payload = {
				version: version,
				monitorversion: monitorversion,
				productId: productId,
				sessionId: sessionId,
				startCount: startCount,
				userId: userId,
				runtime: runtime,
				clienttime: clientTime,
				starttime: startTime,
				session: statisticsContainer.getPayload()
			};

			if (location && location.latitude && location.longitude) {
				payload.location = location;
			}

			// pushing state onto array for query string
			queryStringArray.push("pv=" + protocolVersion); //protocol version 5
			queryStringArray.push("mv=" + monitorversion); //protocol version 5
			queryStringArray.push("pi=" + encodeURIComponent(productId));
			queryStringArray.push("av=" + encodeURIComponent(version));
			queryStringArray.push("mt=js");
			queryStringArray.push("ps=" + (payloadsSend + 1));
			queryStringArray.push("ct=" + clientTime);
			queryStringArray.push("rt=" + runtime);

			// add 'os-info' if not already delivered
			if (payloadsSend === 0)
				payload.info = eqatecUtil.getInfo(logger);

			return eqatecUtil.encodeJSON(payload);
		};

		var sendPayloadToServer = function (isStopMessage) {
			try {
				var successPostFix = isStopMessage === true ? " Monitor stopped." : "";
				lastSendTime = eqatecUtil.getTimeStamp();
				hasForceSyncBeenCalledWhileSending = false;
				var requestObject, jsonData;
				var qs = [];
				var versionSending = statisticsContainer.version(); //the version of the statistics that is being send
				jsonData = createPayload(qs);
				var queryString = "?" + qs.join('&');
				var fullUri = serverUri + queryString;

				// determine if we need to use the XDomainRequest or XMLHttpRequest to
				// access remote server. Most likely a cross-origin server so IE8 + IE9 should
				// use XDomainRequest while others can use XMLHttpRequest. Note that we prefer XHR
				// over XDR in IE10 by testing for XMLHttpRequest and withcredentials (see )

				if (XMLHttpRequest && requestObject === undefined) {
					var request = new XMLHttpRequest();
					var isHttps = navigator || navagator.location || navagator.location.protocol === "https";

					if(isHttps && useCookies && (!("withCredentials" in request) || request.withCredentials === undefined)) {
						eqatecUtil.log(logger, "CORS with cookies are not supported");
					}

					request.open("POST", fullUri, true);
					request.setRequestHeader("Content-Type", "text/plain"); //sending text/plain for now,
					request.setRequestHeader("User-Agent", userAgent);

					request.onreadystatechange = function () {
						try {
							if (4 == request.readyState) {
								isSending = false;
								var statusText = eqatecUtil.asString(request.status);
								var success = statusText.indexOf('2') === 0; //looking for HTTP status codes 2XX to signal success
								if (success) {
									payloadsSend++;
									versionSend = versionSending;
									eqatecUtil.log(logger, 'Statistics was sent successfully (xhr).' + successPostFix);
								}
								else {
									eqatecUtil.log(logger, 'Statistics failed to be sent: ' + statusText);
								}

								if (hasForceSyncBeenCalledWhileSending) {
									ForceSync();
								}
							}
						}
						catch (ex) {
							eqatecUtil.error(logger, 'failed to handle server reply');
						}
					};
					requestObject = request; //CORS only support here (see http://www.html5rocks.com/en/tutorials/cors/)
				}
				if (global.XDomainRequest !== undefined && requestObject === undefined) {
					requestObject = new global.XDomainRequest();
					requestObject.open("POST", fullUri);

					// seems that we need to specify all event handlers, some just empty for now
					// http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
					requestObject.onprogress = function () { };
					requestObject.onerror = function () {
						isSending = false;
						eqatecUtil.log(logger, 'Statistics failed to be sent. (XDomainRequest error)');
					};
					requestObject.onload = function () {
						payloadsSend++;
						versionSend = versionSending;
						isSending = false;
						eqatecUtil.log(logger, 'Statistics was sent successfully (xdr).' + successPostFix);
						if (hasForceSyncBeenCalledWhileSending) {
							ForceSync();
						}
					};
					requestObject.ontimeout = function () {
						isSending = false;
						eqatecUtil.log(logger, 'Statistics failed to be sent. Timeout');
					};

					// NOTE: not setting the content-type (is automatic text/plain)
					// http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
				}

				if (requestObject && jsonData) {
					//initiate the async request
					requestObject.send(jsonData);
					isSending = true;
				}
				else {
					eqatecUtil.log(logger, 'Statistics failed to be sent. No valid request object could be created.');
				}
			}
			catch (e) {
				eqatecUtil.error(logger, 'failed to send data:' + e.message);
			}
		};
		var GetStatus = function () {
			/**
			 * Represents the current status in the monitor. Note that this is a snapshot
			 * status and is not updated after is has been retrieved.
			 *
			 * Note that this class cannot be instantiated directly but is retrieved through a call to
			 * the status property on the {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance.
			 *
			 * @class AnalyticsMonitorStatus
			 * @type {AnalyticsMonitorStatus}
			 */
			return {
				/**
				 * The number of payloads successfully sent to the server.
				 * @property payloads
				 * @type {Number}
				 * @for AnalyticsMonitorStatus
				 */
				payloads: payloadsSend,
				/**
				 * Returns true if the monitor is started
				 * @property isStarted
				 * @for AnalyticsMonitorStatus
				 * @type {Boolean}
				 */
				isStarted: isStarted,
				/**
				 * Returns true if the monitor has been disabled. The monitor is automatically
				 * disabled if the hosting browser has `DoNotTrack` assigned.
				 * @property isDisabled
				 * @for AnalyticsMonitorStatus
				 * @type {Boolean}
				 */
				isDisabled: isDisabled
			};
		};

		var am = {
			/**
			 * Starting the monitor. If the monitor is disabled a call to start has no effect.
			 * @method start
			 * @for AnalyticsMonitor
			 */
			start: Start,
			/**
			 * Stopping the monitor. Will stop the monitor if already started and
			 * attempt to deliver data to the servers as part of stopping
			 * @method stop
			 * @for AnalyticsMonitor
			 */
			stop: Stop,
			/**
			 * Assigning the installation id. The installation id can be used to associate the data with a
			 * specific identifier. This can be used to e.g. associate all data from a given logic department
			 * with the same identifier
			 * @method setInstallationID
			 * @param installationID {String} the installation id
			 * @for AnalyticsMonitor
			 */
			setInstallationID: SetInstallationID,
			/**
			 * Assigning the user id. The user id can be assigned by the caller to signal a specific user identifier
			 * to associate with this data. This is mainly used in order to compensate for lack of cookie support
			 * and it is recommended to provide e.g. an anonymous value such as a hash of a user id. Note that
			 * you need to call this before starting the monitor, otherwise this value does not have any effect.
			 * @method setUserID
			 * @param userID {String} the user id
			 * @for AnalyticsMonitor
			 */
			setUserID: SetUserID,
			/**
			 * Tracking a named feature. Tracking a feature will increment the usage of this
			 * named feature. Consider using a simple dot-notation to group features that are comparable.
			 * In the example below the PDF and HTML report trackings are grouped and are immediately
			 * comparable

			 ...
			 if (usePDF)
			 {
			  monitor.trackFeature('Report.PDF');
			  // generate the PDF report
			  }
			 else
			 {
			  monitor.trackFeature('Report.HTML');
			  // generate the HTML report
			  }

			 * @method trackFeature
			 * @param featureName {String} the feature name
			 * @for AnalyticsMonitor
			 */
			trackFeature: TrackFeature,
			/**
			 * Tracking an exception instance. This call will attempt to extract general information from the
			 * exception. The context message can be passed to give more context to the exception.
			 * @method trackException
			 * @param exception {Error} the exception object
			 * @param message {String} a context message
			 * @for AnalyticsMonitor
			 */
			trackException: TrackException,
			/**
			 * Tracking a discrete feature value. Call this to associate a specific discrete value
			 * with a named feature.
			 * @method trackFeatureValue
			 * @param featureName {String} the feature name
			 * @param featureValue {Number} the feature value
			 * @for AnalyticsMonitor
			 */
			trackFeatureValue: TrackValue,
			/**
			 * Tracking the start of a feature timing. Call this to signal the start of timing
			 * for a specific named feature. The timing can later by registered by calling
			 * {{#crossLink "AnalyticsMonitor/trackFeatureStop"}}{{/crossLink}}
			 * or cancelled by calling {{#crossLink "AnalyticsMonitor/trackFeatureCancel"}}{{/crossLink}}.
			 * @method trackFeatureStart
			 * @param featureName {String} the feature name
			 * @for AnalyticsMonitor
			 */
			trackFeatureStart: TrackFeatureStart,
			/**
			 * Stopping and registering a feature timing. This only has an effect if there has been a previous
			 * call to {{#crossLink "AnalyticsMonitor/trackFeatureStart"}}{{/crossLink}} with the same feature name in
			 * which case the timing is registered.
			 * @method trackFeatureStop
			 * @param featureName {String} the feature name
			 * @for AnalyticsMonitor
			 */
			trackFeatureStop: TrackFeatureStop,
			/**
			 * Cancelling an ongoing feature timing. This only has an effect if there has been a previous
			 * call to {{#crossLink "AnalyticsMonitor/trackFeatureStart"}}{{/crossLink}} with the same name in which case the timing is discarded and reset.
			 * @method trackFeatureCancel
			 * @param featureName {String} the feature name
			 * @for AnalyticsMonitor
			 */
			trackFeatureCancel: TrackFeatureCancel,
			//            /**
			//            * Forcing the monitor to send data to the servers. Note that nothing will be delivered
			//            * if the monitor has not been started or the monitor is disabled. Delivering data is
			//            * performed asynchronously and this method does not wait for data to have been delivered.
			//            * The results of delivering data can be accessed either as messages from the logging interface
			//            * or by monitoring the payloads property of {{#crossLink "AnalyticsMonitorStatus"}}{{/crossLink}}.
			//            * @method forceSync
			//            * @for AnalyticsMonitor
			//            */
			//            forceSync: ForceSync,
			/**
			 * Retrieving the current status of the monitor. Note that the status is a snapshot
			 * and is not updated after being returned from this method.
			 * @method status
			 * @for AnalyticsMonitor
			 * @return {AnalyticsMonitorStatus}
			 */
			status: GetStatus
		};
		if (global._eqatecDebug)
			am['statisticsContainer'] = statisticsContainer;
		return am;
	};

	/**
	 * Class encapsulating the settings used for creating the monitor, Adjust these settings
	 * to customize the behavior of the {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} that can be created using
	 * the {{#crossLink "AnalyticsMonitorFactory/createMonitor"}}{{/crossLink}} method.
	 *
	 * Note that this class cannot be instantiated directly but is constructed through a call to
	 * {{#crossLink "AnalyticsMonitorFactory/createSettings"}}{{/crossLink}}.
	 *
	 * @class AnalyticsMonitorSettings
	 * @type {AnalyticsMonitorSettings}
	 */
	function CreateSettings(productId) {
		return {
			/**
			 * The product Id that identifies your application
			 * @property productId
			 * @for AnalyticsMonitorSettings
			 * @type {String}
			 */
			productId: productId,
			/**
			 * The server uri that specifies a custom server endpoint. The default is the empty string.
			 * @property serverUri
			 * @for AnalyticsMonitorSettings
			 * @type {String}
			 */
			serverUri: "",
			/**
			 * The logging interface to be used within the constructed {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance. By default the
			 * logging interface is not specified. You can assign any object to this property that exposes
			 * the same interface as `Logger` to customize your logging behavior. For instance:

			 var myLogger = {
      logMessage : function(msg){ ... },
      logError : function(errorMessage) {...}
      }
			 var settings = _eqatec.createSettings('YOUR_PRODUCT_KEY_HERE');
			 settings.loggingInterface = myLogger;


			 * @property loggingInterface
			 * @for AnalyticsMonitorSettings
			 * @type {Logger}
			 */
			loggingInterface: undefined,
			/**
			 * The version of your application, if available, in the format major.minor.build.revision. The default
			 *  version is 0.0.0.0.
			 * @property version
			 * @for AnalyticsMonitorSettings
			 * @type {String}
			 */
			version: "0.0.0.0",
			/**
			 * Determines if the monitor can interact with the cookies of the user agent for storing
			 * meta data between application start. Note that cookies are stored as third party
			 * cookies. By default this is true.
			 * @property useCookies
			 * @for AnalyticsMonitorSettings
			 * @type {Boolean}
			 */
			useCookies: true,
			/**
			 * The location of the tracking, if available. Can be assigned to a specific latitude and longitude. By
			 * default a non-specified location is provided.
			 * @property location
			 * @for AnalyticsMonitorSettings
			 * @type {Location}
			 */
			location: {
				/**
				 * Represents a location given by a latitude and a longitude.
				 * @class Location
				 * @type {Location}
				 */

				/**
				 * The latitude which is empty by default.
				 * @property latitude
				 * @for Location
				 * @type {String}
				 */
				latitude: '',
				/**
				 * The longitude which is empty by default.
				 * @property longitude
				 * @for Location
				 * @type {String}
				 */
				longitude: ''
			}
		};
	};

	/**
	 * Defines the interface type that is required for the logging interface.
	 *
	 * Note that this is not a class that can be constructed but merely defines the logging interface.
	 * @class Logger
	 * @type {Logger}
	 */
	/**
	 * Function for logging a message
	 * @method logMessage
	 * @param msg {string} the message
	 * @for Logger
	 */
	/**
	 * Function for logging an error message
	 * @method logError
	 * @param msg {string} the error message
	 * @for Logger
	 */

	/**
	 * The default logger, which logs messages and errors from within the {{#crossLink "AnalyticsMonitor"}}{{/crossLink}}
	 * instance to the console, if possible.
	 *
	 * Note that this class cannot be constructed but is created through a call to
	 * {{#crossLink "AnalyticsMonitorFactory/createTraceLogger"}}{{/crossLink}} on the {{#crossLink "AnalyticsMonitorFactory"}}{{/crossLink}}
	 *
	 * @class TraceLogger
	 * @type {TraceLogger}
	 * @extends {Logger}
	 */
	function CreateLogger() {
		var log = function (prefix, message) {
			if (console && console.log && eqatecUtil.isFunction(console.log) && message) {
				console.log(prefix + message);
			}
		};
		return {
			/**
			 * Function for logging a message
			 * @method logMessage
			 * @param msg {string} the message
			 * @for TraceLogger
			 */
			logMessage: function (msg) { log('', msg); },
			/**
			 * Function for logging an error message
			 * @method logError
			 * @param msg {string} the error message
			 * @for TraceLogger
			 */
			logError: function (msg) { log('Error: ', msg); }
		};
	};

	/**
	 * The AnalyticsMonitor factory. Use
	 * this factory to construct your specific {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance to interact with from
	 * your application.
	 *
	 * Note that this class cannot be constructed but is accessed via the `_eqatec` global variable.
	 *
	 * @class AnalyticsMonitorFactory
	 * @static
	 * @type {AnalyticsMonitorFactory}
	 */
	var eqt = global._eqatec || {};
	global._eqatec = eqt;

	/**
	 * Creates an {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance that can be used within your application.
	 * @method createMonitor
	 * @param settings {AnalyticsMonitorSettings} the settings to use for the analytics monitor
	 * @for AnalyticsMonitorFactory
	 * @return {AnalyticsMonitor}
	 */
	eqt.createMonitor = CreateAnalyticsMonitor;
	/**
	 * Creates a settings object for constructing an {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance. You can modify this
	 * settings object and pass it in to the {{#crossLink "AnalyticsMonitorFactory/createMonitor"}}{{/crossLink}} call to create the
	 * specific {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance to use in your application.
	 *
	 * @method createSettings
	 * @param productId {String} the productId that identifies your application
	 * @for AnalyticsMonitorFactory
	 * @return {AnalyticsMonitorSettings}
	 */
	eqt.createSettings = CreateSettings;
	/**
	 * Creates a default logger to be used in an {{#crossLink "AnalyticsMonitor"}}{{/crossLink}} instance. This default logger will log messages
	 * and errors to the console, if possible. Note that you can create your own logging implementation
	 * by providing a literal with functions `logError` and `logMessage` that takes a single message as argument (similar
	 * to the `Logger` interface).
	 *
	 * @method createTraceLogger
	 * @for AnalyticsMonitorFactory
	 * @return {TraceLogger}
	 */
	eqt.createTraceLogger = CreateLogger;

	// 'Leaking' internal utility function to allow for more elaborate testing
	if (global._eqatecDebug)
		eqt['eqatecUtil'] = eqatecUtil;
})(global);