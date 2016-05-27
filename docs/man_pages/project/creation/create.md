create
==========

Usage | Synopsis
------|-------
Create hybrid | `$ appbuilder create hybrid <App name>`
Create native | `$ appbuilder create native <App name>`
Create with Screen Builder | `$ appbuilder create screenbuilder <App Name> [--answers <File Path>] [--no-simulator]` OR `$ appbuilder create <App Name> [--answers <File Path>] [--no-simulator]`

Creates a project for hybrid or native development. If `screenbuilder` and `<Type>` are not specified, creates a new project for hybrid development with Screen Builder.

### Options

* `--answers` - If set, the Telerik AppBuilder CLI looks for the specified `JSON` file and tries to pull the configuration data required by the command. If one or more required properties are not specified, the Telerik AppBuilder CLI will prompt you to provide the missing values. This option is applicable only to Screen Builder projects.
* `--no-simulator` - If set, the Telerik AppBuilder CLI does not launch the device simulator after the project is created successfully. This option is applicable only to Screen Builder projects.

### Attributes
* `<Type>` extends the `create` command. You can set the following values for this attribute.
	* `hybrid` - Creates a new project from an **Apache Cordova** template.
	* `native` - Creates a new project from a **NativeScript** template.
	* `screenbuilder` - Creates a new project for hybrid development with Screen Builder and launches the device simulator afterwards. You can later run the Screen Builder commands for project development on this project.
* `<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<File Path>` is the absolute or relative file path to a `JSON` file which contains configuration information about your project.<% if(isHtml) { %> The file must comply with the JSON specification described in detail [here](http://docs.telerik.com/platform/appbuilder/creating-your-project/screen-builder-automation#create).<% } %>

<% if(isHtml) { %>
### Prerequisites

* The `--answers` option is applicable only to Screen Builder projects.
* The `--no-simulator` option is applicable only to Screen Builder projects.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all solutions and projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[create hybrid](create-hybrid.html) | Creates a new project from an Apache Cordova-based template.
[create native](create-native.html) | Creates a new project from a NativeScript-based template.
[create screenbuilder](create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[init](init.html) | Initializes an existing project for development.
[init hybrid](init-hybrid.html) | Initializes an existing Apache Cordova project for development in the current directory.
[init native](init-native.html) | Initializes an existing NativeScript project for development in the current directory.
[sample](sample.html) | Lists all available sample apps with name, description, GitHub repository, and clone command.
[sample native](sample-native.html) | Lists all available NativeScript sample apps.
[sample hybrid](sample-hybrid.html) | Lists all available Apache Cordova sample apps.
[sample clone](sample-clone.html) | Clones the selected sample app from GitHub to your local file system.
<% } %>
