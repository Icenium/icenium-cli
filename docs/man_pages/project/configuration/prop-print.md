prop print
==========

Usage | Synopsis
------|-------
Print all properties | `$ appbuilder prop print [--valid-value]<% if(isCordova) { %> [--debug] [--release]<% } %>`
Print a selected property | `$ appbuilder prop print <Property Name> [--valid-value]<% if(isCordova) { %> [--debug] [--release]<% } %>`

Prints information about the configuration of the project or the selected property.
If `--valid-value` is set, prints the valid configuration values.
If not set, prints the current configuration.

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--valid-value` - When set, prints the valid values for all valid project properties or for the selected property.
<% if(isCordova) { %>
* `--debug` - When set, prints information about your project settings for the Debug build configuration. This switch is applicable to the `$ appbuilder prop print` and `$ appbuilder prop print CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - When set, prints information about your project settings for the Release build configuration. This switch is applicable to the `$ appbuilder prop print` and `$ appbuilder prop print CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
<% } %>
### Attributes
* `<Property Name>` is the name of the project property as listed by `$ appbuilder prop print`
<% } %>
<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | Opens a configuration file for editing.
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework set](mobileframework-set.html) | Sets the selected development framework version for the project.
[prop](prop.html) | Lets you manage the properties for your project.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[resource](resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
