prop print
==========

Usage | Synopsis
------|-------
Print all properties | `$ appbuilder prop print [--validValue]<% if(isCordova) { %> [--debug] [--release]<% } %>`
Print a selected property | `$ appbuilder prop print <Property Name> [--validValue]<% if(isCordova) { %> [--debug] [--release]<% } %>`

Prints information about the configuration of the project or the selected property.  
If `--validValue` is set, prints the valid configuration values.  
If not set, prints the current configuration. 

<% if(isConsole && isMobileWebsite) { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help prop print`
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--validValue` - When set, prints the valid values for all valid project properties or for the selected property.
<% if(isCordova) { %>  
* `--debug` - When set, prints information about your project settings for the Debug build configuration. This switch is applicable to the `$ appbuilder prop print` and `$ appbuilder prop print CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - When set, prints information about your project settings for the Release build configuration. This switch is applicable to the `$ appbuilder prop print` and `$ appbuilder prop print CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
<% } %>
### Attributes
* `<Property Name>` is the name of the project property as listed by `$ appbuilder prop print`
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
[prop](prop.html) | Lets you manage the properties for your project.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>