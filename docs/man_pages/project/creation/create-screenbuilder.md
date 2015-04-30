create screenbuilder
==========

Usage | Synopsis
------|-------
General | `$ appbuilder create screenbuilder <App name> [--path <Directory>] [--appid <App ID>]`

Creates a new project for hybrid development with Screen Builder. <% if(isHtml) { %>Screen Builder lets you create a new project customized with navigation, home view and user interface skin. Later you can run the Screen Builder commands on this project to further customize it by adding application views, connecting to data sources, creating user registration and sign-in and adding forms, lists and fields.<% } %> 

### Options
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.
* `--appid` - Sets the application identifier for your app. If not specified, the application identifier is set to `com.telerik.<App name>`. 

### Attributes
* `<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<App ID>` must consist of one or more alphanumeric strings, separated by a dot. The strings must be valid uniform type identifiers (UTIs), containing letters, numbers, hyphens, underscores or periods. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps. 

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample website](sample-website.html) | Lists all available mobile website sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
[screenbuilder](../../screenbuilder/screenbuilder.html) | Shows all commands for project development with Screen Builder.
[add-dataprovider](add-dataprovider.html) | Connects your project to a data provider.
[add-field](add-field.html) | Inserts an input field in an existing form.
[add-form](add-form.html) | Inserts a generic input form in an existing application view.
[add-list](add-list.html) | Inserts a list in an existing application view.
[add-signin](add-signin.html) | Inserts a sign-in form in an existing application view.
[add-signup](add-signup.html) | Inserts a sign-up form in an existing application view.
[add-view](add-view.html) | Adds a new application view to your project.
<% } %>