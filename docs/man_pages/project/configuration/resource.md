resource
==========

Usage | Synopsis
------|-------
General | `$ appbuilder resource [<Command>]`

Lists information about the splash screens and icons for all mobile platforms.

<% if(isConsole && isMobileWebsite) { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help resource`
<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>

### Attributes
`<Command>` extends the `resource` command. You can set the following values for this attribute.
* `create` - Creates icons or splash screens for all mobile platforms from a single high-resolution image.
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework&nbsp;set](mobileframework-set.html) | Sets the selected development framework version for the project.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>