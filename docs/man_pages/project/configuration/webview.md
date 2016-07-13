webview
==========

Usage | Synopsis
------|-------
General | `$ appbuilder webview [<Command>]`

Lists the available web views for iOS and Android. <% if(isHtml) { %>For more information about working with web views in AppBuilder, see [Configure the Web View for Your Project](http://docs.telerik.com/platform/appbuilder/configuring-your-project/configure-web-views).<% } %>

<% if(isConsole) { %>
<% if(isNativeScript)  { %>
WARNING: This command and its extended commands are not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help webview`
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
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
