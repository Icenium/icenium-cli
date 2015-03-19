sample clone
==========

Usage | Syntax
------|-------
General | `$ appbuilder sample clone <Clone ID> [--path <Directory>]`	

Clones the selected sample app from GitHub to your local file system. You can examine and modify the sample code,
run it in the simulator, and build and deploy it on your devices. To list all available sample apps with their clone commands, 
run `$ appbuilder sample`

The Telerik AppBuilder CLI clones the sample and preserves its existing project configuration.
If you want to develop for Windows Phone, make sure to manually set new unique values for the WP8ProductID and WP8PublisherID properties
to avoid issues when running your app on device. For more information about how to configure your project properties,
run `$ appbuilder prop --help`

`<Clone ID>` is the title of the sample app as listed by `$ appbuilder sample. If the title consists of two or more strings, `    separated by a space, you must replace the spaces with hyphens. For example, to clone the Pinch and zoom sample app, run `$ appbuilder sample clone pinch-and-zoom`.
Options: 
* `--path` - Specifies the directory where you want to clone the sample app, if different from the current directory. The directory must be empty. If not specified, the Telerik AppBuilder CLI attempts to clone the sample in the current directory.
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