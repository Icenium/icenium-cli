certificate create-self-signed
==========

Usage | Synopsis
------|-------
General | `$ appbuilder certificate create-self-signed [<Name> [<Email> [<Country> [<Purpose> [<StartDate> [<EndDate>]]]]]]`

Creates a self-signed certificate for code signing Android applications. <% if(isHtml) { %>If you do not provide one or more command parameters, the AppBuilder CLI shows an interactive prompt to let you set
the remaining certificate details.

Depending on the certificate type, you can install your app for testing or you can publish it in Google Play.
If you want to publish your app in Google Play, verify that the certificate expires after October 22, 2033.<% } %>

### Attributes
* `<Purpose>` is the type of the certificate that you want to create. You can set the following purposes: `Generic` or `GooglePlay`.
* `<StartDate>` and `<EndDate>` set the validity of the certificate. You must set the start and end date in the following format: yyyy-mm-dd.

<% if(isConsole) { %>NOTE: If you want to publish your app in Google Play, verify that the value for `<End Date>` is greater than 2033-10-22.<% } %>
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
[certificate](certificate.html) | Lists all configured certificates for code signing iOS and Android applications with index and name.
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
