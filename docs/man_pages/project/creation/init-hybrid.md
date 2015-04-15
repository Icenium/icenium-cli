init hybrid
==========

Usage | Synopsis
------|-------
General | `$ appbuilder init hybrid [--appid <App ID>]`

Initializes an existing Apache Cordova project for development in the current directory. <% if(isHtml) { %>If the directory contains an existing AppBuilder project (created with the Telerik AppBuilder extension for Visual Studio or synchronized from GitHub), the project retains any existing project configuration. In this case, you might want to manually set new unique values for the WP8ProductID and WP8PublisherID properties to avoid issues when running your app on device.  
For more information about how to configure your project properties, see [appbuilder prop](../configuration/prop.html)<% } %> 

### Options
* `--appid` - Sets the application identifier for your app. 

### Attributes
* `<App ID>` must consist of at least three alphanumeric strings, separated by a dot (.). Each string must start with a letter. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps. If not specified, the application identifier is set to `com.telerik.<current directory name>`.
<% if(isHtml) { %>
This operation creates one or more of the following AppBuilder-specific files, if missing:
* .abproject
* .debug.abproject
* .release.abproject
* .abignore

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
[create](create.html) | Creates a project for hybrid or native development.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create website](create-website.html) | Creates a new project from a Mobile Website-based template.
[init](init.html) | Initializes an existing project for development.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[init website](init-website.html) | Initializes an existing Mobile Website project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>