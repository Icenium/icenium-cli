create native
==========

Usage | Synopsis
------|-------
General | `$ appbuilder create native <App name> [--template <Template>] [--path <path>] [--appid <App ID>]`

Creates a new project for native development from a NativeScript template in the current directory.  
<% if(isConsole) { %>WARNING: Always run this command in an empty directory or specify `--path` to an empty directory.<% } %>
### Options
* `--template` - Sets the source template for the project.
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.
* `--appid` - Sets the application identifier for your app. If not specified, the application identifier is set to `com.telerik.<App name>`. 

### Attributes
* `<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<Template>` is the source template that you want to use. The default value is `Blank`. You can use the following templates: <%=#{nativeScriptProject.projectTemplatesString}%>.
* `<App ID>` must consist of at least three alphanumeric strings, separated by a dot (.). Each string must start with a letter. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps. 
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
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>