mobileframework set
==========

Usage | Synopsis
------|-------
General | `$ appbuilder mobileframework set <Version> [--path <Directory>]`

Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.

<% if(isConsole)  { %>
<% if(isNativeScript)  { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help mobileframework set`
<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help mobileframework set`
<% } %>
<% } %>

<% if(isCordova)  { %>
`<Version>` is the version of the framework as listed by `$ appbuilder mobileframework`

Options:
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
<% } %>

<% if(isHtml) { %> 
#### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

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