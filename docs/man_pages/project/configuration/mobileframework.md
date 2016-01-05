mobileframework
==========

Usage | Synopsis
------|-------
General | `$ appbuilder mobileframework [<Command>] [--path <Directory>]`

<% if(isHtml) { %>Lists all supported versions of the current development framework.<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Options
* `--path` - Specifies the directory that contains the project. If not specified, the project is searched for in the current directory and all directories above it.

### Attributes

`<Command>` extends the `mobileframework` command. You can set the following values for this attribute.
* `set` - Sets the selected framework version for the project.
<% } %>
<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[edit-configuration](edit-configuration.html) | Opens a configuration file for editing.
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
