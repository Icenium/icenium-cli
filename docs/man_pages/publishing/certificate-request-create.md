certificate-request create
==========

Usage | Syntax
------|-------
General | `$ appbuilder certificate-request create [<Name> [<Email> [<Country>]]] [--save-to <File Path>]`

Creates a certificate signing request (.csr) which you can upload in the iOS Dev Center.
If you do not provide values for `<Name>`, `<Email>` and `<Country>`, the Telerik AppBuilder CLI prompts you to complete the missing details.

Options:
* `--save-to` - If set, downloads the certificate request and saves it to the specified file path. The file path must be complete with file name and extension. If not specified, the certificate signing request is saved as certificate_request.csr.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[appmanager](appmanager.html) | Allows interaction with appmanager.
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
[certificate-request download](certificate-request-download.html) | Downloads a pending certificate signing request.
[certificate-request remove](certificate-request-remove.html) | Removes a pending certificate signing request.
[certificate-request](certificate-request.html) | Lists all pending certificate signing requests.
[provision](provision.html) | Lists all configured provisioning profiles for code signing iOS applications with index and name.
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>