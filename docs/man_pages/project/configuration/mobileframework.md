mobileframework
==========

Usage | Synopsis
------|-------
General | `$ appbuilder mobileframework [<Command>] [--path <Directory>]`

Lists all supported versions of Apache Cordova.

<% if(isConsole) { %>
<% if(isNativeScript)  { %>
WARNING: This command and its related commands are not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help mobileframework`
<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command and its related commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help mobileframework`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.

### Attributes

`<Command>` is a related command that extends the `mobileframework` command. You can run the following related commands:
* `set` - Sets the selected framework version for the project and updates the plugins according to the new version.

<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop](prop.html) | You must run the prop command with a related command.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
<% } %>