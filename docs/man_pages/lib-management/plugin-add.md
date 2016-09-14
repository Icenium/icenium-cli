plugin add
==========

<% if(isHtml) { %>## Apache Cordova Projects<% } %>
<% if(isCordova) { %>
Usage | Synopsis
------|---------
List Apache Cordova plugins | `$ appbuilder plugin add --available [--debug] [--release]`
Add Apache Cordova plugins | `$ appbuilder plugin add <Name or ID> [--debug] [--release]`
Add a specific version of an Apache Cordova plugin | `$ appbuilder plugin add <Name or ID>@<Version> [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the latest version of an Apache Cordova plugin | `$ appbuilder plugin add <Name or ID> --latest [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add the default version of an Apache Cordova plugin | `$ appbuilder plugin add <Name or ID> --default [--debug] [--release] [--var.<Variable ID> <Variable Value>]`[\*\*](#note)
Add an Apache Cordova plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add a specific version of an Apache Cordova plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID>@<Version> --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the latest version of an Apache Cordova plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --latest --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)
Add the default version of an Apache Cordova plugin and set all variables from the command line | `$ appbuilder plugin add <Name or ID> --default --var.debug.<Variable ID> <Variable Value> --var.release.<Variable ID> <Variable Value>`[\*\*](#note)

<% if(isHtml) { %><a id="note"></a><% } %>
\*\* If the Apache Cordova plugin has multiple variables, you can set `--var` for each variable.
<% } %>

<% if(isHtml) { %>## NativeScript Projects<% } %>
<% if(isNativeScript) { %>
Usage | Synopsis
------|---------
List custom npm or NativeScript modules | `$ appbuilder plugin add --available [--count]`
Add custom npm or NativeScript modules | `$ appbuilder plugin add <Name or ID> [--no-types]`
Add a specific version of a custom npm or NativeScript module | `$ appbuilder plugin add <Name or ID>@<Version> [--no-types]`
Add the latest version of a verified NativeScript plugin | `$ appbuilder plugin add <Name or ID> --latest [--var.<Variable ID> <Variable Value>] [--no-types]`[\*\*](#note)
Add the default version of a verified NativeScript plugin | `$ appbuilder plugin add <Name or ID> --default [--var.<Variable ID> <Variable Value>] [--no-types]`[\*\*](#note)
Add a custom npm or NativeScript module from GitHub URL | `$ appbuilder plugin add <URL> [--no-types]`
Add a custom npm or NativeScript module from local path | `$ appbuilder plugin add <Path> [--no-types]`
Add custom npm or NativeScript module and set all variables from the command line | `$ appbuilder plugin add <Name or ID or URL or Path> --var.<Variable ID> <Variable Value> [--no-types]`[\*\*](#note)
Add a specific version of a custom npm or NativeScript module and set all variables from the command line | `$ appbuilder plugin add <Name or ID>@<Version> --var.<Variable ID> <Variable Value> [--no-types]`[\*\*](#note)


<% if(isHtml) { %><a id="note"></a><% } %>
\*\* If the NativeScript plugin has multiple variables, you can set `--var` for each variable.

For TypeScript projects, the command will try to install `.d.ts` files for the specified module from `@types`. If you do not want to install the `.d.ts` files, you can set the `--no-types` flag.
<% } %>

<% var plugins =""; if(isCordova) { plugins+="Apache Cordova plugins" } if(isHtml) { plugins+=" or " } if(isNativeScript) { plugins+="custom npm or NativeScript modules" } %>

<% var plugin =""; if(isCordova) { plugin+="Apache Cordova plugin" } if(isHtml) { plugin+=" or " } if(isNativeScript) { plugin+="custom npm or NativeScript module" } %>

Enables <%=plugins%> for your project. <% if(isHtml) { %>If the plugin has plugin variables and you have not set one or more of them with `--var`, the AppBuilder CLI shows an interactive prompt to let you set their values.<% } %>
<% if((isConsole && (isCordova || isNativeScript)) || isHtml) { %>
### Options
* `--available` - Lists all <%=plugins%> that you can enable in your project and shows information about their variables, if any.
* `--var.<Variable ID>` - Sets the value for the specified plugin variable in all configurations.
	<% if(isHtml) { %><br /><% } %><% if(isCordova) { %>(Apache Cordova-only) If `--debug` or `--release` is specified, sets the variable for the respective configuration of the hybrid project.<% } %>
* `--latest` - Enables the latest version of the specified verified plugin.
* `--default` - Enables the default version of the specified verified plugin.
<% if(isCordova) {%>* `--debug` - Enables the specified Apache Cordova plugin for the Debug build configuration only. If `--available` is set, lists all plugins that you can enable for the Debug build configuration.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %>
* `--release` - Enables the specified Apache Cordova plugin for the Release build configuration only. If `--available` is set, lists all plugins that you can enable for the Release build configuration.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %>
* `--var.debug.<Variable ID>` - Sets the value for the specified Apache Cordova plugin variable for the Debug configuration only.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %>
* `--var.release.<Variable ID>` - Sets the value for the specified Apache Cordova plugin variable for the Release configuration only.<% if(isHtml) { %> This option is applicable only to Apache Cordova projects.<% } %><% } %>
<% if(isNativeScript) { %>* `--count` - If `--available` is set, specifies the number of npm and NativeScript modules that will be listed.<% if(isHtml) { %> This option is applicable only to NativeScript projects.<% } %>
* `--no-types` - Disables the installation of `.d.ts` from `@types` for the specified module. This option is applicable only to NativeScript projects.
<% } %>

### Attributes
* `<Name or ID>` is the name or ID of the <%=plugin%> as listed by `$ appbuilder plugin add --available`<% if(isNativeScript) { %> or `$ appbuilder plugin find`<% } %>
* `<Version>` is the version of the <%=plugin%> as listed by `$ appbuilder plugin add --available`<% if(isNativeScript) { %> or the npm module specification.<% } %>
<% if(isCordova) {%>* `<Variable ID>` is the plugin variable as listed in the `plugin.xml` of the Apache Cordova plugin.<% if(isHtml) { %> This parameter is applicable only to Apache Cordova projects.<% } %><% } %>
<% if(isNativeScript) { %>* `<URL>` is the GitHub URL to the custom module.<% if(isHtml) { %> This parameter is applicable only to NativeScript projects.<% } %>
* `<Path>` is the path to local directory or a tarball archive (.tar.gz) that contains a valid custom module.<% if(isHtml) { %> This parameter is applicable only to NativeScript projects.<% } %><% } %>
<% } %>

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[kendoui](kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[plugin](plugin.html) | Lists all <%=plugins%> that are currently enabled for your project.
[plugin configure](plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](plugin-remove.html) | Disables <%=plugins%> from your project.
[plugin find](plugin-find.html) | Searches by one or more keywords for <%=plugins%>.
[plugin fetch](plugin-fetch.html) | Imports the selected <%=plugins%> into your project.
<% } %>
