prop remove
==========

Usage | Synopsis
------|-------
General | `$ appbuilder prop remove <Property Name> <Value> [Value]*`

Disables options for the selected project property, if the property accepts multiple values.

<% if(isConsole) { %>
<% if(isMobileWebsite) { %>
WARNING: This command and its related commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help prop remove`
<% } %> 
<% if(isCordova) { %>
WARNING: Do not modify the `CorePlugins` property with this command. Instead, use the `$ appbuilder plugin <Command>`
<% } %> 
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
#### Attributes
* `<Property Name>` is the name of the project property as listed by `$ appbuilder prop print`
* `<Value>` is a current value of the property as listed by `$ appbuilder prop print <Property Name>`. You can separate multiple values with a space.
<% } %> 
<% if(isHtml) { %> 
#### Command Limitations

* Do not modify the `CorePlugins` property with this command. Instead, use the `$ appbuilder plugin <Command>`
* You cannot run this command on mobile website projects.

#### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework](mobileframework.html) | Lists all supported versions of Apache Cordova.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop](prop.html) | You must run the prop command with a related command.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
<% } %>