init
==========

Usage | Synopsis
------|-------
General | `$appbuilder init [<Type>]`

Initializes an existing project for development. The command attempts to determine the project type and retain any existing configuration based on the files in the working directory.  

You can run the `init` command with a command extension that specifies the project type.

### Attributes
`<Type>` extends the `init` command. You can set the following values for this attribute.
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
[create screenbuilder](create-screenbuilder.html) | Creates a new Screen Builder project.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample website](sample-website.html) | Lists all available mobile website sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>