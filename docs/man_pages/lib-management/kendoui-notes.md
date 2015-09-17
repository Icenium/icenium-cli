kendoui notes
==========

Usage | Synopsis
------|-------
All versions | `$ appbuilder kendoui notes [--verified] [--latest]`
Only Kendo UI Core versions | `$ appbuilder kendoui notes --core [--verified]`
Only Kendo UI Professional versions | `$ appbuilder kendoui notes --professional [--verified]`

Shows the release notes for a selected Kendo UI Core or Kendo UI Professional package.<% if(isHtml || isCordova) { %> The verified tag marks stable Kendo UI Service Pack releases.<% } %> 
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help kendoui notes`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help kendoui notes`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>  
### Options
* `--verified` - Lists versions marked with the Verified tag.
* `--core` - Lists Kendo UI Core versions.
* `--professional` - Lists Kendo UI Professional versions.
* `--latest` - Lists the latest stable Kendo UI Service Pack packages.

<% if(isConsole) { %>  
WARNING: You cannot set `--core` and `--professional` simultaneously.
<% } %>
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.
* You cannot set `--core` and `--professional` simultaneously.

### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>
