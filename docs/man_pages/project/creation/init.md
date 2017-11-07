init
==========

Usage | Synopsis
------|-------
General | `$appbuilder init [<Type>]`

Initializes an existing project for development. The command attempts to determine the project type and retain any existing configuration based on the files in the working directory.
The command will create AppBuilder native project from `NativeScript` project or hybrid project from `Cordova` or `Ionic` project.

You can run the `init` command with a command extension that specifies the project type.

### Attributes
`<Type>` extends the `init` command. You can set the following values for this attribute.
* `hybrid` - Initializes an existing Apache Cordova project for development in the current directory.
* `native` - Initializes an existing NativeScript project for development in the current directory.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[export](export.html) | Exports a cloud-based project from a selected solution to facilitate the migration to a different framework.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>
