plugin remove
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin remove <Name or ID> [--debug] [--release]`

Disables a core, integrated or verified plugin from your project.

`<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin`
<% if(isNativeScript)  { %>
This command is not applicable to NativeScript projects.
<% } %>

Options:
* `--debug` - Disables the specified plugin for the Debug build configuration only. 
* `--release` - Disables the specified plugin for the Release build configuration only.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[update-kendoui](update-kendoui.html) | Lists officially supported Kendo UI Core and Kendo UI Professional versions and downloads and extracts the selected package in the project directory.
<% } %>