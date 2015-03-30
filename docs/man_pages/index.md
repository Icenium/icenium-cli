#AppBuilder

Usage | Synopsis
------|-------
General | `$ appbuilder <Command> [Parameters] [--options <Values>]`


## General Commands
Command | Description
-------|----------
[help <Command>](general/help.html)                  |Shows additional information about the commands in this list.
[login](general/login.html)                           |Logs you in the Telerik Platform.
[logout](general/logout.html)                          |Logs you out from the Telerik Platform.
[user](general/user.html)                            |Prints information about the currently logged in user.
[feature-usage-tracking](general/feature-usage-tracking.html)          |Configures anonymous feature usage tracking.

## Project Development Commands
Command | Description
-------|----------
[create](project/creation/create.html)                          |Creates a new project from template.
[sample](project/creation/sample.html)                          |Lists sample apps.
[sample&nbsp;clone](project/creation/sample-clone.html)                    |Clones a selected sample app.
[init](project/creation/init.html)                            |Initializes an existing project for development.
[cloud](project/creation/cloud.html)                           |Lists all projects associated with your Telerik Platform account.
[cloud&nbsp;export](project/creation/cloud-export.html)                    |Exports a selected project from the cloud and initializes it for development.
[build](project/testing/build.html)                           |Builds the project for a selected target platform and downloads the application package or produces a QR code for deploying the application package.
[deploy](project/testing/deploy.html)                          |Builds and deploys the project to a connected device.
[livesync](project/testing/livesync.html)                        |Synchronizes the latest changes in your project to connected devices.
[livesync&nbsp;cloud](project/testing/livesync-cloud.html)                  |Synchronizes the project with the cloud to enable LiveSync for remote devices.
[debug](project/testing/debug.html)                           |Shows the debug tools to let you debug applications on connected devices.
[simulate](project/testing/simulate.html)                        |Runs the current project in the device simulator.
[emulate](project/testing/emulate.html)                         |Runs the current project in the selected platform emulator.
[remote](project/testing/remote.html)                          |Starts a remote server to let you run your app in the iOS Simulator from a Windows system.
[edit-configuration](project/configuration/edit-configuration.html)              |Opens a configuration file for editing.
[prop&nbsp;print](project/configuration/prop-print.html)                      |Prints the current project configuration or the value for the selected project property.
[prop&nbsp;add](project/configuration/prop-add.html)                        |Enables more options for the selected project property, if the property accepts multiple values.
[prop&nbsp;set](project/configuration/prop-set.html)                        |Sets the selected project property and overwrites its current value.
[prop&nbsp;remove](project/configuration/prop-remove.html)                     |Disables options for the selected project property, if the property accepts multiple values.
[mobileframework](project/configuration/mobileframework.html)                 |Lists all supported versions of the mobile framework.
[mobileframework&nbsp;set](project/configuration/mobileframework-set.html)             |Sets the selected framework version for the project and updates the plugins according to the new version.
[update-kendoui](lib-management/update-kendoui.html)                  |Updates or adds Kendo UI Core or Kendo UI Professional to your project.

## Plugin Management Commands
Command | Description
-------|----------
[plugin](lib-management/plugin.html)                          |Lists all core, integrated and verified plugins that are currently enabled for your project.
[plugin&nbsp;add](lib-management/plugin-add.html)                      |Enables a core, integrated or verified plugin for your project.
[plugin&nbsp;configure](lib-management/plugin-configure.html)                |Configures plugin variables for the selected core, integrated or verified plugin.
[plugin&nbsp;remove](lib-management/plugin-remove.html)                   |Disables a core, integrated or verified plugin for your project.
[plugin&nbsp;find](lib-management/plugin-find.html)                     |Searches for plugins in the Apache Cordova Plugin Registry by keyword.
[plugin&nbsp;fetch](lib-management/plugin-fetch.html)                    |Imports an Apache Cordova plugin into your project.

## Device Commands
Command | Description
-------|----------
[device](device/device.html)                          |Lists all recognized connected devices.
[device&nbsp;log](device/device-log.html)                      |Opens the log stream for the selected device.
[device&nbsp;list-applications](device/device-list-application.html)        |Lists the installed applications on all connected devices.
[device&nbsp;run](device/device-run.html)                      |Runs the selected already installed application on a connected device.

## Certificate Management and Publishing Commands
Command | Description
-------|----------
[certificate-request](publishing/certificate-request.html)             |Lists all pending certificate signing requests (CSR).
[certificate-request&nbsp;create](publishing/certificate-request-create.html)      |Creates a certificate signing request (CSR) which you can upload in the iOS Dev Center.
[certificate-request&nbsp;remove](publishing/certificate-request-remove.html)      |Removes a pending certificate signing request (CSR).
[certificate-request&nbsp;download](publishing/certificate-request-download.html)    |Downloads a pending certificate signing request (CSR) which you can upload in the iOS Dev Center.
[certificate](publishing/certificate.html)                     |Lists all configured certificates for code signing iOS and Android applications.
[certificate&nbsp;create-self-signed](publishing/certificate-create-self-signed.html)  |Creates self-signed certificate for code signing Android applications.
[certificate&nbsp;remove](publishing/certificate-remove.html)              |Removes the selected certificate from the server.
[certificate&nbsp;export](publishing/certificate-export.html)              |Exports the selected certificate from the server on your file system.
[certificate&nbsp;import](publishing/certificate-import.html)              |Imports a P12 or a CER file from your file system to the server.
[provision](publishing/provision.html)                       |Lists all configured provisioning profiles for code signing iOS applications.
[provision&nbsp;import](publishing/provision-import.html)                |Imports a provisioning profile from file.
[provision&nbsp;remove](publishing/provision-remove.html)                |Removes a registered provisioning profile.
[appstore&nbsp;list](publishing/appstore-list.html)                   |Lists all applications in iTunes Connect.
[appstore&nbsp;upload](publishing/appstore-upload.html)                 |Builds the project and uploads the binary to iTunes Connect.
[appmanager&nbsp;upload](publishing/appmanager-upload.html)               |Builds the project and uploads the binary to Telerik AppManager.

## Global Options
Option | Description
-------|---------
--help,&nbsp;-h,&nbsp;/?        |Prints help about the selected command.
--path <Directory>    |Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
--version             |Prints the client version.
--log&nbsp;trace           |Prints a detailed diagnostic log for the execution of the current command.
