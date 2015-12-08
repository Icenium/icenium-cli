kendoui install
==========

Usage | Synopsis
------|-------
List all versions | `$ appbuilder kendoui install [--verified] [--latest]`
List Kendo UI Core versions | `$ appbuilder kendoui install --core [--verified]`
List Kendo UI Professional versions | `$ appbuilder kendoui install --professional [--verified]`
Install latest Kendo UI Core | `$ appbuilder kendoui install --core --latest [--verified]`
Install latest Kendo UI Professional | `$ appbuilder kendoui install --professional --latest [--verified]`

Lists the available Kendo UI Core and Kendo UI Professional versions and downloads and extracts the selected package in the project directory.<% if(isHtml || isCordova) { %> The Verified tag marks stable Kendo UI Service Pack releases.<% } %> 
<% if(isConsole) { %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help kendoui install`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>  
### Options
* `--verified` - Lists stable Kendo UI Service Pack packages. If both package type and `--latest` are set, installs the latest stable Kendo UI Service Pack package of the specified type.
* `--core` - Lists Kendo UI Core versions. If `--latest` is set, installs the latest Kendo UI Core package.
* `--professional` - Lists Kendo UI Professional versions. If `--latest` is set, installs the latest Kendo UI Professional package.
* `--latest` - Lists the latest available Kendo UI packages. If a package type is set, installs the latest available Kendo UI package of the specified type.

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
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all Apache Cordova plugins or custom npm or NativeScript modules that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a Apache Cordova plugins or custom npm or NativeScript modules for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](plugin-remove.html) | Disables Apache Cordova plugins or custom npm or NativeScript modules from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for Apache Cordova plugins or custom npm or NativeScript modules.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugins or custom npm or NativeScript modules into your project.
<% } %>
