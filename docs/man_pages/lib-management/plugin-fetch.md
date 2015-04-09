plugin fetch
==========

Usage | Synopsis
------|-------
By name | `$ appbuilder plugin fetch <Name>`
By ID | `$ appbuilder plugin fetch <ID>`
By path | `$ appbuilder plugin fetch <Path>`
By URL | `$ appbuilder plugin fetch <URL>`
By keyword(s) | `$ appbuilder plugin fetch [<Keyword> [<Keyword>]*>]`
    
Imports the selected Plugman-compatible Apache Cordova plugin into your project. <% if(isHtml) { %>You can specify a plugin by local path,
URL to a plugin repository, name, ID or keyword of a plugin published in the Apache Cordova Plugin Registry.<% } %>
<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin fetch`
<% } %>
<% if(isNativeScript) { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help plugin fetch`
<% } %>
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.
* You can fetch only Plugman-compatible plugins.

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables a core, integrated or verified plugin for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified plugin.
[plugin remove](plugin-remove.html) | Disables a core, integrated or verified plugin from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for plugins in the Apache Cordova Plugin Registry.
<% } %>