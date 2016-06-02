livesync
==========

Usage | Synopsis
------|-------
General | `$ appbuilder livesync <Command>`

Synchronizes the latest changes in your project to devices. You must run the `livesync` command with a command extension.

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
`<Command>` extends the `livesync` command. You can set the following values for this attribute.
* `cloud` - Synchronizes the project with the cloud to enable LiveSync for remote devices (using the three-finger tap and hold gesture).
* `android` - Synchronizes the latest changes in your project to connected Android devices. 
* `ios` - Synchronizes the latest changes in your project to connected iOS devices.
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot LiveSync changes to connected Windows Phone devices.

### Related Commands

Command | Description
----------|----------
[build](build.html) | Builds the project for the target platform and produces an application package or a QR code for deployment.
[build android](build-android.html) | Builds the project for Android platform and produces an application package or a QR code for deployment.
[build ios](build-ios.html) | Builds the project for iOS platform and produces an application package or a QR code for deployment.
[build wp8](build-wp8.html) | Builds the project for Windows Phone 8 platform and produces an application package or a QR code for deployment.
[debug](debug.html) | Shows the debug tools to let you debug applications on connected devices.
[debug ios](debug-ios.html) | Lets you debug applications on connected iOS devices.
[debug android](debug-android.html) | Lets you debug applications on connected Android devices.
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
