prop remove
==========

Usage | Syntax
------|-------
General | `$ appbuilder prop remove <Property Name> <Value> [Value]*`

Disables options for the selected project property, if the property accepts multiple values.
`<Property Name>` is the name of the project property as listed by `$ appbuilder prop print`
> WARNING: Do not modify the CorePlugins property with this command. Instead, use the `$ appbuilder plugin commands`.

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