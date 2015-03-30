appstore upload
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appstore upload <Application Name> [<AppleID>] [<Password>] --certificate <Certificate ID> --provision <Provision ID>`

Builds the project and uploads the application to iTunes Connect.

`<Application Name>` is the name for the application record that you want to upload for publishing. To retrieve the names of your        application records available in iTunes Connect, run `$ appbuilder appstore list`
`<AppleID>` and `<Password>` are your credentials for logging into iTunes Connect. If you do not provide them when running the command, the Telerik AppBuilder CLI will prompt you to provide them.
`<Certificate ID>` is the index or name of the certificate as listed by `$ appbuilder certificate`
`<Provision ID>` is the index or name of the provisioning profile as listed by `$ appbuilder provision`
<% if(isNativeScript) { %>
This command is not applicable to NativeScript projects.
<% } %>

Options:
* `--certificate` - Sets the certificate that you want to use for code signing your iOS app. You can set a certificate by index or name. You must specify a production certificate. The certificate must match the provisioning profile. To list available certificates, run `$ appbuilder certificate`
* `--provision` - Sets the provisioning profile that you want to use for code signing your iOS app. You can set a provisioning profile by index or name. You must specify a provisioning profile for App Store distribution. The provisioning profile must match the certificate.       To list available provisioning profiles, run $ appbuilder provision.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[appmanager](appmanager.html) | Allows interaction with appmanager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appstore](appstore.html) | Allows interaction with iTunes Connect.
[appstore list](appstore-list.html) | Lists all application records in iTunes Connect.
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