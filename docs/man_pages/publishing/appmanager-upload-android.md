appmanager upload android
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appmanager upload android [--certificate <Certificate ID>] [--download] [--publish] [--send-email] [--send-push] [--group [<Group ID>]]*`   

Builds the project for Android and uploads the application to Telerik AppManager. <% if(isHtml) { %>After the upload completes, you need to go to your app in [Telerik AppManager](https://platform.telerik.com/appmanager), manually configure it for distribution and publish it.<% } %> 
<% if(isConsole && isMobileWebsite) { %>
WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help appmanager upload android`
<% } %>
<% if((isConsole && (isNativeScript || isCordova)) || isHtml) { %>
### Options
* `--certificate` - Sets the certificate that you want to use for code signing your Android app. You can set a certificate by index or name. <% if(isHtml) { %>To list available certificates, run `$ appbuilder certificate`<% } %> 
* `--download` - If set, downloads the application package to the root of the project.
* `--publish` - If set, the application package will be automatically published and visible for the members of its distribution groups. To add distribution groups, use `--groups` option.
* `--send-email` - If set, an email with the link to the app will be send to all eligible users.
* `--send-push` - If set, push notifications will be send to all registered devices in the groups, assigned to the published app.
* `--group` - Sets the distribution groups of the application. You can set groups by index or name. <% if(isHtml) { %>To list available groups, run `$ appbuilder appmanager groups`<% } %>

### Attributes
* `<Certificate ID>` is the index or name of the certificate as listed by `$ appbuilder certificate`.
* `<Group ID>` is the index or name of the group as listed by `$ appbuilder appmanager groups`.
<% } %> 
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
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