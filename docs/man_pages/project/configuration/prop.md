prop
==========

Usage | Syntax
------|-------
General | `$ appbuilder prop <Command>`

You must run the prop command with a related command.

`<Command>` is a related command that extends the prop command. You can run the following related commands:
* `print` - Prints the current project configuration or the value for the selected project property.
* `add` - Enables more options for the selected project property, if the property accepts multiple values.
* `set` - Sets the selected project property and overwrites its current value.
* `remove` - Disables options for the selected project property, if the property accepts multiple values.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[mobileframework](mobileframework.html) | Lists all supported versions of Apache Cordova.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[prop](prop.html) | You must run the prop command with a related command.
<% } %>