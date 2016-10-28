device run
==========

Usage | Synopsis
------|-------
General | `$ appbuilder device run <Application ID> [--device <Device ID>]`

Runs the selected application on a connected Android <% if(isMacOS) { %>or iOS <% } %>device. You can run this command on one connected device at a time.

### Options
* `--device` - If multiple devices are connected, sets the device on which you want to run the app.

### Attributes
* `<Application ID>` is the application identifier as listed by `$ appbuilder device list-applications`
* `<Device ID>` is the device index or identifier as listed by `$ appbuilder device`

<% if(isHtml) { %>
### Prerequisites
Before running your app on an iOS device, verify that your system and app meet the following requirements.

* You are running the AppBuilder CLI on a macOS system.
* You have installed Xcode 5 or later.
* You have built your app with the debug build configuration.

Before running your app on an Android device, verify that your app meets the following requirement.

* You have built your app with the debug build configuration.

### Command Limitations

* You cannot work with connected Windows Phone devices.
* You can run this command on one connected device at a time.
* You cannot run this command for iOS devices on Windows and Linux systems.

### Related Commands

Command | Description
----------|----------
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
<% } %>
