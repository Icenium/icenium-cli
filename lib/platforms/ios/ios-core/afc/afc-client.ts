///<reference path="../../../../.d.ts"/>

(function(){
    "use strict";
    var iOSCore = require("./../ios-core"),
        mobileDevice = require("./../mobile-device"),
        AfcFile = require("./afc-file"),
		os = require("os"),
        fs = require("fs"),
        binaryReader = require("binary-reader"),
		path = require("path");

	function AfcClient(service) {
        this._service = service;
        var afcConnection = iOSCore.alloc(iOSCore.AFCConnectionRef);
        var result = mobileDevice.functions.AFCConnectionOpen(this._service, 0, afcConnection);
        if(result !== 0) {
            throw "Unable to open apple file connection: " + result;
        }

        this._afcConnection = iOSCore.deref(afcConnection);
		this.writable = true;
    }

    AfcClient.prototype.open = function(path, mode){
        return new AfcFile(this._afcConnection, path, mode);
    };

    AfcClient.prototype.close = function() {
        mobileDevice.functions.AFCConnectionClose(this._afcConnection);
    };

    AfcClient.prototype.mkdir = function(path) {
        var result = mobileDevice.functions.AFCDirectoryCreate(this._afcConnection, path);
        if(result !== 0){
            throw "Unable to make directory: " + path + " result is: " + result;
        }
    };

    AfcClient.prototype.listdir = function(path) {
        var afcDirectoryRef = iOSCore.alloc(iOSCore.AFCDirectoryRef);
        var result = mobileDevice.functions.AFCDirectoryOpen(this._afcConnection, path, afcDirectoryRef);
        if(result !== 0) {
            throw "Unable to open AFC directory: " + path + result;
        }

        var afcDirectoryValue = iOSCore.deref(afcDirectoryRef);
        var name = iOSCore.alloc(iOSCore.charPtr);

        while(mobileDevice.functions.AFCDirectoryRead(this._afcConnection, afcDirectoryValue, name) === 0) {
            var value = iOSCore.deref(name);
            if(iOSCore.address(value) === 0) {
                break;
            }
            var filePath = iOSCore.readCString(value, 0);
            if(filePath !== "." && filePath !== "..") {
                console.log(filePath);
            }
        }

        mobileDevice.functions.AFCDirectoryClose(this._afcConnection, afcDirectoryValue);
    };

	AfcClient.prototype.transferPackage = function(localFilePath, devicePath, callback) {
		if(os.platform() === "win32") {
			try {
				var target = this.open(devicePath, "w");

				var readStream = fs.createReadStream(localFilePath);
				readStream.readable = true;

				readStream.on("data", function(data) {
					target.write(data, data.length);
				});

				readStream.on("end", function(){
					target.close();
					callback();
				});

				readStream.pipe(target);
			}
			catch(ex) {
				throw ex;
			}
		}
	};


    AfcClient.prototype.transferFile = function(localFilePath, devicePath, relativeToProjectBasePath) {
        if(os.platform() === "win32") {
            try {
                var arr = relativeToProjectBasePath.split("\\"),
                    fileName = arr[arr.length-1],
                    dirPath = "/Documents";

                for (var i=0;i<arr.length; i++) {

                    if (arr[i] !== "" && i !== (arr.length-1)) {

                        dirPath = path.join(dirPath, "/", arr[i]);
                        dirPath = dirPath.replace(/\\/g, "/");
                        this.mkdir(dirPath);
                    }
                }

                var targetPath = path.join(dirPath, "/", fileName);
                targetPath = targetPath.replace(/\\/g, "/");
                var target = this.open(targetPath, "w");
                var reader = binaryReader.open(localFilePath);

                reader.on("error", function(error){
					this._afcConnection.close();
					reader.close();
                    throw error;
                })
                .on("close", function(){

                })
                .read(fs.statSync(localFilePath).size, function(bytesRead, buffer){
                    target.write(buffer, bytesRead);
				});
            }
            catch(ex) {
                throw ex;
            }
        }
    };

    module.exports = AfcClient;

})();