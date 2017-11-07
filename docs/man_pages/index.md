#AppBuilder

Usage | Synopsis
------|-------
General | `$ appbuilder <Command> [Parameters] [--options <Values>]`

## General Commands
Command | Description
-------|----------
[help `<Command>`](general/help.html) | Shows additional information about the commands in this list in the browser.
[login](general/login.html) | Logs you in the Progress Telerik Platform.
[logout](general/logout.html) | Logs you out from the Progress Telerik Platform.
[user](general/user.html) | Prints information about the currently logged in user.
[usage-reporting](general/usage-reporting.html) | Configures anonymous usage reporting.
[error-reporting](general/error-reporting.html) | Configures anonymous error reporting.
[autocomplete](general/autocomplete.html) | Manages your command-line completion settings.
[doctor](general/doctor.html) | Checks your system for configuration problems which might prevent the AppBuilder CLI from working properly.
[proxy](general/proxy.html) | Displays proxy settings.

## Project Development Commands
Command | Description
-------|----------
[create `<Type>`](project/creation/create.html) | Creates a new project from template.
[sample](project/creation/sample.html) | Lists sample apps.
[sample&nbsp;clone](project/creation/sample-clone.html) | Clones a selected sample app.
[export](project/creation/export.html) | Exports a cloud-based project from a selected solution to facilitate the migration to a different framework.
[init](project/creation/init.html) | Initializes an existing project for development.
[cloud](project/creation/cloud.html) | Lists all solutions and projects associated with your Progress Telerik Platform account.
[cloud&nbsp;export](project/creation/cloud-export.html) | Exports one or all projects from a selected solution from the cloud.
[build `<Platform>`](project/testing/build.html) | Builds the project for a selected target platform and downloads the application package or produces a QR code for deploying the application package.
[deploy `<Platform>`](project/testing/deploy.html) | Builds and deploys the project to a connected device.
[livesync&nbsp;cloud](project/testing/livesync-cloud.html) | Synchronizes the project with the cloud to enable LiveSync for remote devices.
[livesync&nbsp;`<Platform>`](project/testing/livesync.html) | Synchronizes the latest changes in your project to connected devices.
[debug `<Platform>`](project/testing/debug.html) | Shows the debug tools to let you debug applications on connected devices.
[simulate](project/testing/simulate.html) | Runs the current project in the device simulator.
[emulate `<Platform>`](project/testing/emulate.html) | Runs the current project in the selected platform emulator.
[remote](project/testing/remote.html) | Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[edit-configuration](project/configuration/edit-configuration.html) | Opens a configuration file for editing.
[prop&nbsp;print](project/configuration/prop-print.html) | Prints the current project configuration or the value for the selected project property.
[prop&nbsp;add](project/configuration/prop-add.html) | Enables more options for the selected project property, if the property accepts multiple values.
[prop&nbsp;set](project/configuration/prop-set.html) | Sets the selected project property and overwrites its current value.
[prop&nbsp;remove](project/configuration/prop-remove.html) | Disables options for the selected project property, if the property accepts multiple values.
[mobileframework](project/configuration/mobileframework.html) | Lists all supported versions of the current development framework.
[mobileframework&nbsp;set](project/configuration/mobileframework-set.html) | Sets the selected development framework version for the project.
[webview](project/configuration/webview.html) | Lists the available web views for iOS and Android.
[webview&nbsp;set](project/configuration/webview-set.html) | Sets the selected web view for the current project.
[kendoui](lib-management/kendoui.html) | Lists the available Kendo UI Core or Kendo UI Professional packages that you can add to your project.
[kendoui install](lib-management/kendoui-install.html) | Updates or adds Kendo UI Code or Kendo UI Professional to your project.
[kendoui notes](lib-management/kendoui-notes.html) | Shows release notes for the available Kendo UI Core and Kendo UI Professional packages.
[resource](lib-management/resource.html) | Lists information about the image resources for all mobile platforms.
[resource create](lib-management/resource-create.html) | Creates image resources for all mobile platforms from a single high-resolution image.

## Screen Builder Development Commands
<br>
<span style="color:red;font-size:15px"><%= "These commands are deprecated and will be removed in the next official release." %></span>
<br>

Command | Description
-------|----------
[create screenbuilder](project/creation/create.html) | Creates a new project for hybrid development with Screen Builder.
[screenbuilder](screenbuilder/screenbuilder.html) | Shows all commands for project development with Screen Builder.
[upgrade-screenbuilder](screenbuilder/upgrade-screenbuilder.html) | Upgrades a project to the latest Screen Builder version.
[add-view](screenbuilder/add-view.html) | Adds a new application view to your project.
[add-dataprovider](screenbuilder/add-dataprovider.html) | Connects your project to a data provider.
[add-authentication](screenbuilder/add-authentication.html) | Inserts sign-in and sign-up forms in an existing application view.
[add-about](screenbuilder/add-about.html) | Inserts a new about form in an existing application view.
[add-list](screenbuilder/add-list.html) | Inserts a new list in an existing application view.
[add-form](screenbuilder/add-form.html) | Inserts a new form in an existing application view.
[add-field](screenbuilder/add-field.html) | Inserts a new input field in an existing form.

## Apache Cordova Plugin and NativeScript Module Management Commands
Command | Description
-------|----------
[plugin](lib-management/plugin.html) | Lists all Apache Cordova plugins or custom npm or NativeScript modules that are currently enabled for your project.
[plugin add](lib-management/plugin-add.html) | Enables a Apache Cordova plugins or custom npm or NativeScript modules for your project.
[plugin configure](lib-management/plugin-configure.html) | Configures plugin variables for selected core, integrated or verified Apache Cordova plugins.
[plugin remove](lib-management/plugin-remove.html) | Disables Apache Cordova plugins or custom npm or NativeScript modules from your project.
[plugin find](lib-management/plugin-find.html) | Searches by one or more keywords for Apache Cordova plugins or custom npm or NativeScript modules.
[plugin fetch](lib-management/plugin-fetch.html) | Imports the selected Apache Cordova plugins or custom npm or NativeScript modules into your project.

## Device Commands
Command | Description
-------|----------
[device](device/device.html) | Lists all recognized connected devices.
[device&nbsp;log](device/device-log.html) |Opens the log stream for the selected device.
[device&nbsp;list-applications](device/device-list-application.html) | Lists the installed applications on all connected devices.
[device&nbsp;run](device/device-run.html) | Runs the selected already installed application on a connected device.

## Certificate Management and Publishing Commands
Command | Description
-------|----------
[certificate-request](publishing/certificate-request.html) | Lists all pending certificate signing requests (CSR).
[certificate-request&nbsp;create](publishing/certificate-request-create.html) | Creates a certificate signing request (CSR) which you can upload in the iOS Dev Center.
[certificate-request&nbsp;remove](publishing/certificate-request-remove.html) | Removes a pending certificate signing request (CSR).
[certificate-request&nbsp;download](publishing/certificate-request-download.html) | Downloads a pending certificate signing request (CSR) which you can upload in the iOS Dev Center.
[certificate](publishing/certificate.html) | Lists all configured certificates for code signing iOS and Android applications.
[certificate&nbsp;create-self-signed](publishing/certificate-create-self-signed.html) | Creates self-signed certificate for code signing Android applications.
[certificate&nbsp;remove](publishing/certificate-remove.html) | Removes the selected certificate from the server.
[certificate&nbsp;export](publishing/certificate-export.html) | Exports the selected certificate from the server on your file system.
[certificate&nbsp;import](publishing/certificate-import.html) | Imports a P12 or a CER file from your file system to the server.
[provision](publishing/provision.html) | Lists all configured provisioning profiles for code signing iOS applications.
[provision&nbsp;import](publishing/provision-import.html) | Imports a provisioning profile from file.
[provision&nbsp;remove](publishing/provision-remove.html) | Removes a registered provisioning profile.
[appstore&nbsp;list](publishing/appstore-list.html) | Lists all applications in iTunes Connect.
[appstore&nbsp;upload](publishing/appstore-upload.html) | Builds the project and uploads the binary to iTunes Connect.
[appmanager groups](publishing/appmanager-groups.html) | Lists the distribution groups configured in your Progress Telerik AppManager portal.
[appmanager&nbsp;upload&nbsp;`<Platform>`](publishing/appmanager-upload.html) | Builds the project and uploads the binary to Progress Telerik AppManager.
[appmanager&nbsp;livesync&nbsp;`<Platforms>`](publishing/appmanager-livesync.html) | Publishes a new Telerik AppManager LiveSync update of your published app.

## Global Options
Option | Description
-------|---------
--help,&nbsp;-h,&nbsp;/? | Prints help about the selected command in the console.
--path `<Directory>` | Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
--version | Prints the client version.
--log&nbsp;trace | Prints a detailed diagnostic log for the execution of the current command.
