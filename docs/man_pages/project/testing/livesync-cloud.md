livesync cloud
==========

Usage | Synopsis
------|-------
General | `$ appbuilder livesync cloud`

Synchronizes the project with the cloud to enable LiveSync via wireless connection (using the three-finger tap and hold gesture). <% if(isHtml) { %>You can also control LiveSync with the three-finger tap and hold gesture programmatically. For more information, see [Enable or Disable LiveSync Programmatically](http://docs.telerik.com/platform/appbuilder/testing-your-app/livesync/configuring-livesync/configure-livesync-programmatically) and [LiveSync Changes Programmatically](http://docs.telerik.com/platform/appbuilder/testing-your-app/livesync/livesync-programmatically).<% } %> 

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
To get the latest changes on device, tap and hold with three fingers on the device screen until the download pop-up
appears. When the download completes, the app refreshes automatically.
<% } %>
<% if(isConsole) { %>
<% if(isNativeScript) { %>
WARNING: You can LiveSync changes only to the NativeScript companion app. To LiveSync changes to an application package, re-build and re-deploy your NativeScript app.
<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help livesync cloud`
<% } %>
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* For NativeScript projects, you can LiveSync changes only to the NativeScript companion app.
* You cannot run this command on mobile website projects.

### Related Commands

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
[remote](remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[simulate](simulate.html) | Runs the current project in the device simulator.
<% } %>