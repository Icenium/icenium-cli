mobileframework set
==========

Usage | Synopsis
------|-------
General | `$ appbuilder mobileframework set <Version> [--path <Directory>]`

<% if(isHtml) { %>Sets the selected development framework version for the project.<% } %>
<% if(isConsole) { %>
<% if(isCordova) { %>Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.<% } %>
<% if(isNativeScript)  { %>Sets the selected NativeScript version for the project and updates the NativeScript modules to match it.<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help mobileframework set`
<% } %>
<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.

### Attributes
* `<Version>` is the version of the framework as listed by `$ appbuilder mobileframework`
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>