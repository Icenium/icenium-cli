kendoui
==========

Usage | Synopsis
------|-------
List all versions | `$ appbuilder kendoui [--verified] [--latest]`
List Kendo UI Core versions | `$ appbuilder kendoui --core [--verified] [--latest]`
List Kendo UI Professional versions | `$ appbuilder kendoui --professional [--verified] [--latest]`

Lists the available Kendo UI Core and Kendo UI Professional packages that you can add to your project.<% if(isHtml || isCordova) { %> The verified tag marks stable Kendo UI Service Pack releases.<% } %> 
<% if(isConsole) { %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help kendoui`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>  
### Options
* `--verified` - Lists stable Kendo UI Service Pack packages.
* `--core` - Lists Kendo UI Core versions.
* `--professional` - Lists Kendo UI Professional versions.
* `--latest` - Lists the latest available Kendo UI packages.

<% if(isConsole) { %>  
WARNING: You cannot set `--core` and `--professional` simultaneously.
<% } %>
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot set `--core` and `--professional` simultaneously.

### Related Commands

Command | Description
----------|----------
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all Apache Cordova plugins or custom npm or NativeScript modules that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a Apache Cordova plugins or custom npm or NativeScript modules for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](plugin-remove.html) | Disables Apache Cordova plugins or custom npm or NativeScript modules from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for Apache Cordova plugins or custom npm or NativeScript modules.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugins or custom npm or NativeScript modules into your project.
<% } %>
