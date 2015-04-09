edit-configuration
==========

Usage | Synopsis
------|-------
General | `$ appbuilder edit-configuration <ConfigurationFile>`

Opens a configuration file for editing.
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help edit-configuration`
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes
* `<ConfigurationFile>` is the configuration file that you want to open. The following values are valid for this attribute.
<% if(isConsole && (isNativeScript || isCordova)) { %><%=#{project.configurationFilesString}%><% } %><% } %>	<% if(isHtml) { %>* `android-manifest` - Opens AndroidManifest.xml for editing and creates it, if needed.
    * `android-config` - Opens config.xml for Android for editing and creates it, if needed.
    * `ios-info` - Opens Info.plist for editing and creates it, if needed.
    * `ios-config` - Opens config.xml for iOS for editing and creates it, if needed.
    * `wp8-manifest` - Opens WMAppManifest.xml for editing and creates it, if needed.
    * `wp8-config` - Opens config.xml for Windows Phone 8 for editing and creates it, if needed.

### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[mobileframework](mobileframework.html) | Lists all supported versions of Apache Cordova.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop](prop.html) | You must run the prop command with a related command.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
<% } %>