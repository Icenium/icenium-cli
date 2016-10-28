emulate
==========

Usage | Synopsis
------|-------
General | `$ appbuilder emulate <Platform> [--debug] [--release] [--path]`

Builds the specified project in the cloud and runs it in a native emulator. You must run the `emulate` command with a command extension.
<% if(isHtml) { %>
You can choose which files from your project to exclude or include in your application package by maintaining an .abignore file. For more information about .abignore, see [abignore.md](https://github.com/Icenium/icenium-cli/blob/release/ABIGNORE.md).
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--debug` - If set, applies the Debug build configuration. <% if(isHtml) { %> For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - If set, applies the Release build configuration. <% if(isHtml) { %>For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.

### Attributes
`<Platform>` sets a target platform for the `emulate` command. You can set the following target platforms.
* `android` - Builds the specified project in the cloud and runs it in the native Android emulator or Genymotion.
<% if(isMacOS) { %>* `ios` - Builds the specified project in the cloud and runs it in the native iOS Simulator.<% } %> 
<% if(isWindows) { %>* `wp8` - Builds the specified project in the cloud and runs it in the native emulator from the Windows Phone 8.0 SDK or the Windows Phone 8.1 SDK.<% } %> 
<% } %>
<% if(isHtml) { %> 
### Prerequisites

* [Prerequisites for running in the native Android emulator or Genymotion](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-in-emulators/android-emulator#prerequisites)
* [Prerequisites for running in the native iOS Simulator](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-in-emulators/ios-emulator)
* [Prerequisites for running in the native Windows Phone emulator](http://docs.telerik.com/platform/appbuilder/testing-your-app/running-in-emulators/wp8-emulator)

### Command Limitations

* On Windows systems, you can run this command for Android and Windows Phone.
* On macOS systems, you can run this command for Android and iOS.
* On Linux systems, you can run this command for Android.

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
