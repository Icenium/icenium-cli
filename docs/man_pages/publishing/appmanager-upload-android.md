appmanager upload android
==========

Usage | Synopsis
------|-------
Upload your app without publishing | `$ appbuilder appmanager upload android [--certificate <Certificate ID>] [--download]`
Upload and publish your app | `$ appbuilder appmanager upload android [--certificate <Certificate ID>] [--download] --publish [--public] [--send-email] [--send-push] [--group <Group ID> [--group <Group ID>]*]`   

Builds the project for Android and uploads the application to Telerik AppManager. <% if(isHtml) { %>If you have not set the `--publish` switch, after the upload completes, you need to go to your app in [Telerik AppManager](https://platform.telerik.com/appmanager), manually configure it for distribution and publish it.<% } %> 
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--certificate` - Sets the certificate that you want to use for code signing your Android app. You can set a certificate by index or name. <% if(isHtml) { %>To list available certificates, run `$ appbuilder certificate`<% } %> 
* `--download` - If set, downloads the application package and its decrypted `AndroidManifest.xml` to the root of the project.
* `--publish` - If set, after the upload completes, automatically publishes the application package for the members of its distribution groups. You can set additional distribution groups with the `--groups` option.
* `--public` - If set, the published application will be available for download without requiring AppManager user credentials.
* `--send-email` - If set, after publishing your app, Telerik AppManager sends an email with the link to the app to the distribution groups, assigned to the published app.<% if(isHtml) { %> This option is applicable only when the `--publish` switch is set.<% } %> 
* `--send-push` - If set, after publishing your app, Telerik AppManager sends a push notification that a new version is available to all registered devices in the distribution groups, assigned to the published app.<% if(isHtml) { %> This option is applicable only when the `--publish` switch is set.<% } %>
* `--group` - Assigns additional distribution groups for the application. You can set multiple groups by specifying the `--group` option multiple times. You can set a group by index or name. <% if(isHtml) { %>To list the available groups, run `$ appbuilder appmanager groups`<br/>This option is applicable only when the `--publish` switch is set.<% } %>

### Attributes
* `<Certificate ID>` is the index or name of the certificate as listed by `$ appbuilder certificate`.
* `<Group ID>` is the index or name of the group as listed by `$ appbuilder appmanager groups`.
<% } %> 
<% if(isHtml) { %> 
### Command Limitations

* The `--send-email`, `--send-push` and `--group` options are applicable only when the `--publish` switch is set.

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Lets you work with Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload wp8](appmanager-upload-wp8.html) | Builds the project for Windows Phone and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publish a new update of your application in Telerik AppManager.
[appmanager groups](appmanager-groups.html) | Lists the distribution groups configured in your Telerik AppManager portal.
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
[provision](provision.html) | Lists all configured provisioning profiles for code signing iOS applications with index and name.
[provision import](provision-import.html) | Imports the provisioning profile stored in the selected file.
[provision remove](provision-remove.html) | Removes the selected provisioning profile.
<% } %>
