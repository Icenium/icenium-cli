publish add
==========

Usage | Synopsis
------|-------
General | `$ appbuilder publish add [<Name> [<PublishUrl>]]`

Saves a new server connection. <% if(isHtml) { %>If you do not provide one or more command parameters, the Telerik AppBuilder CLI shows an interactive prompt to let you set the remaining details. <% } %>

<% if(isConsole) { %>
<% if(isCordova) { %>WARNING: This command is not applicable to Apache Cordova projects. To view the complete help for this command, run `$ appbuilder help publish add`<% } %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help publish add` <% } %>
<% } %>
<% if((isConsole && isMobileWebsite) || isHtml) { %>
### Attributes

* `<PublishUrl>` is the URL of a remote server in an `ftp://<address>` format.
<% } %>
<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on NativeScript projects.
* You cannot run this command on Apache Cordova projects.
### Related Commands

Command | Description
----------|----------
[publish](publish.html) | Lists all saved connections or publishes to the selected connection.
[publish remove](publish-remove.html) | Removes a saved connection.
<% } %>