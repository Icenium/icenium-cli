mobileframework
==========

Usage | Synopsis
------|-------
General | `$ appbuilder mobileframework [<Command>] [--path <Directory>]`

<% if(isHtml) { %>Lists all supported versions of the framework.<% } %>

<% if(isConsole && isMobileWebsite) { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help mobileframework`
<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.

### Attributes

`<Command>` extends the `mobileframework` command. You can set the following values for this attribute.
* `set` -Sets the selected framework version for the project.
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
<% } %>