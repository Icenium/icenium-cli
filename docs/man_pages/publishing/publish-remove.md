publish remove
==========

Usage | Synopsis
------|-------
General | `$ appbuilder publish remove <Connection ID>`

Removes a saved connection.

<% if(isConsole) { %>
<% if(isCordova) { %>WARNING: This command is not applicable to Apache Cordova projects. To view the complete help for this command, run `$ appbuilder help publish remove`<% } %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help publish remove` <% } %>
<% } %>
<% if((isConsole && isMobileWebsite) || isHtml) { %>
### Attributes
* `<Connection ID>` is the index or name of the connection as listed by `$ appbuilder publish`
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