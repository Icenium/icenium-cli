device log
==========

Usage | Synopsis
------|-------
General | `$ appbuilder device log [--device <Device ID>]`

Opens the device log stream for a selected connected Android <% if(isWindows || isMacOS) { %>or iOS <% } %>device. 

<% if(isConsole) { %>
WARNING: You can work only with connected <% if(isWindows || isMacOS) { %>iOS and <% } %>Android devices.  
<% if(isLinux) { %>WARNING: You cannot work with connected iOS devices on Linux systems. To view the complete help for this command, run `$ appbuilder help device log`<% } %> 
<% } %>

### Options
* `--device` - If multiple devices are connected, sets the device for which you want to stream the log in the console.

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ appbuilder device`

<% if(isHtml) { %> 
### Command Limitations

* You cannot work with connected Windows Phone devices.
* You cannot work with connected iOS devices on Linux systems.

### Related Commands

Command | Description
----------|----------
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
<% } %>