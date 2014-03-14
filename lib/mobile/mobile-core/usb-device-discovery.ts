///<reference path="./../../.d.ts"/>
import net = require("net");
import plistlib = require("plistlib");
import bufferpack = require("bufferpack");
import Future = require("fibers/future");
import _ = require("underscore");
import plistparser = require("plist-parser");
import assert = require("assert");
import helpers = require("./../../helpers");
import Signal = require("./../../events/signal");

global.$injector = require("./../../yok").injector;

class Constants {
	public static SOCKET_HOST = "127.0.0.1";
	public static SOCKET_PORT = 27015;
	public static SOCKET_FILE = "/var/run/usbmuxd";

	public static MESSAGE_TYPE_LISTEN = "Listen";
	public static MESSAGE_TYPE_RESULT = "Result";
	public static MESSAGE_TYPE_ATTACHED = "Attached";
	public static MESSAGE_TYPE_DETACHED = "Detached";
}

class Header implements Mobile.IHeader {
	public static BYTE_LENGTH = 16;

	public get Length(): number { return this.length; }
	public get MessageType(): Mobile.MessageType { return this.messageType; }

	constructor(private length: number,
		private version: number,
		private messageType: Mobile.MessageType,
		private tag: number) { }

	public serialize(): NodeBuffer {
		var buffer = new Buffer(this.length);

		buffer.writeUInt32LE(this.length, 0);
		buffer.writeUInt32LE(this.version, 4);
		buffer.writeUInt32LE(this.messageType, 8);
		buffer.writeUInt32LE(this.tag, 12);

		return buffer;
	}

	public static tryDeserialize(reader: NodeBuffer): Header {
		assert.equal(reader.length, Header.BYTE_LENGTH, "tryDeserialize(): Wrong header length");

		var length = reader.readUInt32LE(0);
		var version = reader.readUInt32LE(4);
		var messageType = reader.readUInt32LE(8);
		var tag = reader.readUInt32LE(12);

		return new Header(length, version, messageType, tag);
	}
}

class Message implements Mobile.IMessage {
	constructor(private data: NodeBuffer) { }

	public get Data(): {[key: string]: string} {
		var result = new plistparser.PlistParser(this.data.toString()).parse();

		return result;
	}
}

class Communicator implements Mobile.ICommunicator {
	private socket: net.NodeSocket = null;
	private response: NodeBuffer = null;
	private currentPosition  = 0;

	public responseReceived :ISignal= null;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $injector: IInjector) {
		this.socket = new net.Socket();
		this.responseReceived = new Signal.Signal();
	}

	public connect(): void {
		if(helpers.isDarwin()) {
			this.socket.connect(Constants.SOCKET_FILE);
		} else if(helpers.isWindows()) {
			this.socket.connect(Constants.SOCKET_PORT, Constants.SOCKET_HOST);
		}
	}

	public send(dictionary: any, tag?: number): void {
		var data = plistlib.toString(dictionary);

		var header = new Header(data.length + Header.BYTE_LENGTH, 1, Mobile.MessageType.PList, !tag? 0 : tag);
		var buffer = header.serialize();
		buffer.write(data, Header.BYTE_LENGTH);

		this.socket.write(buffer);
		assert.equal(buffer.length, this.socket.bytesWritten, "Wrong amount of written bytes");
	}

	private getBytes(bytes: number): NodeBuffer {
		this.$logger.trace("current position: '%s' -> required bytes: '%s'", this.currentPosition, bytes);
		assert.ok(bytes + this.currentPosition <= this.response.length, "getBytes(): Wrong amount of required bytes");

		var buffer = this.response.slice(this.currentPosition, this.currentPosition + bytes);
		this.currentPosition += bytes;

		return buffer;
	}

	public receive(): Mobile.IMessage {
		var header: Mobile.IHeader = null;
		try {
			header = Header.tryDeserialize(this.getBytes(Header.BYTE_LENGTH));
		} catch(e) {
			this.$errors.fail("Invalid usbmux header received. '%s'", e);
		}

		var data = this.getBytes(header.Length - Header.BYTE_LENGTH);
		var message = this.$injector.resolve(Message, {data: data});

		this.$logger.trace("response keys: '%s', response values: '%s'", _.keys(message.Data), _.values(message.Data));

		return message;
	}

	public startListeningForData(): void {
		this.socket
			.on("data", (data) => {
				this.$logger.out("========================");
				this.$logger.out("The total amount: '%s', the current amount: '%s' of received bytes from socket", this.socket.bytesRead, data.length);

				this.concatData(data);

				if(data.length > Header.BYTE_LENGTH) {
					while(this.currentPosition < this.response.length) {
						var message = this.receive();
						if(message != null) {
							this.responseReceived.dispatch(message);
						}
					}
				}
			})
			.on("error", (error) => {
			});
	}

	private concatData(data: NodeBuffer) {
		var result: NodeBuffer = data;
		if(this.response) {
			result = Buffer.concat([this.response, data], this.response.length + data.length);
		}

		this.response = result;
	}
}
$injector.register("communicator", Communicator);

class UsbmuxDevice implements Mobile.IUsbmuxDevice {
	public DeviceId: number;
	public ConnectionType: string;
	public LocationId: number;
	public SerialNumber: string;
	public ProductId: number;

	constructor(properties) {
		this.DeviceId = properties["DeviceID"];
		this.ConnectionType = properties["ConnectionType"];
		this.LocationId = properties["LocationID"];
		this.SerialNumber = properties["SerialNumber"];
		this.ProductId = properties["ProductID"];
	}
}

export class UsbmuxDeviceListener implements Mobile.IUsbmuxDeviceListener {
	private listenCommunicator: Mobile.ICommunicator = null;
	private devices: {[key: string]: Mobile.IUsbmuxDevice} = {};
	private isConnectionInitialized = false;

	public deviceFound :ISignal= null;
	public deviceLost: ISignal = null;

	constructor(private $plistDictionary: Mobile.IPlistDictionary,
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector) {
		this.deviceFound =  new Signal.Signal();
		this.deviceLost =  new Signal.Signal();
	}

	public startListening(): void {
		this.listenCommunicator = this.$injector.resolve("communicator");
		try {
			this.listenCommunicator.connect();
			var plist = this.$plistDictionary.buildMessageTemplate(Mobile.MessageType.Listen);
			this.listenCommunicator.send(plist);

			this.listenCommunicator.responseReceived.add(this.onResponseReveived, this);
			this.listenCommunicator.startListeningForData();

		} catch(e) {
			this.$errors.fail("Could not connect to usbmux. '%s'", e);
		}
	}

	private onResponseReveived(message: Mobile.IMessage) {
		if(!this.isConnectionInitialized) {
			if(!this.isResponseOK(message)) {
				this.$errors.fail("Invalid response");
			}
			this.isConnectionInitialized = true;
		} else {
			this.processResponse(message.Data);
		}
	}

	private isResponseOK(response: Mobile.IMessage): boolean {
		var keys = _.keys(response.Data);

		return keys.contains("MessageType") && response.Data["MessageType"] === "Result" &&
			keys.contains("Number") && parseInt(response.Data["Number"], 10) === 0;
	}

	private processResponse(dictionary: {[key: string]: string}): void {
		this.$logger.trace(dictionary);
		var messageType = dictionary["MessageType"];

		if(messageType === Constants.MESSAGE_TYPE_ATTACHED) {
			var properties = dictionary["Properties"];
			var device = new UsbmuxDevice(properties);
			this.addDevice(device.DeviceId, device);
		} else if(messageType === Constants.MESSAGE_TYPE_DETACHED) {
			var deviceId = parseInt(dictionary["DeviceID"], 10);
			this.removeDevice(deviceId);
		}
	}

	private addDevice(deviceId: number, device: Mobile.IUsbmuxDevice) {
		if(!_.keys(this.devices).contains(deviceId)) {
			this.devices[deviceId] = device;
			this.deviceFound.dispatch(device);
		}
	}

	private removeDevice(deviceId: number) {
		if(_.keys(this.devices).contains(deviceId)) {
			var device = this.devices[deviceId];
			delete this.devices[deviceId];
			this.deviceLost.dispatch(device);
		}
	}
}

export class UsbDeviceDiscovery implements Mobile.IUsbDeviceDiscovery {
	public deviceFound :ISignal= null;
	public deviceLost: ISignal = null;

	constructor(private $injector: IInjector){
		this.deviceFound = new Signal.Signal();
		this.deviceLost = new Signal.Signal();
	}

	public run(): void {
		var listener = this.$injector.resolve(UsbmuxDeviceListener);

		listener.deviceFound.add(this.onDeviceFound, this);
		listener.deviceLost.add(this.onDeviceLost, this);

		listener.startListening();
	}

	private onDeviceFound(device: Mobile.IUsbmuxDevice) {
		this.deviceFound.dispatch();
		var iOSDeviceDiscovery = this.$injector.resolve("iOSDeviceDiscovery");
		iOSDeviceDiscovery.startLookingForDevices();
	}

	private onDeviceLost(device: Mobile.IUsbmuxDevice) {
		this.deviceLost.dispatch();
		var iOSDeviceDiscovery = this.$injector.resolve("iOSDeviceDiscovery");
		iOSDeviceDiscovery.startLookingForDevices();
		console.log("device found: '%s'", device.SerialNumber);
	}
}
$injector.register("usbDeviceDiscovery", UsbDeviceDiscovery);
