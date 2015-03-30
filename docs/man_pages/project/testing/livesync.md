livesync
==========

Usage | Synopsis
------|-------
General | `$ appbuilder livesync [<Platform>] [--device <Device ID>] [--companion] [--watch]`    `$ appbuilder livesync [<Command>]`
Andorid | `$ appbuilder livesync android [--device <Device ID>] [--companion] [--watch]`
iOS | `$ appbuilder livesync ios [--device <Device ID>] [--companion] [--watch]`

Synchronizes the latest changes in your project to connected devices. In this version of the Telerik AppBuilder CLI,
you cannot synchronize changes to Windows Phone connected devices.
`<Device ID>` is the device index or identifier as listed by run `$ appbuilder device`
Options:
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device.
* `--device` - Specifies the serial number or the index of the connected device to which you want to synchronize changes. To list all connected devices, grouped by platform, run `$ appbuilder device`
* `--companion` - If set, when you save changes to the project, changes are automatically synchronized to the Telerik AppBuilder companion app.

`<Command>` is a related command that extends the livesync command. You can run the following related commands:
* `cloud` - Synchronizes the project with the cloud to enable LiveSync for remote devices (using the three finger tap and hold gesture).
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[build](build.html) | Builds the project for the target platform and produces an application package or a QR code for deployment.
[build android](build-android.html) | Builds the project for Android platform and produces an application package or a QR code for deployment.
[build ios](build-ios.html) | Builds the project for iOS platform and produces an application package or a QR code for deployment.
[build wp8](build-wp8.html) | Builds the project for Windows Phone 8 platform and produces an application package or a QR code for deployment.
[debug](debug.html) | Shows the debug tools to let you debug applications on connected devices.
[deploy](deploy.html) | Builds the project for the selected platform and deploys it to connected physical devices.
[deploy android](deploy-android.html) | Builds the project for android platform and deploys it to connected physical devices.
[deploy ios](deploy-ios.html) | Builds the project for ios platform and deploys it to connected physical devices.
[emulate](emulate.html) | Builds the specified project in the cloud and runs it in a native emulator.
[emulate android](emulate-android.html) | Builds the specified project in the cloud and runs it in a native Android emulator.
[emulate ios](emulate-ios.html) | Builds the specified project in the cloud and runs it in the native iOS Simulator.
[emulate wp8](emulate-wp8.html) | Builds the specified project in the cloud and runs it in the native emulator from the Windows Phone 8.
[livesync](livesync.html) | Synchronizes the latest changes in your project to connected devices.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to connected Android devices.
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to connected iOS devices.
[livesync cloud](livesync-cloud.html) | Synchronizes the project with the cloud to enable LiveSync via wireless connection.
[remote](remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[simulate](simulate.html) | Runs the current project in the device simulator.
<% } %>