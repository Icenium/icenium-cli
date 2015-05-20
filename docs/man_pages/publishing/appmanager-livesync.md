appmanager livesync
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appmanager livesync [<Platforms>]`

Publishes a new Telerik AppManager LiveSync update of your published application. <% if(isHtml) { %>If you have not enabled the AppManager LiveSync plugin for your project, it will be automatically enabled for the release build configuration. If you do not specify a platform, the AppBuilder CLI will prompt you to choose your target mobile platforms.

For more information about AppManager LiveSync, see [Update Your Published App with AppManager LiveSync](http://docs.telerik.com/platform/appbuilder/publishing-your-app/update-appmanager-livesync#cli).<% } %>

<% if(isConsole) { %>
<% if(isMobileWebsite) { %>WARNING: This command is not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help appmanager livesync`<% } %>
<% if(isNativeScript) { %>WARNING: This command is not applicable to NativeScript projects. To view the complete help for this command, run `$ appbuilder help appmanager livesync` <% } %> 
<% } %>

<% if((isConsole && isCordova) || isHtml) { %>
### Attributes
`<Platforms>` is one or more target platforms, separated by a space, for which you want to create a Telerik AppManager LiveSync update. You can set the following target platforms.
* `android` - Publishes an update for your Android application.
* `ios` - Publishes an update for your iOS application.
* `wp8` - Publishes an update for your Windows Phone application.
<% } %>

<% if(isHtml) { %> 
### Prerequisites

* You must have a published version of your app, enabled for AppManager LiveSync, in Telerik AppManager, Google Play, Apple App Store or Windows Phone Store. To create a new version enabled for AppManager LiveSync, complete the following steps.
	1. Enable your project for AppManager LiveSync by running `$ appbuilder plugin add com.telerik.LivePatch --release`
	1. Publish your app to [Telerik AppManager](http://docs.telerik.com/platform/appbuilder/publishing-your-app/publish-appmanager#cli), [Google Play](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-android#cli), [Apple App Store](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-ios#cli) or [Windows Phone Store](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-wp8#cli).
* Your project must target Apache Cordova 3.5.0 or later. To check the target Apache Cordova version of your project, run `$ appbuilder mobileframework`

### Command Limitations

* You cannot run this command on mobile website projects.
* You cannot run this command on NativeScript projects.

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Allows interaction with appmanager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project and uploads the application to Telerik AppManager.
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