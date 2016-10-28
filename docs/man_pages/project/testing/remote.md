remote
==========

Usage | Synopsis
------|-------
General | `$ appbuilder remote <Port> [--device <Device Name>] [--timeout]`

Starts a remote server to let you run your app in the iOS Simulator from a Windows system. On the specified port, the AppBuilder CLI listens for requests from other AppBuilder clients and launches the iOS Simulator. <% if(isHtml) { %>For more information about launching the iOS simulator from the other AppBuilder clients, see [Run app in the native iOS Simulator from the AppBuilder Windows client](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-in-emulators/ios-emulator#run-app-in-the-native-ios-simulator-from-the-appbuilder-windows-client) and [Run app in the native iOS Simulator from the AppBuilder extension for Visual Studio](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-in-emulators/ios-emulator#run-app-in-the-native-ios-simulator-from-the-appbuilder-extension-for-visual-studio).<% } %>
<% if(isConsole) { %>
<% if(isLinux) { %>WARNING: You cannot run this command on Linux systems. To view the complete help for this command, run `$ appbuilder help remote`<% } %>
<% if(isWindows) { %>WARNING: You cannot run this command on Windows systems. To view the complete help for this command, run `$ appbuilder help remote`<% } %>
<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>
### Options
* `--device` - Specifies the name of the iOS Simulator device on which you want to run your app. <% if(isHtml) { %>When this option is set, the AppBuilder CLI always launches the selected device and disregards any device choices from the other AppBuilder clients.  To list the available iOS Simulator devices, run `$ appbuilder emulate ios --available-devices`<% } %>
* `--timeout` - Sets the number of seconds that the AppBuilder CLI will wait for the iOS Simulator to start before quitting the operation and releasing the console. The value must be a positive integer. If not set, the default timeout is 90 seconds.

### Attributes
* `<Port>` is an integer greater than 1023 that specifies a port on your macOS system. <% if(isHtml) { %>Make sure that the port is open and that your firewall allows traffic on it, if configured. Make sure that your Windows system can reach and send traffic to the macOS system on the specified port.<% } %>
* `<Device Name>` is the name of the iOS Simulator device on which you want to run your app as listed by `$ appbuilder emulate ios --available-devices`
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on Linux systems.
* You cannot run this command on Windows systems.

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
[simulate](simulate.html) | Runs the current project in the device simulator.
<% } %>
