plugin configure
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin configure <Name or ID> [--debug] [--release]`
Specify plugin variables | `$ appbuilder plugin configure <Name or ID> [--var.<variable_id> <variable value> [--var.<variable_id> <variable value>]*>]`
Specify plugin variables per configuration | `$ appbuilder plugin configure <Name or ID> [--var.<configuration>.<variable_id> <variable value> [--var.<configuration>.<variable_id> <variable value>]*>]`

Configures plugin variables for the selected core, integrated or verified plugin.
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin configure`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin configure`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--debug` - Sets the plugin variable for the Debug build configuration only. 
* `--release` - Sets the plugin variable for the Release build configuration only.
* `--var` - Sets the value for specified plugin variable. The following rules are applied when parsing the `--var` option:
	* `--var.<variableName> <value>` - sets variable `<variableName>` to `<value>` in all configurations.
	* `--var.<configuration>.<variableName> <value>` - sets variable `<variableName>` to `<value>` for specified configuration.
	* `--var.<configuration>.<variableName> <configValue> --var.<variableName> <value>` - sets variable `<variableName>` to `<configValue>` for specified configuration and to `<value>` for all other configurations.
	* If plugin requires two plugin variables, but you pass only one with `--var` option, you will be prompted to select value for the other one.

### Attributes
* `<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin`

<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>