debug android
==========

Usage | Synopsis
------|-------
General | `$ appbuilder debug android`

<% if(isConsole) { %>
<% if(isWindows) { %> Shows the debug tools to let you debug applications on connected Android devices. <% } %>
<% if(isMacOS) { %> Allows you to debug your Cordova applications in Google Chrome, by opening device port and copying the required link to your clipboard. You have to paste it manually in your browser. <% } %>
<% } %>
<% if(isHtml) { %>
On Windows shows the debug tools to let you debug applications on connected Android devices. On OS X you can debug your Cordova applications in Google Chrome. The command will open device port and copy the required link to your clipboard. You have to paste it manually in your browser.
<% } %>

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[debug](debug.html) | Shows the debug tools to let you debug applications on connected iOS or Android devices.<% if(isHtml) { %> For more information about debugging on device, see [Debugging on Device](http://docs.telerik.com/platform/appbuilder/debugging-your-code/debugging-on-device/debugging-on-device).
<% } %>
[debug ios](debug-ios.html) | Opens up ios-webkit-debug-proxy in Safari on specific port and lets you debug your application.
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
