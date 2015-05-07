update-kendoui
==========

Usage | Synopsis
------|-------
General | `$ appbuilder update-kendoui [--verified] [--core] [--professional] [--latest]`

Lists officially supported Kendo UI Core and Kendo UI Professional versions and downloads and extracts the selected package in the project directory.<% if(isHtml || isCordova) { %> The verified tag marks stable Kendo UI Service Pack releases.<% } %> 
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help update-kendoui`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help update-kendoui`
<% } %>
<% } %>
### Options
* `--verified` - Lists version marked with verified tag.
* `--core` - Lists Kendo UI Core versions. When combined with `--verified` option, lists only Kendo UI Core verified versions.
* `--professional` - Lists Kendo UI Professional versions. When combined with `--verified` option, lists only Kendo UI Professional verified versions.
* `--latest` - Installs the latest available version without prompt for selection. This option can be combined with all other options. For example `$ appbuilder update-kendoui --latest --verified --core` will install latest available verified version of Kendo UI Core.

> NOTE: `--core` and `--professional` options cannot be used simultaneously.
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>