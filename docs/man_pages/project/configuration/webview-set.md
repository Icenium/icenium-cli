webview set
==========

Usage | Synopsis
------|-------
Android | $ appbuilder webview set android <Web View Name>
iOS | $ appbuilder webview set ios <Web View Name>

Sets the selected web view for the current project. <% if(isHtml) { %>Setting a pluggable web view also enables the respective Apache Cordova plugin for your project. For more information, see [Configure the Web View for Your Project](http://docs.telerik.com/platform/appbuilder/configuring-your-project/configure-web-views).<% } %>

<% if(isConsole)  { %>
<% if(isNativeScript)  { %>
WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help webview set`
<% } %>
<% } %>
<% if(isHtml) { %>
### Prerequisites

* If you want to use the `Crosswalk` web view for Android, verify that you meet the following requirements.
    * Your project targets Apache Cordova 4.0.0 or later.
    * Your Android devices run on Android 4.0 or later.
* If you want to use the `WKWebView` web view for iOS, verify that you meet the following requirements.
    * Your project targets Apache Cordova 3.7.0 or later.
    * Your iOS devices run on iOS 8 or later.
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>
### Attributes

* `<Web View Name>` is the web view name as listed by `$ appbuilder webview`
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot configure web views for Windows Phone.

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
<% } %>
