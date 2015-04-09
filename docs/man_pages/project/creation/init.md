init
==========

Usage | Synopsis
------|-------
General | `$appbuilder init [<Type>]`

Initializes an existing project for development. The command attempts to determine the project type and retain any existing configuration based on the files in the working directory.  

You can run the `init` command with a related command that specifies the project type.

### Attributes
`<Type>` is a related command that extends the `init` command. You can run the following related commands:
* `hybrid` - Initializes an existing Apache Cordova project for development in the current directory.
* `native` - Initializes an existing NativeScript project for development in the current directory.
* `website` - Initializes an existing Mobile Website project for development in the current directory.

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>