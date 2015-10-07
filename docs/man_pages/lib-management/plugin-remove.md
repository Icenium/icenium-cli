plugin remove
==========

Usage | Synopsis
------|-------
General | `$ appbuilder plugin remove <Name or ID><% if(isCordova) { %> [--debug] [--release]<% } %>`

<% var plugins =""; if(isCordova || isMobileWebsite) { plugins+="Apache Cordova plugins" } if(isHtml || (isConsole && isMobileWebsite)) { plugins+=" or " } if(isNativeScript || isMobileWebsite) { plugins+="custom npm or NativeScript modules" } %>

<% var plugin =""; if(isCordova || isMobileWebsite) { plugin+="Apache Cordova plugin" } if(isHtml || (isConsole && isMobileWebsite)) { plugin+=" or " } if(isNativeScript || isMobileWebsite) { plugin+="custom npm or NativeScript module" } %>

Disables <%=plugins%> from your project.

<% if(isHtml) { %>For Apache Cordova projects, removes the files of the specified plugin from the `plugins` directory.  
For NativeScript projects, removes the module from the dependencies in the `package.json` of your project and, if needed, removes any module files from the `plugins` directory.<% } %>
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help plugin remove`
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--debug` - Disables the specified plugin for the Debug build configuration only.
* `--release` - Disables the specified plugin for the Release build configuration only.
<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Attributes
* `<Name or ID>` is the name or ID of the <%=plugin%> as listed by `$ appbuilder plugin`
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
[plugin find](plugin-find.html) | Searches by one or more keywords for <%=plugins%>.
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>
