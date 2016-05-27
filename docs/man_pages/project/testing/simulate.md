simulate
==========

Usage | Synopsis
------|-------
General | `$ appbuilder simulate [--path <Directory>]`

Runs the current project in the device simulator.

<% if(isConsole)  { %>
<% if(isLinux) { %>
WARNING: You cannot run this command on Linux systems. To view the complete help for this command, run `$ appbuilder help simulate`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help simulate`
<% } %>
<% } %>

<% if((isConsole && (isWindows || isMacOS) && isCordova) || isHtml) { %>
### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
<% } %>

<% if(isHtml) { %> 
### Command Limitations

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
[emulate wp8](emulate-wp8.html) | Builds the specified project in the cloud and runs it in the native emulator from the Windows Phone 8.
[livesync](livesync.html) | Synchronizes the latest changes in your project to connected devices.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to connected Android devices.
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to connected iOS devices.
[livesync cloud](livesync-cloud.html) | Synchronizes the project with the cloud to enable LiveSync via wireless connection.
[remote](remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
<% } %>
