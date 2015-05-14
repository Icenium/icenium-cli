appmanager groups
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appmanager groups`

Lists all available user groups from Telerik AppManager. <% if(isHtml) { %>If you have not managed distribution groups from [Telerik AppManager](https://platform.telerik.com/appmanager), a single 'Default Group' should be provided.

For more information about AppManager distribution groups, see [Adding AppManager Distribution Groups](http://docs.telerik.com/platform/appmanager/appmanager-portal/managing-groups/adding-distribution-group).<% } %>

<% if(isConsole) { %>
<% if(isMobileWebsite) { %>WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help appmanager groups`<% } %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help appmanager groups` <% } %> 
<% } %>
<% if(isHtml) { %> 

### Command Limitations

* You cannot run this command on mobile website projects.
* You cannot run this command on NativeScript projects.

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager livesync](appmanager-livesync.html) | Publish a new update of your application in Telerik AppManager.
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