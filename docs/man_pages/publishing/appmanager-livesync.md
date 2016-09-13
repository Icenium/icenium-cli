appmanager livesync
==========

Usage | Synopsis
------|-------
General | `$ appbuilder appmanager livesync [<Platforms>] [--mandatory]`

Publishes a new Telerik AppManager LiveSync update of your published application. <% if(isHtml) { %>If you have not enabled the AppManager LiveSync plugin for your project, it will be automatically enabled for the release build configuration. If you do not specify a platform, the AppBuilder CLI will prompt you to choose your target mobile platforms.

For more information about AppManager LiveSync, see [Update Your Published App with AppManager LiveSync](http://docs.telerik.com/platform/appbuilder/publishing-your-app/update-appmanager-livesync#cli).<% } %>

### Options
* `--mandatory` - If set, the app users will have to install the required update first in order to continue utilizing the app. Use this option to provide critical bug fixes to your published app.

### Attributes
`<Platforms>` is one or more target platforms, separated by a space, for which you want to create a AppManager LiveSync update. You can set the following target platforms.
* `android` - Publishes an update for your Android application.
* `ios` - Publishes an update for your iOS application.
<% if(isCordova) { %>* `wp8` - Publishes an update for your Windows Phone application.<% } %>

<% if(isHtml) { %>
### Prerequisites

* You must have a published version of your app, enabled for AppManager LiveSync, in AppManager, Google Play, Apple App Store or Windows Phone Store. To create a new version enabled for AppManager LiveSync, complete the following steps.
	1. Enable your project for AppManager LiveSync by running `$ appbuilder plugin add com.telerik.LivePatch --release` for Apache Cordova apps or `$ appbuilder plugin add nativescript-plugin-livepatch --release` for NativeScript apps.
	1. Publish your app to [AppManager](http://docs.telerik.com/platform/appbuilder/publishing-your-app/publish-appmanager#cli), [Google Play](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-android#cli), [Apple App Store](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-ios#cli) or [Windows Phone Store](http://docs.telerik.com/platform/appbuilder/publishing-your-app/distribute-production/publish-wp8#cli).
* If you are developing a hybrid app, it must target Apache Cordova 3.7.0 or later. To check the target Apache Cordova version of your project, run `$ appbuilder mobileframework`

### Related Commands

Command | Description
----------|----------
[appmanager upload](appmanager.html) | Lets you work with Telerik AppManager.
[appmanager upload android](appmanager-upload-android.html) | Builds the project for Android and uploads the application to Telerik AppManager.
[appmanager upload ios](appmanager-upload-ios.html) | Builds the project for iOS and uploads the application to Telerik AppManager.
[appmanager upload wp8](appmanager-upload-wp8.html) | Builds the project for Windows Phone and uploads the application to Telerik AppManager.
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
