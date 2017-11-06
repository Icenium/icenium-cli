init native
==========

Usage | Synopsis
------|-------
General | `$ appbuilder init native [--appid <App ID>]`

Initializes an existing NativeScript project for development in the current directory. <% if(isHtml) { %>If the directory contains an existing AppBuilder project (created with the Telerik AppBuilder extension for Visual Studio or synchronized from GitHub), the project retains any existing project configuration.<% } %>

### Options
* `--appid` - Sets the application identifier for your app.

### Attributes
* `<App ID>` must consist of one or more alphanumeric strings, separated by a dot. The strings must be valid uniform type identifiers (UTIs), containing letters, numbers, hyphens, underscores or periods. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps. If not specified, the application identifier is set to `com.telerik.<current directory name>`.

<% if(isHtml) { %>
This operation creates one or more of the following AppBuilder-specific files, if missing:
* .abproject
* .abignore

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[export](export.html) | Exports a cloud-based project from a selected solution to facilitate the migration to a different framework.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>
