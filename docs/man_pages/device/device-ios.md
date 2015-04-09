device ios
==========

Usage | Synopsis
------|-------
General | `$ appbuilder device ios [--timeout <Milliseconds>]`

Lists all recognized connected iOS devices with serial number and index.

<% if(isConsole && isLinux) { %>WARNING: You cannot run this command on Linux systems. To view the complete help for this command, run `$ appbuilder help device ios` <% } %> 

<% if((isConsole && (isWindows || isMacOS)) || isHtml) { %>  
### Options
* `--timeout` - Sets the time in milliseconds for the operation to search for connected devices before completing. If not set, the default value is 4000. <% } %><% if(isHtml) { %>The operation will continue to wait and listen for newly connected devices and will list them after the specified time expires.

### Command Limitations

* You cannot run this command on Linux systems.

### Related Commands

Command | Description
----------|----------
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
<% } %>