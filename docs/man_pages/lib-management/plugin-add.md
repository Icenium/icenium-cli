plugin add
==========

Usage | Syntax
------|-------
List all plugins | `$ appbuilder plugin add --available [--debug] [--release]`    
Add plugins | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`

Enables a core, integrated or verified plugin for your project.
If the plugin has plugin variables, the Telerik AppBuilder CLI shows an interactive prompt to let you set values for each plugin variable.

`<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin add --available`.
<% if(isNativeScript)  { %>
This command is not applicable to NativeScript projects.
<% } %>
Options:
* `--available` - Lists all plugins that you can enable in your project.
* `--debug` - Enables the specified plugin for the Debug build configuration only. If `--available` is set, lists all plugins that you can enable for the Debug build configuration.
* `--release` - Enables the specified plugin for the Release build configuration only. If `--available` is set, lists all plugins that you can enable for the Release build configuration.
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