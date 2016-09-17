plugin fetch
==========

Usage | Synopsis
------|-------
By name | `$ appbuilder plugin fetch <Name>`
By ID | `$ appbuilder plugin fetch <ID>`
By path | `$ appbuilder plugin fetch <Path>`
By URL | `$ appbuilder plugin fetch <URL>`
By keyword(s) | `$ appbuilder plugin fetch [<Keyword> [<Keyword>]*>]`

<% var plugins =""; if(isCordova) { plugins+="Apache Cordova plugins" } if(isHtml) { plugins+=" or " } if(isNativeScript) { plugins+="custom npm or NativeScript modules" } %>

<% var plugin =""; if(isCordova) { plugin+="Apache Cordova plugin" } if(isHtml) { plugin+=" or " } if(isNativeScript) { plugin+="custom npm or NativeScript module" } %>

Imports the selected <%=plugin%> into your project.<% if(isHtml) { %> You can specify an Apache Cordova plugin by local path; URL to a GitHub repository; name, ID or keyword of a plugin published in the Apache Cordova Plugin Registry or the npm registry. You can specify a custom npm or NativeScript module by local path; URL to a GitHub repository; name, ID or keyword of a module published in the npm registry.

For Apache Cordova plugins, this operation copies the Apache Cordova plugin files to the `plugins` directory.  
For NativeScript projects, this operation copies the module files to the `plugins` directory and adds the module as a dependency in the `package.json` file of your project.
<% } %>
<% if(isConsole) { %>
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You can fetch only Plugman-compatible Apache Cordova plugins.
* You can fetch only custom NativeScript modules which are valid npm packages.

### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all <%=plugins%> that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables <%=plugins%> for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](plugin-remove.html) | Disables <%=plugins%> from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for <%=plugins%>.
<% } %>
