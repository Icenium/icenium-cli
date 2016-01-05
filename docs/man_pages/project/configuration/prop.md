prop
==========

Usage | Synopsis
------|-------
General | `$ appbuilder prop <Command>`

This set of commands manages the properties for your project. You must run the `prop` command with a command extension.
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes
`<Command>` extends the `prop` command. You can set the following values for this attribute.
* `print` - Prints the current project configuration or the value for the selected project property.
* `add` - Enables more options for the selected project property, if the property accepts multiple values.
* `set` - Sets the selected project property and overwrites its current value.
* `remove` - Disables options for the selected project property, if the property accepts multiple values.
<% } %>
<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | Opens a configuration file for editing.
[mobileframework](mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework set](mobileframework-set.html) | Sets the selected development framework version for the project.
[prop print](prop-print.html) | Prints information about the configuration of the project or the selected property.
[prop add](prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop remove](prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[prop set](prop-set.html) | Sets the selected project property and overwrites its current value.
[resource](resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.
[webview](webview.html) | Lists the available web views for iOS and Android.
[webview set](webview-set.html) | Sets the selected web view for the current project.
<% } %>
