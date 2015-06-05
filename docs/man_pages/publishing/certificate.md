certificate
==========

Usage | Synopsis
------|-------
List certificates | `$ appbuilder certificate`    
Manage certificates | `$ appbuilder certificate [<Command>]`

Lists or lets you manage certificates for code signing iOS and Android applications. <% if(isHtml) { %>When building an app, you can set the certificate by index or name in the `--certificate` option.<% } %>  

### Attributes
`<Command>` extends the `certificate` command. You can set the following values for this attribute.
* `create-self-signed` - Creates a self-signed certificate for code signing Android applications.
* `remove` - Removes the selected certificate from the server.
* `export` - Exports the selected certificate from the server on your file system.
* `import` - Imports a certificate from your file system to the server.

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Lets you work with Telerik AppManager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project for Android and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project for iOS and uploads the application to Telerik AppManager.
[appmanager upload wp8](appmanager-upload-wp8.html) | Builds the project for Windows Phone and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publishes a new Telerik AppManager LiveSync update of your published application.
[appmanager groups](appmanager-groups.html) | Lists the distribution groups configured in your Telerik AppManager portal.
[appstore](appstore.html) | Lets you work with your iTunes Connect account.
[appstore list](appstore-list.html) | Lists all application records in iTunes Connect.
[appstore upload](appstore-upload.html) | Builds the project and uploads the application to iTunes Connect.
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