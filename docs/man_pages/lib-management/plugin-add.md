plugin add
==========

Usage | Synopsis
------|-------
List plugins | `$ appbuilder plugin add --available [--debug] [--release]`
Add plugins | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`
Add a specific version of a plugin | `$ appbuilder plugin add <Name or ID>@<Version> [--debug] [--release]`
Add latest version of a plugin | `$ appbuilder plugin add <Name or ID> --latest [--debug] [--release]`
Add default version of a plugin | `$ appbuilder plugin add <Name or ID> --default [--debug] [--release]`
Add plugin and specify plugin variables | `$ appbuilder plugin add <Name or ID> [--var.<variable_id> <variable value> [--var.<variable_id> <variable value>]*>]`
Add plugin and specify plugin variables per configuration | `$ appbuilder plugin add <Name or ID> [--var.<configuration>.<variable_id> <variable value> [--var.<configuration>.<variable_id> <variable value>]*>]`

Enables a core, integrated or verified plugin for your project. <% if(isHtml) { %>If the plugin has plugin variables, the Telerik AppBuilder CLI shows an interactive prompt to let you set values for each plugin variable.<% } %>
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin add`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin add`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--available` - Lists all plugins that you can enable in your project.
* `--debug` - Enables the specified plugin for the Debug build configuration only. If `--available` is set, lists all plugins that you can enable for the Debug build configuration.
* `--release` - Enables the specified plugin for the Release build configuration only. If `--available` is set, lists all plugins that you can enable for the Release build configuration.
* `--latest` - Enables the latest version of the specified plugin.
* `--default` - Enables the default version of the specified plugin.
* `--var` - Sets the value for specified plugin variable. The following rules are applied when parsing the `--var` option:
	* `--var.<variableName> <value>` - sets variable `<variableName>` to `<value>` in all configurations.
	* `--var.<configuration>.<variableName> <value>` - sets variable `<variableName>` to `<value>` for specified configuration.
	* `--var.<configuration>.<variableName> <configValue> --var.<variableName> <value>` - sets variable `<variableName>` to `<configValue>` for specified configuration and to `<value>` for all other configurations.
	* If plugin requires two plugin variables, but you pass only one with `--var` option, you will be prompted to select value for the other one.

### Attributes
* `<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin add --available`
* `<Version>` is the version of the plugin as listed by `$ appbuilder plugin add --available` 
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>