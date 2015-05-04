create
==========

Usage | Synopsis
------|-------
Create hybrid | `$ appbuilder create hybrid <App name>`
Create native | `$ appbuilder create native <App name>`
Create website | `$ appbuilder create website <Site name>`
Create with Screen Builder | `$ appbuilder create screenbuilder <App Name>` OR `$ appbuilder create <App Name>`

Creates a project for hybrid, native or mobile website development. If `screenbuilder` and `<Type>` are not specified, creates a new project for hybrid development with Screen Builder.

### Attributes
* `screenbuilder` - Creates a new project for hybrid development with Screen Builder. You can later run the Screen Builder commands for project development on this project.
* `<Type>` extends the `create` command. You can set the following values for this attribute. 
	* `hybrid` - Creates a new project from an **Apache Cordova** template.
	* `native` - Creates a new project from a **NativeScript** template.
	* `website` - Creates a new project from a **Mobile Website** template.
* `<App name>` is the name of the application. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).
* `<Site name>` is the name of the mobile website. The maximum length is 30 characters. You can use only the following characters: A-Z, a-z, 0-9, underscore (_), dot (.), hyphen (-) and space ( ).

<% if(isHtml) { %>
### Prerequisites

* Verify that you have installed git on your system.

### Related Commands

Command | Description
----------|----------
[cloud](cloud.html) | Lists all projects associated with your Telerik Platform account.
[cloud export](cloud-export.html) | Exports one of your projects from the cloud and initializes it for development in the current directory.
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