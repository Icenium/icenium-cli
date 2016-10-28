emulate wp8
==========

Usage | Synopsis
------|-------
General | `$ appbuilder emulate wp8 [--path <Directory>] [--debug] [--release]`

Builds the specified project in the cloud and runs it in the native emulator from the Windows Phone 8.0 SDK or the Windows Phone 8.1 SDK. <% if(isHtml) { %>You can choose which files from your project to exclude or include in your application package by maintaining an .abignore file. For more information about .abignore, see [abignore.md](https://github.com/Icenium/icenium-cli/blob/release/ABIGNORE.md).<% } %>
<% if(isConsole) { %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help emulate wp8`<% } %>
<% if(isLinux) { %>WARNING: You cannot run this command on Linux systems. To view the complete help for this command, run `$ appbuilder help emulate wp8`<% } %>
<% if(isMacOS) { %>WARNING: You cannot run this command on macOS systems. To view the complete help for this command, run `$ appbuilder help emulate wp8`<% } %>
<% } %>
<% if(isHtml) { %>
### Prerequisites
Before running the Windows Phone 8.0 or the Windows Phone 8.1 emulator, verify that your system meets the following requirements.
* You are running the AppBuilder CLI on Windows 8 Professional or later.
* You have installed the Windows Phone 8.0 SDK or the Windows Phone 8.1 SDK.
* If you want to re-deploy an already deployed Windows Phone 8.1 application, verify that you have updated the **BundleVersion** property in the project properties. Otherwise, your changes will not be updated on the device.<br/>To update the version property, run the following command.

	```Shell
	appbuilder prop set BundleVersion <Value>
	```
<% } %>
<% if((isConsole && isWindows && isCordova) || isHtml) { %>
### Options
* `--debug` - If set, applies the Debug build configuration. <% if(isHtml) { %> For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - If set, applies the Release build configuration. <% if(isHtml) { %>For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on macOS systems.
* You cannot run this command on Linux systems.
* You cannot run this command on NativeScript projects.

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
[livesync](livesync.html) | Synchronizes the latest changes in your project to connected devices.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to connected Android devices.
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to connected iOS devices.
[livesync cloud](livesync-cloud.html) | Synchronizes the project with the cloud to enable LiveSync via wireless connection.
[remote](remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[simulate](simulate.html) | Runs the current project in the device simulator.
<% } %>
