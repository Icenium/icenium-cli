plugin find
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin find [<Keyword> [<Keyword>]*>]`

Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin find`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin find`
<% } %>
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
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin fetch](plugin-fetch.html) | Imports the selected Apache Cordova plugin into your project.
<% } %>