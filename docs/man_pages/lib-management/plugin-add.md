plugin add
==========

Usage | Synopsis
------|-------
List | `$ appbuilder plugin add --available [--debug] [--release]`    
Add | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`

Enables a core, integrated or verified plugin for your project.
<% if(isHtml) { %>If the plugin has plugin variables, the Telerik AppBuilder CLI shows an interactive prompt to let you set values for each plugin variable.<% } %>
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin add`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin add`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
#### Options
* `--available` - Lists all plugins that you can enable in your project.
* `--debug` - Enables the specified plugin for the Debug build configuration only. If `--available` is set, lists all plugins that you can enable for the Debug build configuration.
* `--release` - Enables the specified plugin for the Release build configuration only. If `--available` is set, lists all plugins that you can enable for the Release build configuration.

#### Attributes
* `<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin add --available`
<% } %>

<% if(isHtml) { %> 
#### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

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