prop set
==========

Usage | Synopsis
------|-------
General | `$ appbuilder prop set <Property Name> <Value> [Value]*`
<% if(isCordova) { %>Set plugins for the Debug build configuration | `$ appbuilder prop set CorePlugins <Value> [Value]* --debug`
Set plugins for the Release build configuration | `$ appbuilder prop set CorePlugins <Value> [Value]* --release`<% } %>

Sets the selected project property and overwrites its current value.

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
<% if(isCordova) { %>### Options

* `--debug` - Sets the specified plugin(s) from the Debug build configuration only. This switch is applicable only to `$ appbuilder prop set CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
* `--release` - Sets the specified plugin(s) from the Release build configuration only. This switch is applicable only to `$ appbuilder prop set CorePlugins` commands.<% if(isHtml) { %> For more information about build configurations, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).<% } %>
<% } %>
### Attributes
* `<Property Name>` is the name of the project property as listed by `$ appbuilder prop print`
* `<Value>` is a valid value as listed by `$ appbuilder prop print <Property Name> --valid-value`. You can separate multiple values with a space.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You can set the `--debug` and `--release` switches only for the `CorePlugins` property for Apache Cordova projects.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | Opens a configuration file for editing.
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework set](mobileframework-set.html) | Sets the selected development framework version for the project.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[resource](resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
