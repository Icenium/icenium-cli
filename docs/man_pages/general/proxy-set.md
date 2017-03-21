proxy set
==========

Usage | Synopsis
------|-------
General | `$ appbuilder proxy set [<Hostname> [<Port> [<Username> [<Password>]]]]`

Sets proxy settings.

### Attributes
* `<Hostname>` the hostname of the proxy. If you do not provide this when running the command, the AppBuilder CLI will prompt you to provide it.
* `<Port>` the port of the proxy. If you do not provide this when running the command, the AppBuilder CLI will prompt you to provide it.
* `<Username>` and `<Password>` are your credentials for the proxy. These are not necessary, however if you provide a `<Username>` you need to provide a `<Password>` too.


<% if(isHtml) { %>
### Command Limitations

* You can run this command only on Windows OS.

### Related Commands

Command | Description
----------|----------
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
<% } %>
