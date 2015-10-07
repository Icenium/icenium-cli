plugin find
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin find [<Keyword> [<Keyword>]*>]`

<% var plugins =""; if(isCordova || isMobileWebsite) { plugins+="Apache Cordova plugins" } if(isHtml || (isConsole && isMobileWebsite)) { plugins+=" or " } if(isNativeScript || isMobileWebsite) { plugins+="custom npm or NativeScript modules" } %>

Searches by one or more keywords for <%=plugins%> in <% if(isCordova || isMobileWebsite) { %>the Apache Cordova Plugin Registry<% } %><% if(isHtml || (isConsole && isMobileWebsite)) { %> or <% } %><% if(isNativeScript || isMobileWebsite) { %>the npm registry<% } %><% if(isHtml || (isConsole && isMobileWebsite)) { %>, respectively<% } %>.

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
[plugin](plugin.html) | Lists all <%=plugins%> that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables <%=plugins%> for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](plugin-remove.html) | Disables <%=plugins%> from your project.
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>