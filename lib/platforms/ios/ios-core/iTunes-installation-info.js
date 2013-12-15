(function(){
	"use strict";
	var iOSCore = require("./ios-core"),
        fs = require("fs"),
		path = require("path"),
		appleFolderLocation = null,
		errorMessage = null;

	function ITunesInstallationInfo() {
		this._appleFolderLocation = null;
        this._errorMessage = null;

        var isWindows64 = process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432");

        if(isWindows64) {
			processWindows64();
        }
        else {
			processWindows32();
        }
    }

	ITunesInstallationInfo.prototype.getErrorMessage = function() {
		return errorMessage;
	};

	ITunesInstallationInfo.prototype.getAppleFolderLocation = function() {
		return appleFolderLocation;
	};

    function processWindows32() {
        var pathToAppleFolder = path.join(process.env.CommonProgramFiles, "Apple"),
            existsPathToAppleFolder= fs.existsSync(pathToAppleFolder);

        if(!existsPathToAppleFolder){
            errorMessage = "iTunes is not installed.";
        }
        else {
            appleFolderLocation = pathToAppleFolder;
        }
    }

    function processWindows64() {
		var pathToAppleFolderW6432 = path.join(process.env.CommonProgramW6432, "Apple"),
			pathToAppleFolderX86 = path.join(process.env["CommonProgramFiles(x86)"], "Apple"),
			existsPathToAppleFolderW6432 = fs.existsSync(pathToAppleFolderW6432),
			existsPathToAppleFolderX86= fs.existsSync(pathToAppleFolderX86);

		if(iOSCore.pointerSize === 4) {
			if(!existsPathToAppleFolderX86 && existsPathToAppleFolderW6432) {
				errorMessage = "Wrong iTunes version. Please install itunes 32-bits version";
			}
			else if(!existsPathToAppleFolderX86 && !existsPathToAppleFolderW6432) {
				errorMessage = "iTunes is not installed.";
			}
			else {
				appleFolderLocation = pathToAppleFolderX86;
			}
		}
		else if(iOSCore.pointerSize === 8) {
			if(!existsPathToAppleFolderW6432 && existsPathToAppleFolderX86) {
				errorMessage = "Wrong iTunes version. Please install itunes 64-bits version";
			}
			else if(!existsPathToAppleFolderW6432 && !existsPathToAppleFolderX86) {
				errorMessage = "iTunes is not installed";
			}
			else {
				appleFolderLocation = pathToAppleFolderW6432;
			}
		}
    }

    module.exports = new ITunesInstallationInfo();
})();