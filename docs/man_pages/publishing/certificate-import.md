certificate import
==========

Usage | Synopsis
------|-------
General | `$ appbuilder certificate import <File Path> [<Password>]`

Imports an existing certificate from a P12 or a CER file stored on your local file system. <% if(isHtml) { %>If you do not provide the certificate password when running the command, the Telerik AppBuilder CLI prompts you to provide it.<% } %>

### Attributes
* `<File Path>` must be complete with file name and extension.
* `<Password>` is the password for the certificate.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publish a new update of your application in Telerik AppManager.
[appmanager groups](appmanager-groups.html) | Lists the distribution groups configured in your Telerik AppManager portal.
[appstore](appstore.html) | Lets you work with your iTunes Connect account.
[appstore list](appstore-list.html) | Lists all application records in iTunes Connect.
[appstore upload](appstore-upload.html) | Builds the project and uploads the application to iTunes Connect.
[certificate](certificate.html) | Lists all configured certificates for code signing iOS and Android applications with index and name.
[certificate create-self-signed](certificate-create-self-signed.html) | Creates a self-signed certificate for code signing Android applications.
[certificate export](certificate-export.html) | Exports a selected certificate from the server as a P12 file.
[certificate remove](certificate-remove.html) | Removes a selected certificate from the server.
[certificate-request create](certificate-request-create.html) | Creates a certificate signing request.
[certificate-request download](certificate-request-download.html) | Downloads a pending certificate signing request.
[certificate-request remove](certificate-request-remove.html) | Removes a pending certificate signing request.
[certificate-request](certificate-request.html) | Lists all pending certificate signing requests.
[provision](provision.html) | Lists all configured provisioning profiles for code signing iOS applications with index and name.
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>