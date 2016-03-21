plugin
==========

Usage | Synopsis
------|-------
List | `$ appbuilder plugin [--available] <% if(isCordova) { %>[--debug] [--release]<% } %><% if(isNativeScript) { %>[--count]<% } %>`
Manage | `$ appbuilder plugin <Command>`

<% var plugins =""; if(isCordova) { plugins+="Apache Cordova plugins" } if(isHtml) { plugins+=" or " } if(isNativeScript) { plugins+="custom npm or NativeScript modules" } %>

Lists all <%=plugins%> that are currently enabled for your project and shows information about their variables, if any. <% if(isHtml) { %>With the `--available` switch, lists all plugins or custom modules that are enabled in your project and that you can enable in your project.<% } %>

<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Options

* `--available` - Lists all <%=plugins%> that are currently enabled in your project and all <%=plugins%> that you can enable in your project. Shows information about the variables of the <%=plugins%>, if any. 
<% if(isCordova) { %>* `--debug` - Lists all Apache Cordova plugins enabled for the Debug build configuration. If `--available` is set, also lists all Apache Cordova plugins that you can enable for the Debug build configuration.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %>
* `--release` - Lists all Apache Cordova plugins enabled for the Release build configuration. If `--available` is set, also lists all Apache Cordova plugins that you can enable for the Release build configuration.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %><% } %>
<% if(isNativeScript) { %>* `--count` - Lists the selected number of npm and NativeScript modules. The default value is 10.<% if(isHtml) { %> This option is applicable only to NativeScript projects.<% } %><% } %>

### Attributes
`<Command>` extends the `plugin` command. You can set the following values for this attribute.
* `add` - Enables <%=plugins%> for your project.
* `configure` - Configures plugin variables for the selected plugin.
* `remove` - Disables <%=plugins%> for your project.
* `find` - Searches by keyword for <%=plugins%>.
* `fetch` - Imports the selected <%=plugins%> into your project.
<% } %>

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin add](plugin-add.html) | Enables <%=plugins%> for your project.
[plugin configure](plugin-configure.html) | Configures <%=plugins%> variables for selected plugin.
[plugin remove](plugin-remove.html) | Disables <%=plugins%> from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for <%=plugins%>.
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>
