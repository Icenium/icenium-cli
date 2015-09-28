plugin find
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin find [<Keyword> [<Keyword>]*>]`

<% if(isCordova) { %>
Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry. <% } %>
<% if(isNativeScript) { %>
Searches by one or more keywords for plugins in the NPM. <% } %>
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin find`
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
[plugin](plugin.html) | Lists all plugins that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables plugin from your project.
[plugin fetch](plugin-fetch.html) | Imports the selected plugin into your project.
<% } %>
