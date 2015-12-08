plugin find
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin find [<Keyword> [<Keyword>]*>]`

<% var plugins =""; if(isCordova) { plugins+="Apache Cordova plugins" } if(isHtml) { plugins+=" or " } if(isNativeScript) { plugins+="custom npm or NativeScript modules" } %>

Searches by one or more keywords for <%=plugins%> in <% if(isCordova) { %>the Apache Cordova Plugin Registry<% } %><% if(isHtml) { %> or <% } %><% if(isNativeScript) { %>the npm registry<% } %><% if(isHtml) { %>, respectively<% } %>.

<% if(isHtml) { %>
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
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>
