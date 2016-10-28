emulate android
==========

Usage | Synopsis
------|-------
General | `$ appbuilder emulate android [--path <Directory>] [--certificate <Certificate ID>] [--timeout <Seconds>] [--debug] [--release]`
Native emulator | `$ appbuilder emulate android --avd <AvdName> [--path <Directory>] [--certificate <Certificate ID>] [--timeout <Seconds>] [--debug] [--release]`
Genymotion emulator | `$ appbuilder emulate android --geny <GenyName> [--path <Directory>] [--certificate <Certificate ID>] [--timeout <Seconds>] [--debug] [--release]`

Builds the specified project in the cloud and runs it in a native Android emulator or Genymotion. <% if(isHtml) { %>If you do not select an Android virtual device (AVD) with the `--avd` option or a Genymotion virtual device with the `--geny` option, your app runs in the default AVD or a currently running emulator, if any.
To list the available AVDs, run `$ android list avd`
To list the available Genymotion devices, run `$ genyshell -c "devices list"`
To test your app on multiple Android virtual devices, run `$ appbuilder emulate android --avd <Name>` or `$ appbuilder emulate android --geny <GenyName>` for each virtual device.

You can choose which files from your project to exclude or include in your application package by maintaining an .abignore file. For more information about .abignore, see [abignore.md](https://github.com/Icenium/icenium-cli/blob/release/ABIGNORE.md).
<% } %>
<% if(isHtml) { %>
### Prerequisites
Before running your app in the **native Android emulator** from the Android SDK, verify that your system meets the following requirements.
* Verify that you have installed the Android SDK and its dependencies.
* Verify that you have added the following Android SDK directories to the PATH environment variable:
    * `platform-tools`
    * `tools`

Before running your app in the **Genymotion emulator**, verify that your system meets the following requirements.
* Verify that you have installed Genymotion and its dependencies.
* On Windows and Linux systems, verify that you have added the Genymotion installation directory to the `PATH` environment variable.
* On macOS systems, verify that you have added the following paths to the `PATH` environment variable.
    * For Genymotion earlier than 2.6:
        * `/Applications/Genymotion.app/Contents/MacOS`
        * `/Applications/Genymotion Shell.app/Contents/MacOS`
    * For Genymotion 2.6:
        * `/Applications/Genymotion.app/Contents/MacOS/player.app/Contents/MacOS`
        * `/Applications/Genymotion Shell.app/Contents/MacOS`<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--debug` - If set, applies the Debug build configuration. <% if(isHtml) { %> For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - If set, applies the Release build configuration. <% if(isHtml) { %>For more information about build configurations, see [build configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
* `--certificate` - Sets the certificate that you want to use for code signing your Android app. You can set a certificate by index or name. <% if(isHtml) { %>To list available certificates, run `$ appbuilder certificate`<% } %>
* `--avd` - Sets the Android virtual device on which you want to run your app. You can set only one device at a time. <% if(isHtml) { %>To list the available Android virtual devices, run `$ android list avd`. You cannot use `--avd` and `--geny` simultaneously.<% } %>
* `--geny` - Sets the Genymotion virtual device on which you want to run your app. You can set only one device at a time. <% if(isHtml) { %>To list the available Genymotion virtual devices, run `$ genyshell -c "devices list"`. You cannot use `--avd` and `--geny` simultaneously.<% } %>
* `--timeout` - Sets the number of seconds that the AppBuilder CLI will wait for the virtual device to boot before quitting the operation and releasing the console. If not set, the default timeout is 120 seconds. To wait indefinitely, set 0.

### Attributes
* `<Certificate ID>` is the index or name of the certificate as listed by `$ appbuilder certificate`
* `<AvdName>` is the name of the Android virtual device that you want to use as listed by `$ android list avd`. You can specify only one name at a time.
* `<GenyName>` is the name of the Genymotion virtual device that you want to use as listed by `$ genyshell -c "devices list"`. You can specify only one name at a time.
<% } %>
<% if(isHtml) { %>
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
[emulate ios](emulate-ios.html) | Builds the specified project in the cloud and runs it in the native iOS Simulator.
[emulate wp8](emulate-wp8.html) | Builds the specified project in the cloud and runs it in the native emulator from the Windows Phone 8.
[livesync](livesync.html) | Synchronizes the latest changes in your project to connected devices.
[livesync android](livesync-android.html) | Synchronizes the latest changes in your project to connected Android devices.
[livesync ios](livesync-ios.html) | Synchronizes the latest changes in your project to connected iOS devices.
[livesync cloud](livesync-cloud.html) | Synchronizes the project with the cloud to enable LiveSync via wireless connection.
[remote](remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[simulate](simulate.html) | Runs the current project in the device simulator.
<% } %>
