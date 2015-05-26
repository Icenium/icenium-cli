web-view set
==========

Usage | Synopsis
------|-------
General | `$ appbuilder web-view set <Platform> <WebViewName>`

Sets the selected web view for the current project and updates the integrated plugins to match it.

<% if(isConsole)  { %>
<% if(isNativeScript)  { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help web-view set`
<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help web-view set`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>

### Attributes
* `<Platform>` is the target mobile platform for which you want to change your web view. 
* `<WebViewName>` is the web view name as listed by `$ appbuilder web-view`.
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework](mobileframework.html) | Lists all supported versions of Apache Cordova.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[web-view](web-view.html) | Lists all supported web views for different mobile platforms.
<% } %>