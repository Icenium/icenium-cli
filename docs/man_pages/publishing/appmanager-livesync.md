appmanager livesync
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appmanager livesync [<Platforms>]`

Publish a new update of your application in AppManager. <% if(isHtml) { %>If you have not enabled the AppManager LiveSync plugin for your project, it will be automatically enabled for the release build configuration.<% } %>
In case you do not specify a platform, the patch will be published for all platforms (in case you confirm the prompt dialog).

<% if(isConsole && isMobileWebsite) { %>WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help appmanager livesync`<% } %>

<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes
`<Platforms>` is one or more target platforms, separated by a space, for which you want to publish an update in AppManager. You can set the following target platforms.
* `android` - Publishes an update for your Android application.
* `ios` - Publishes an update for your iOS application.
<% if(isCordova) { %>* `wp8` - Publishes an update for your Windows Phone application.<% } %>

If you do not set a target platform, the AppBuilder CLI publishes an update for all platforms. 
<% } %>

<% if(isHtml) { %> 

### Prerequisites

* You must have published a major version of your app, enabled for AppManager LiveSync. To create a new major version enabled for AppManager LiveSync, run `$ appbuilder appmanager upload <Platform>`

### Command Limitations

* You cannot run this command on mobile website projects.
* You cannot publish an update for Windows Phone for NativeScript projects.

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appstore](appstore.html) | Allows interaction with iTunes Connect.
[appstore list](appstore-list.html) | Lists all application records in iTunes Connect.
[appstore upload](appstore-upload.html) | Builds the project and uploads the application to iTunes Connect.
[certificate](certificate.html) | Lists all configured certificates for code signing iOS and Android applications with index and name.
[certificate create-self-signed](certificate-create-self-signed.html) | Creates a self-signed certificate for code signing Android applications.
[certificate export](certificate-export.html) | Exports a selected certificate from the server as a P12 file.
[certificate import](certificate-import.html) | Imports an existing certificate from a P12 or a CER file stored on your local file system.
[certificate remove](certificate-remove.html) | Removes a selected certificate from the server.
[certificate-request create](certificate-request-create.html) | Creates a certificate signing request.
[certificate-request download](certificate-request-download.html) | Downloads a pending certificate signing request.
[certificate-request remove](certificate-request-remove.html) | Removes a pending certificate signing request.
[certificate-request](certificate-request.html) | Lists all pending certificate signing requests.
[provision](provision.html) | Lists all configured provisioning profiles for code signing iOS applications with index and name.
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>