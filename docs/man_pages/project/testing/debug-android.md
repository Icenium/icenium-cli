debug android
==========

Usage | Synopsis
------|-------
General | `$ appbuilder debug android`

<% if(isConsole) { %>
<% if(isWindows) { %>Shows the AppBuilder debug tools to let you debug applications on connected Android devices. <% } %>
<% if(isMacOS) { %>For Apache Cordova applications, lets you debug your apps in Google Chrome. This operation opens a device port and prints a link. You need to open the provided link in Google Chrome to access the connected device.<% } %>
<% } %>
<% if(isHtml) { %>
On Windows systems, shows the AppBuilder debug tools to let you debug applications on connected Android devices. On macOS systems, prints a link which you need to manually open in Google Chrome. After you have opened the link in the browser, you can use Google Chrome to debug your Android app.
<% } %>

<% if(isConsole) { %>
<% if(isLinux) { %>
WARNING: This command is not applicable to Linux systems. To view the complete help for this command, run `$ appbuilder help debug`
<% } %>
<% if(isMacOS && isNativeScript) { %>
WARNING: This command is not applicable to NativeScript apps on macOS systems. To view the complete help for this command, run `$ appbuilder help debug`
<% } %>
<% } %>

<% if(isHtml) { %>
### Command Limitations

* On macOS systems, you cannot run this command for NativeScript apps.

### Related Commands

Command | Description
----------|----------
[debug](debug.html) | Shows the debug tools to let you debug applications on connected iOS or Android devices.
[debug ios](debug-ios.html) | Lets you debug applications on connected iOS devices.
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
