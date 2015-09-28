plugin
==========

Usage | Synopsis
------|-------
List plugins | `$ appbuilder plugin [--available] [--debug] [--release]`
Manage plugins | `$ appbuilder plugin <Command>`

Lists all plugins that are currently enabled for your project. <% if(isHtml) { %>With the `--available` switch, lists all plugins that are enabled in your project and that you can enable in your project.<% } %>

<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin`
<% } %>

<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--available` - Lists all plugins that are currently enabled in your project and all plugins that you can enable in your project.
* `--debug` - Lists all plugins enabled for the Debug build configuration. If `--available` is set, also lists all plugins that you can enable for the Debug build configuration.
* `--release` - Lists all plugins enabled for the Release build configuration. If `--available` is set, also lists all plugins that you can enable for the Release build configuration.
<% if(isNativeScript) { %>* `--count` - Lists the selected number of NPM and NativeScript plugins. Default value is 10. <% } %>

### Attributes
`<Command>` extends the `plugin` command. You can set the following values for this attribute.
* `add` - Enables plugin for your project.
* `configure` - Configures plugin variables for the selected plugin.
* `remove` - Disables plugin for your project.
* `find` - Searches by keyword for plugins.
* `fetch` - Imports the selected plugin into your project. <% if(isHtml) { %>You can specify a plugin by local path, URL to a plugin repository.<% } %>
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin add](plugin-add.html) | Enables plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected plugin.
[plugin remove](plugin-remove.html) | Disables plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins.
[plugin fetch](plugin-fetch.html) | Imports the selected plugin into your project.
<% } %>
