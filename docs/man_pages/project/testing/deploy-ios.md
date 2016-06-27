deploy ios
==========

Usage | Synopsis
------|-------
General | `$ appbuilder deploy ios [--device <Device ID>] --certificate <Certificate ID> --provision <Provision ID> [--debug] [--release]`

Builds the project for iOS and deploys it to connected physical devices.
<% if (isConsole) { %>
<% if(isLinux) { %>
WARNING: You cannot run this command on Linux systems. To view the complete help for this command, run `$ appbuilder help deploy ios`
<% } %> 
<% } %>
<% if(isHtml) { %>
You can choose which files from your project to exclude or include in your application package by maintaining an .abignore file. For more information about .abignore, see [abignore.md](https://github.com/Icenium/icenium-cli/blob/release/ABIGNORE.md).
<% } %>
<% if((isConsole && (isWindows || isMacOS) && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--debug` - If set, applies the Debug build configuration. <% if(isHtml) { %> For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - If set, applies the Release build configuration. <% if(isHtml) { %>For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--device` - Specifies the serial number or the index of the connected device on which you want to deploy the app. <% if(isHtml) { %>To list all connected devices, grouped by platform, run `$ appbuilder device`<% } %>  
* `--certificate` - Sets the certificate that you want to use for code signing your iOS app. You can set a certificate by index or name. <% if(isHtml) { %>You must specify a certificate. The certificate must match the provisioning profile. To list available certificates, run `$ appbuilder certificate`<% } %> 
* `--provision` - Sets the provisioning profile that you want to use for code signing your iOS app. You can set a provisioning profile by index or name. <% if(isHtml) { %>You must specify a provisioning profile. The provisioning profile must match the certificate. To list available provisioning profiles, run `$ appbuilder provision`<% } %> 

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ appbuilder device`
* `<Certificate ID>` is the index or name of the certificate as listed by `$ appbuilder certificate`
* `<Provision ID>` is the index or name of the provisioning profile as listed by `$ appbuilder provision`
<% } %> 
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on Linux systems.

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
