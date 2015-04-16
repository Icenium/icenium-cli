create website
==========

Usage | Synopsis
------|-------
General | `$ appbuilder create website <Site name> [--template <Template>] [--path <path>]`

Creates a new project from a Mobile Website template in the current directory.

<% if(isConsole) { %>WARNING: Always run this command in an empty directory or specify `--path` to an empty directory.<% } %>
### Options
* `--template` - Sets the source template for the project.
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.

### Attributes
* `<Site name>` is the name of the website. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<Template>` is the source template that you want to use. The default value is `KendoUI.TabStrip`. You can use the following templates: <%=#{mobileWebsiteProject.projectTemplatesString}%>.
<% if(isHtml) { %>
### Command Limitations

* You must run this command in an empty directory or specify `--path` to an empty directory.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new Screen Builder project.
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