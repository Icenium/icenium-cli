#AppBuilder

Usage | Syntax
------|-------
General | `$ appbuilder <command> [parameters] [--options <values>]`


## General commands:
Command | Description
-------|----------
    help <command>                  |Shows additional information about the commands in this list.
    login                           |Logs you in the Telerik Platform.
    logout                          |Logs you out from the Telerik Platform.
    user                            |Prints information about the currently logged in user.
    feature-usage-tracking          |Configures anonymous feature usage tracking.

## Project development commands:
Command | Description
-------|----------
    create                          |Creates a new project from template.
    sample                          |Lists sample apps.
    sample clone                    |Clones a selected sample app.
    init                            |Initializes an existing project for development.
    build                           |Builds the project for a selected target platform and downloads the application package
                                    |or produces a QR code for deploying the application package.
    deploy                          |Builds and deploys the project to a connected device.
    livesync                        |Synchronizes the latest changes in your project to connected devices.
    livesync cloud                  |Synchronizes the project with the cloud to enable LiveSync for remote devices.
    debug                           |Shows the debug tools to let you debug applications on connected devices.
    simulate                        |Runs the current project in the device simulator.
    emulate                         |Runs the current project in the selected platform emulator.
    remote                          |Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
    edit-configuration              |Opens a configuration file for editing.
    prop print                      |Prints the current project configuration or the value for the selected project property.
    prop add                        |Enables more options for the selected project property, if the property accepts multiple values.
    prop set                        |Sets the selected project property and overwrites its current value.
    prop remove                     |Disables options for the selected project property, if the property accepts multiple values.
    cloud                           |Lists all projects associated with your Telerik Platform account.
    cloud export                    |Exports a selected project from the cloud and initializes it for development.
    update-kendoui                  |Updates or adds Kendo UI Core or Kendo UI Professional to your project.
    mobileframework                 |Lists all supported versions of the mobile framework.
    mobileframework set             |Sets the selected framework version for the project and updates the plugins according to the new version.

## Plugin management commands:
Command | Description
-------|----------
    plugin                          |Lists all core, integrated and verified plugins that are currently enabled for your project.
    plugin add                      |Enables a core, integrated or verified plugin for your project.
    plugin configure                |Configures plugin variables for the selected core, integrated or verified plugin.
    plugin remove                   |Disables a core, integrated, or verified plugin for your project.
    plugin find                     |Searches for plugins in the Apache Cordova Plugin Registry by keyword.
    plugin fetch                    |Imports an Apache Cordova plugin into your project.

## Device commands:
Command | Description
-------|----------
    device                          |Lists all recognized connected devices.
    device log                      |Opens the log stream for the selected device.
    device run                      |Runs the selected application on a connected device.
    device list-applications        |Lists the installed applications on all connected devices.

## Certificate management and publishing commands:
Command | Description
-------|----------
    certificate-request             |Lists all pending certificate signing requests (.csr).
    certificate-request create      |Creates a certificate signing request (.csr) which you can upload in the iOS Dev Center.
    certificate-request remove      |Removes a pending certificate signing request (.csr).
    certificate-request download    |Downloads a pending certificate signing request (.csr) which you can upload in the iOS Dev Center.
    certificate                     |Lists all configured certificates for code signing iOS and Android applications.
    certificate create-self-signed  |Creates self-signed certificate for code signing Android applications.
    certificate remove              |Removes the selected certificate from the server.
    certificate export              |Exports the selected certificate from the server on your file system.
    certificate import              |Imports a P12 or a CER file from your file system to the server.
    provision                       |Lists all configured provisioning profiles for code signing iOS applications.
    provision import                |Imports a provisioning profile from file.
    provision remove                |Removes a registered provisioning profile.
    appstore list                   |Lists all applications in iTunes Connect.
    appstore upload                 |Builds the project and uploads the binary to iTunes Connect.
    appmanager upload               |Builds the project and uploads the binary to Telerik AppManager.

## Global Options:
Option | Description
-------|---------
    --help, -h, /?        |Prints help about the selected command.
    --path <Directory>    |Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
    --version             |Prints the client version.
    --log trace           |Prints a detailed diagnostic log for the execution of the current command.
