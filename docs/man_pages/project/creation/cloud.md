cloud
==========

Usage | Synopsis
------|-------
List all solutions | `$ appbuilder cloud --all`
List projects in a solution | `$ appbuilder cloud [<Solution Name or Index>]`
Export projects | `$ appbuilder cloud export [<Solution Name or Index>] [<Project Name or Index>]`

Lists all solutions and projects associated with your Telerik Platform account.

### Options
* `--all` - Lists all solutions with index and name.

### Attributes

* `export` - Extends the `cloud` command. Exports a selected project from the cloud and initializes it for development in the AppBuilder CLI. You must run this command in a directory that does not contain a project.
* `<Solution Name or Index>` is the name of the solution as listed by `$ appbuilder cloud --all` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client. You need to set a solution if you are running a non-interactive console.
* `<Project Name or Index>` is the name or the index of project, relative to its parent solution, as listed by `$ appbuilder cloud` or as it appears in the AppBuilder in-browser client or the AppBuilder Windows client.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
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
