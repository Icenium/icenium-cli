export
==========

Usage | Synopsis
------|-------
Export selected project from solution so that it can be used with Cordova CLI | `$ appbuilder export [<Solution Name or Index> [<Project Name or Index> [--path <Directory or File>]]]`

Exports a cloud-based project from a selected solution to facilitate the migration to a different framework. NativeScript projects can be developed with the NativeScript CLI, whereas Hybrid projects can be developed with the Cordova CLI.

### Options
* `--path` - Specifies the directory or file where to download your exported project.

### Attributes
* `<Solution Name or Index>` is the name of the solution as listed by `$ appbuilder cloud --all` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client. You need to set a solution and a project if you are running a non-interactive console.
* `<Project Name or Index>` is the name or the index of project, relative to its parent solution, as listed by `appbuilder cloud` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client.
<% if(isHtml) { %>
### Command Limitations

* In order to export a hybrid project it must target Cordova 6.4.0

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>
