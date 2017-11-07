create hybrid
==========

Usage | Synopsis
------|-------
General | `$ appbuilder create hybrid <App name> [--template <Template>] [--path <Directory>] [--appid <App ID>]`

Creates a new project for hybrid development from an Apache Cordova template in the current directory.
<% if(isConsole) { %>
WARNING: Always run this command in an empty directory or specify `--path` to an empty directory.
<% } %>
### Options
* `--template` - Sets the source template for the project.
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.
* `--appid` - Sets the application identifier for your app. If not specified, the application identifier is set to `com.telerik.<App name>`.

### Attributes
* `<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<Template>` is the source template that you want to use. The default value is `KendoUI.Blank`. You can use the following templates: <%=#{cordovaProject.getProjectTemplatesString}%>.
* `<App ID>` must consist of one or more alphanumeric strings, separated by a dot. The strings must be valid uniform type identifiers (UTIs), containing letters, numbers, hyphens, underscores or periods. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps.
<% if(isHtml) { %>
### Command Limitations

* You must run this command in an empty directory or specify `--path` to an empty directory.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[create](create.html) | Creates a project for hybrid or native development.
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
