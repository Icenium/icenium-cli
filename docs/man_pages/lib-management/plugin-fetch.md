plugin fetch
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin fetch <Name | ID | Path | URL | [<Keyword> [<Keyword>]*>] >`
    
Imports the selected Apache Cordova plugin into your project. You can specify a plugin by local path,
URL to a plugin repository, name, ID or keyword of a plugin published in the Apache Cordova Plugin Registry. 
The plugin must be Plugman-compatible.

<% if(isNativeScript)  { %>
This command is not applicable to NativeScript projects.
<% } %>

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