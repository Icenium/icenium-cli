appmanager upload
==========

Usage | Synopsis
------|-------
General |`$ appbuilder appmanager upload <Platform>`

Builds and uploads your application to AppManager. You must run the `appmanager upload` command with a command extension that specifies the target mobile platform.
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help appmanager upload`
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Attributes

`<Platform>` extends the `appmanager` command. You can set the following values for this attribute.
* `android` - Builds the project for Android and uploads the binary to Telerik AppManager.
* `ios` - Builds the project for iOS and uploads the binary to Telerik AppManager.
<% if(isCordova) { %>* `wp8` - Builds the project for Windows Phone and uploads the binary to Telerik AppManager.<% } %> 
<% } %> 
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publish a new update of your application in Telerik AppManager.
[appmanager groups](appmanager-groups.html) | Lists all available user groups from Telerik AppManager.
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