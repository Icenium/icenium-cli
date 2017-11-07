cloud export
==========

Usage | Synopsis
------|-------
Export selected project from solution | `$ appbuilder cloud export <Solution Name or Index> <Project Name or Index> [--path <Directory>]`
Export all projects from solution | `$ appbuilder cloud export <Solution Name or Index> [--path <Directory>]`

Exports one or all projects from a selected solution in the cloud and initializes it for development. The current directory must be empty.

<% if(isConsole) { %>WARNING: Always run this command in an empty directory or specify `--path` to an empty directory.<% } %>

### Options
* `--path` - Specifies the directory where to export the selected project on your file system. The directory must be empty. If not set, exports the project in the current directory.

### Attributes
* `<Solution Name or Index>` is the name of the solution as listed by `$ appbuilder cloud --all` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client. You need to set a solution if you are running a non-interactive console. <% if(isHtml) { %>When you do not specify a project, the AppBuilder CLI creates a new directory named after the solution and as many sub-directories named after the projects as needed inside the solution-named directory. The sub-directories contain all your project files. If the solution contains one project, this operation creates one sub-directory in the new solution-named directory.<% } %>
* `<Project Name or Index>` is the name or the index of project, relative to its parent solution, as listed by `appbuilder cloud` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client. <% if(isHtml) { %>When you specify a project, the AppBuilder CLI creates a new directory named after the project. The sub-directory contains all your project files.<% } %>
<% if(isHtml) { %>
### Command Limitations

* You must run this command in an empty directory or specify `--path` to an empty directory.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[export](export.html) | Exports a cloud-based project from a selected solution to facilitate the migration to a different framework.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>
