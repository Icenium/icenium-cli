appmanager
==========

Usage | Synopsis
------|-------
General |`$ appbuilder appmanager <Command>`

You must run the appmanager command with a related command.

<% if(isMobileWebsite) { %>
This command is not applicable to Mobile Website projects.
<% } %>

`<Command>` is a related command that extends the appmanager command. You can run the following related commands:
* `upload` - Builds the project and uploads the binary to Telerik AppManager.
* `android` - `$ appbuilder appmanager upload android --certificate <Certificate ID>`
* `ios` - `$ appbuilder appmanager upload ios --certificate <Certificate ID> --provision <Provision ID>`
* `wp8` - `$ appbuilder appmanager upload wp8`
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
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