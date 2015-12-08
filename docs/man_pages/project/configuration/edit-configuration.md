edit-configuration
==========

Usage | Synopsis
------|-------
General | `$ appbuilder edit-configuration <ConfigurationFile>`

Opens a configuration file for editing.
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes
* `<ConfigurationFile>` is the configuration file that you want to open. The following values are valid for this attribute.
<% if(isConsole && (isNativeScript || isCordova)) { %><%=#{project.configurationFilesString}%><% } %><% } %>	<% if(isHtml) { %>* `android-manifest` - Opens AndroidManifest.xml for editing and creates it, if needed.
    * `android-config` - Opens config.xml for Android for editing and creates it, if needed.
    * `ios-info` - Opens Info.plist for editing and creates it, if needed.
    * `ios-config` - Opens config.xml for iOS for editing and creates it, if needed.
    * `wp8-manifest` - Opens WMAppManifest.xml for editing and creates it, if needed.
    * `wp8-config` - Opens config.xml for Windows Phone 8 for editing and creates it, if needed.

### Related Commands

Command | Description
----------|----------
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework set](mobileframework-set.html) | Sets the selected development framework version for the project.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[resource](resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
