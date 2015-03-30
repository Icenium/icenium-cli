cloud export
==========

Usage | Synopsis
------|-------
General | `$ appbuilder cloud export <Project ID> [--path <Directory>]`

Exports one of your projects from the cloud and initializes it for development in the current directory.
`<Project ID>` is the index or name of the project as listed by `$ appbuilder cloud`
Options:
* `--path` - Specifies the directory where to export the selected project on your file system. If not set, exports the project in the current directory.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[create](create.html) | Creates a project for hybrid or native development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[init](init.html) | Initializes an existing project for development.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
<% } %>