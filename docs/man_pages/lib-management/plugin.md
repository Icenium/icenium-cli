plugin
==========

Usage | Synopsis
------|-------
List plugins | `$ appbuilder plugin [--available] [--debug] [--release]`    
Manage plugins | `$ appbuilder plugin <Command>`

Lists all core, integrated and verified plugins that are currently enabled for your project. <% if(isHtml) { %>With the `--available` switch, lists all core, integrated and verified plugins that are enabled in your project and that you can enable in your project.<% } %> 

<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin`
<% } %>
<% } %>

<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--available` - Lists all plugins that are currently enabled in your project and all plugins that you can enable in your project.
* `--debug` - Lists all plugins enabled for the Debug build configuration. If `--available` is set, also lists all plugins that you can enable for the Debug build configuration.
* `--release` - Lists all plugins enabled for the Release build configuration. If `--available` is set, also lists all plugins that you can enable for the Release build configuration.

### Attributes  
`<Command>` extends the `plugin` command. You can set the following values for this attribute.
* `add` - Enables a core, integrated or verified plugin for your project.
* `configure` - Configures plugin variables for the selected core, integrated or verified plugin.
* `remove` - Disables a core, integrated or verified plugin for your project.
* `find` - Searches by keyword for plugins in the Apache Cordova Plugin Registry.
* `fetch` - Imports the selected Apache Cordova plugin into your project. <% if(isHtml) { %>You can specify a plugin by local path, URL to a plugin repository, or a name of a plugin published in the Apache Cordova Plugin Registry. The plugin must be Plugman-compatible.<% } %>
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>