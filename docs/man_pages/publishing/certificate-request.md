certificate-request
==========

Usage | Synopsis
------|-------
List certificate requests | `$ appbuilder certificate-request`
Manage certificate requests | `$ appbuilder certificate-request [<Command>]`

Lists or lets you manage certificate signing requests (CSR).

### Attributes
`<Command>` extends the `certificate-request` command. You can set the following values for this attribute.
* `create` - Creates a certificate signing request (CSR) which you can upload in the iOS Dev Center.
* `remove` - Removes a pending certificate signing request (CSR) from the server.
* `download` - Downloads a pending certificate signing request (CSR) which you can upload in the iOS Dev Center.

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
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
[provision](provision.html) | Lists all configured provisioning profiles for code signing iOS applications with index and name.
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>