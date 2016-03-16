prop print AndroidVersionCode
==========

Usage | Synopsis
------|-------
General | `$ appbuilder prop print AndroidVersionCode [--valid-value]`

Prints information about the configuration of the AndroidVersionCode property.<% if(isHtml) { %> This property sets the internal version of the application that is not visible to the user. For every new version of your app, you need to increase the version code by one. For more information about version code, see <a href="http://developer.android.com/guide/topics/manifest/manifest-element.html#vcode" target="_blank">versionCode in the Android Manifest API Guide</a>.<% } %>

After you build your app for Android, the version code for the application package will differ from the version code you specified. The final version code will have an additional digit appended at the back: 2.<% if(isHtml) { %><br/>Apache Cordova automatically appends a specific number to the version code based on the target Android SDK and architecture. This is not controlled by AppBuilder and is an implementation decision made entirely by the Apache Cordova team. For more information, see <a href="https://issues.apache.org/jira/browse/CB-8976">https://issues.apache.org/jira/browse/CB-8976</a>.<% } %>

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--valid-value` - When set, prints the description for the AndroidVersionCode property.
<% } %>
<% if(isHtml) { %>
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
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[resource](resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
