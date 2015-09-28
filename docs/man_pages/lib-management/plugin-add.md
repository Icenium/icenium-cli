plugin add
==========

<% if(isConsole) { %>
Usage | Synopsis
------|--------- <% if(isCordova) { %>
List plugins | `$ appbuilder plugin add --available [--debug] [--release]`
Add a plugin | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`
Add a specific version of a plugin | `$ appbuilder plugin add <Name or ID>@<Version> [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the latest version of a plugin | `$ appbuilder plugin add <Name or ID> --latest [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the default version of a plugin | `$ appbuilder plugin add <Name or ID> --default [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add a specific version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID>@<Version> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the latest version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --latest --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the default version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --default --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note) <% } %> <% if(isNativeScript) { %>
List plugins | `$ appbuilder plugin add --available`
Add a plugin | `$ appbuilder plugin add <Name or ID>`
Add a specific version of a plugin | `$ appbuilder plugin add <Name or ID>@<Version>`
Add plugin from GitHub URL | `$ appbuilder plugin add <URL>`
Add plugin from local path | `$ appbuilder plugin add <Path to Local Dir>` <% } %> <% } %>

<% if(isHtml) { %>

### Cordova projects
Usage | Synopsis
------|---------
List plugins | `$ appbuilder plugin add --available [--debug] [--release]`
Add a plugin | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`
Add a specific version of a plugin | `$ appbuilder plugin add <Name or ID>@<Version> [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the latest version of a plugin | `$ appbuilder plugin add <Name or ID> --latest [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the default version of a plugin | `$ appbuilder plugin add <Name or ID> --default [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add a specific version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID>@<Version> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the latest version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --latest --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the default version of a plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --default --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)

### NativeScript projects
Usage | Synopsis
------|---------
List plugins | `$ appbuilder plugin add --available`
Add a plugin | `$ appbuilder plugin add <Name or ID>`
Add a specific version of a plugin | `$ appbuilder plugin add <Name or ID>@<Version>`
Add plugin from GitHub URL | `$ appbuilder plugin add <URL>`
Add plugin from local path | `$ appbuilder plugin add <Path to Local Dir>`

<% } %>

<% if(isHtml) { %><a id="note"></a><% } %>
\*\* If the plugin has multiple variables, you can set `--var` for each variable.

Enables a core, integrated or verified plugin for your project. <% if(isHtml) { %>If the plugin has plugin variables and you have not set one or more of them with `--var`, the Telerik AppBuilder CLI shows an interactive prompt to let you set their values.<% } %>
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin add`
<% } %>
<% } %>

### Options
* `--available` - Lists all plugins that you can enable in your project.
* `--latest` - Enables the latest version of the specified plugin.
* `--default` - Enables the default version of the specified plugin. <% if(isCordova) {%>
* `--debug` - Enables the specified plugin for the Debug build configuration only. If `--available` is set, lists all plugins that you can enable for the Debug build configuration.
* `--release` - Enables the specified plugin for the Release build configuration only. If `--available` is set, lists all plugins that you can enable for the Release build configuration.
* `--var.<Variable ID>` - Sets the value for the specified plugin variable in all configurations. If `--debug` or `--release` is specified, sets the variable for the respective configuration only.
* `--var.debug.<Variable ID>` - Sets the value for the specified plugin variable for the Debug configuration only.
* `--var.release.<Variable ID>` - Sets the value for the specified plugin variable for the Release configuration only.<% } %><% if(isNativeScript) { %>
* `--count` - When used with `--available`, defines the number of NPM and NativeScript plugins that will be listed. <% } %>

### Attributes
* `<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin add --available`
* `<Version>` is the version of the plugin as listed by `$ appbuilder plugin add --available`
* `<Variable ID>` is the plugin variable as listed in the `plugin.xml` of the plugin.
* `<URL>` is the GitHub url to the plugin.
* `<Path to Local Dir>` is the path to local directory that contains valid plugin.

<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all plugins that are currently enabled for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins.
[plugin fetch](plugin-fetch.html) | Imports the selected plugin into your project.
<% } %>
