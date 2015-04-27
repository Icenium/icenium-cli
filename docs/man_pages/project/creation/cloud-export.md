cloud export
==========

Usage | Synopsis
------|-------
General | `$ appbuilder cloud export <Project ID> [--path <Directory>]`

Exports one of your projects from the cloud and initializes it for development in the current directory. The current directory must be empty.

<% if(isConsole) { %>WARNING: Always run this command in an empty directory or specify `--path` to an empty directory.<% } %> 

### Options
* `--path` - Specifies the directory where to export the selected project on your file system. The directory must be empty. If not set, exports the project in the current directory.

### Attributes
* `<Project ID>` is the index or name of the project as listed by `$ appbuilder cloud`
<% if(isHtml) { %> 
### Command Limitations

* You must run this command in an empty directory or specify `--path` to an empty directory.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample website](sample-website.html) | Lists all available mobile website sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>