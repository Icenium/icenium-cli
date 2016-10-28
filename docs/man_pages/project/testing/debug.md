debug
==========

Usage | Synopsis
------|-------
General | `$ appbuilder debug <Platform>`

Shows the debug tools to let you debug applications on connected iOS or Android devices.<% if(isHtml) { %> For more information about debugging on device, see [Debugging on Device](http://docs.telerik.com/platform/appbuilder/debugging-your-code/debugging-on-device/debugging-on-device).

<% } %>
<% if(isConsole) { %>
WARNING: You can work only with connected iOS and Android devices.
<% if(isLinux) { %>
WARNING: This command is not applicable to Linux systems. To view the complete help for this command, run `$ appbuilder help debug`
<% } %>
<% if(isMacOS && isNativeScript) { %>
WARNING: This command is not applicable to NativeScript apps on macOS systems. To view the complete help for this command, run `$ appbuilder help debug`
<% } %>
<% } %>
<% if((isConsole && isWindows && (isNativeScript || isCordova)) || (isConsole && isMacOS && isCordova) || isHtml) { %>
### Attributes
* `<Platform>` is the target mobile platform on which you want to debug your project. You can set the following target platforms.
	* `android` - Debug your project on Android.
	* `ios` - Debug your project on iOS.
<% } %>
<% if(isHtml) { %>
### Prerequisites

* [Requirements for debugging on Android devices](http://docs.telerik.com/platform/appbuilder/debugging-your-code/debugging-on-device/prerequisites-for-debugging#android-requirements)
* [Requirements for debugging on iOS devices](http://docs.telerik.com/platform/appbuilder/debugging-your-code/debugging-on-device/prerequisites-for-debugging#ios-requirements)

### Command Limitations

* You cannot run this command on Linux systems.
* You cannot run this command on Windows Phone devices.
* On macOS systems, you cannot run this command for NativeScript apps.

### Related Commands

Command | Description
----------|----------
[debug ios](debug-ios.html) | Lets you debug applications on connected iOS devices.
[debug android](debug-android.html) | Lets you debug applications on connected Android devices.
[build](build.html) | Builds the project for the target platform and produces an application package or a QR code for deployment.
[build android](build-android.html) | Builds the project for Android platform and produces an application package or a QR code for deployment.
[build ios](build-ios.html) | Builds the project for iOS platform and produces an application package or a QR code for deployment.
[build wp8](build-wp8.html) | Builds the project for Windows Phone 8 platform and produces an application package or a QR code for deployment.
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
