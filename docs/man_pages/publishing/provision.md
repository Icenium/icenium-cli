provision
==========

Usage | Synopsis
------|-------
List provisioning profiles | `$ appbuilder provision [<Provision ID> -v]`
Manage provisioning profiles | `$ appbuilder provision [<Command>] `

Lists or lets you manage provisioning profiles for code signing iOS applications. <% if(isHtml) { %>When building an app, you can set the provisioning profile by index or name in the `--provision` option.<% } %> 

### Options
* `-v`, `--verbose` - Lists the devices included in the selected provisioning profile.

### Attributes
* `<Provision ID>` is the index or identifier of the provisioning profile as listed by `$ appbuilder provision`
* `<Command>` extends the `provision` command. You can set the following values for this attribute.
	* `import` - Imports a provisioning profile from file.
	* `remove` - Removes a registered provisioning profile.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Lets you work with Telerik AppManager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project for Android and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project for iOS and uploads the application to Telerik AppManager.
[appmanager upload wp8](appmanager-upload-wp8.html) | Builds the project for Windows Phone and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publishes a new Telerik AppManager LiveSync update of your published application.
[appmanager groups](appmanager-groups.html) | Lists all available user groups from Telerik AppManager.
[appstore](appstore.html) | Lets you work with your iTunes Connect account.
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
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>