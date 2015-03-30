create native
==========

Usage | Synopsis
------|-------
General | `$ appbuilder create native <App name> [--template <Template>] [--path <path>] [--appid <App ID>]`
Creates a new project from a NativeScript-based template.
`<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters:
    A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).

Options:
    --template `<Template>` - Sets the source template for the project. You can use the following templates:
        `<%=#{nativeScriptProject.projectTemplatesString}%>`. The default value is Blank.
    --path - Specifies the path where you want to create the project, if different from the current directory.
        The directory must be empty.
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