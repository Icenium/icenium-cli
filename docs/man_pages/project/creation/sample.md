sample
==========

Usage | Synopsis
------|-------  
General | `$ appbuilder sample [<Command>]`

Lists all available sample apps with name, description, GitHub repository and clone command. To clone a selected sample app, run its clone command as listed by `$ appbuilder sample`

### Attributes
`<Command>` extends the `sample` command. You can set the following values for this attribute.
* `hybrid` - Lists all available Apache Cordova sample apps.
* `native` - Lists all available NativeScript sample apps.
* `clone` - Clones a selected sample app.

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
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
<% } %>