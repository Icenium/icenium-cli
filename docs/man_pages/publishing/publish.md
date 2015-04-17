publish
==========

Usage | Synopsis
------|-------
List connections | `$ appbuilder publish`
Publish website to a saved connection | `$ appbuilder publish <Connection Index> [<Username> [<Password>]] [--force]`
Publish website to URL | `$ appbuilder publish <URL> [<Username> [<Password>]] [--force]`
Manage connections | `$ appbuilder publish <Command>`

Lists saved server connections or lets you publish your website to a selected server connection. <% if(isHtml) { %>If you do not provide one or more command parameters, the Telerik AppBuilder CLI shows an interactive prompt to let you set the remaining details. <% } %>

<% if(isConsole) { %>
<% if(isCordova) { %>WARNING: This command is not applicable to Apache Cordova projects. To view the complete help for this command, run `$ appbuilder help publish`<% } %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help publish` <% } %>
<% } %>

<% if((isConsole && isMobileWebsite) || isHtml) { %>
### Options
* `--force | -f` - If set, purges the project directory on the remote server before uploading the mobile website.

### Attributes
* `<Connection Index>` is the index of the connection as listed by `$ appbuilder publish`
* `<URL>` is the URL of a remote server.
* `<Username>` and `<Password>` are your credentials for the remote server.
* `<Command>` extends the `publish` command. You can set the following values for this attribute.
	* `add` - Saves a new server connection.
	* `remove` - Removes a saved server connection.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on Apache Cordova projects.

### Related Commands

Command | Description
----------|----------
[publish](publish.html) | Lists all saved connections or publishes to the selected connection.
[publish add](publish-add.html) | Saves a new server connection.
<% } %>
