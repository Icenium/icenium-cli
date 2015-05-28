webview
==========

Usage | Synopsis
------|-------
General | `$ appbuilder webview [<Command>]`

Lists the available web views for iOS and Android. <% if(isHtml) { %>For more information about working with web views in Telerik AppBuilder, see [Configure the Web View for Your Project](http://docs.telerik.com/platform/appbuilder/configuring-your-project/configure-web-views).<% } %>

<% if(isConsole) { %>
<% if(isNativeScript)  { %>
WARNING: This command and its extended commands are not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help webview`
<% } %>
<% if(isMobileWebsite)  { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help webview`
<% } %>
<% } %>
<% if((isConsole && isCordova) || isHtml) { %>

### Attributes

`<Command>` extends the `webview` command. You can set the following values for this attribute.
* `set` - Sets the selected web view for the current project.
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on mobile website projects.
* You cannot configure web views for Windows Phone.

### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | `<ConfigurationFile>` is the configuration file that you want to open.
[mobileframework set](mobileframework-set.html) | Sets the selected Apache Cordova version for the project and updates the enabled core or integrated plugins to match it.
[prop](prop.html) | Lets you manage the properties for your project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>