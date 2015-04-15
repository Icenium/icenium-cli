prop
==========

Usage | Synopsis
------|-------
General | `$ appbuilder prop <Command>`

This set of commands manages the properties for your project. You must run the `prop` command with a command extension.
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help prop`
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes
`<Command>` extends the `prop` command. You can set the following values for this attribute.
* `print` - Prints the current project configuration or the value for the selected project property.
* `add` - Enables more options for the selected project property, if the property accepts multiple values.
* `set` - Sets the selected project property and overwrites its current value.
* `remove` - Disables options for the selected project property, if the property accepts multiple values.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework](mobileframework.html) | Lists all supported versions of Apache Cordova.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
<% } %>