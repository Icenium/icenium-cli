mobileframework
==========

Usage | Syntax
------|-------
General | `$ appbuilder mobileframework [<Command>] [--path <Directory>]`

Lists all supported versions of Apache Cordova.
<% if(isNativeScript)  { %>
This command and its related commands are not applicable to NativeScript projects.
<% } %>

`<Command>` is a related command that extends the mobileframework command. You can run the following related commands:
* `set` - Sets the selected framework version for the project and updates the plugins according to the new version.

Options:
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.
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