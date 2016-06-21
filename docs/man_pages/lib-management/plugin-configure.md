plugin configure
==========

Usage | Synopsis
------|-------
Call the interactive prompt to set plugin variables | `$ appbuilder plugin configure <Name or ID> [--debug] [--release]`
Set one value for all applicable configurations | `$ appbuilder plugin configure <Name or ID> [--debug] [--release] --var.<Variable ID> <Variable Value>`[\*\*](#note)
<% if(isCordova) { %>Set different values for all configurations | `$ appbuilder plugin configure <Name or ID> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>]*>]`[\*\*\*](#cordovaNote)<% } %>

<% var plugins =""; if(isCordova) { plugins+="Apache Cordova plugins" } if(isHtml) { plugins+=" or " } if(isNativeScript) { plugins+="custom npm or NativeScript modules" } %>

<% if(isHtml) { %><a id="note"></a><% } %>
\*\* If the plugin has multiple variables, you can set `--var` for each variable.
<% if (isCordova) { %>
<% if(isHtml) { %><a id="cordovaNote"></a><% } %>
\*\*\* This command is available only for Apache Cordova plugins. If the plugin has multiple variables, you can set `--var` for each variable.
<% } %>

Configures plugin variables for the selected plugin.<% if(isHtml) { %>If you have not set one or more of the plugin variables with `--var`, the AppBuilder CLI shows an interactive prompt to let you set their values.<% } %>


### Options
* `--var.<Variable ID>` - Sets the value for the specified plugin variable in all configurations. <% if(isCordova) { %>If `--debug` or `--release` is specified, sets the variable for the respective configuration only, if the plugin is already enabled for this configuration. <% } %>
<% if((isConsole && isCordova) || isHtml) { %>
* `--debug` - Sets the plugin variable for the Debug build configuration only. The plugin must be enabled for the specified configuration.
* `--release` - Sets the plugin variable for the Release build configuration only. The plugin must be enabled for the specified configuration.
* `--var.debug.<Variable ID>` - Sets the value for the specified plugin variable for the Debug configuration only. The plugin must be enabled for the specified configuration.
* `--var.release.<Variable ID>` - Sets the value for the specified plugin variable for the Release configuration only. The plugin must be enabled for the specified configuration.
<% } %>

<%
	var configFileName = "";
	if(isCordova) {
		configFileName = "`plugin.xml`";
	}

	if(isCordova && isNativeScript) {
		// In html help or outside of project.
		configFileName += " or ";
	}

	if(isNativeScript) {
		configFileName += "`package.json`";
	}
%>
### Attributes
* `<Name or ID>` is the name or ID of the plugin as listed by `$ appbuilder plugin`
* `<Variable ID>` is the plugin variable as listed in the <%= configFileName %> of the plugin.

<% if(isHtml) { %>
### Command Limitations

* You cannot run this command on NativeScript projects.

### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all <%=plugins%> that are currently enabled for your project.
[plugin add](plugin-add.html) | Enables <%=plugins%> for your project.
[plugin remove](plugin-remove.html) | Disables <%=plugins%> from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for <%=plugins%>.
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>
