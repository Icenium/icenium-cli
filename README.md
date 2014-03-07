Cross-Platform Command-Line Interface for Telerik AppBuilder
===========

*Build and publish iOS and Android hybrid apps using a single pure HTML5, CSS, and JavaScript code base*

[![Telerik AppBuilder](ab-logo.png "Telerik AppBuilder")](http://www.telerik.com/appbuilder "The Telerik AppBuilder web site")

**Leverage the cloud capabilities of the Telerik Platform and Telerik AppBuilder from the command line**

The Telerik AppBuilder CLI lets you build, test, deploy, and publish hybrid mobile apps for iOS and Android from your favorite IDE or code editor. You can develop your projects locally from the convenience of your favorite code editor and run the command-line to test, build, deploy in the simulator or on devices, and publish your applications to App Store or Google Play.

* [Installation](#install "How to install the Telerik AppBuilder CLI")
* [Quick Start](#quick-start "Get started with the Telerik AppBuilder CLI")
* [Features](#features "What are the features of the Telerik AppBuilder CLI")
* [How to Contribute](#contribute "How to contribute to the Telerik AppBuilder CLI")
* [More Telerik AppBuilder Tools and Resources](#more-appbuilder "Get the other Telerik AppBuilder clients and tools")
* [License](#license "Licensing information about the Telerik AppBuilder CLI")

<a id="install"></a>
Installation
===

Latest version: Telerik AppBuilder 2.0  
Build number: 2014.1.313.1  
Release date: 2014, March 13  
Release notes: <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-0" target="_blank">Telerik AppBuilder 2.0 Release Notes</a>

### System Requirements

Before installing the Telerik AppBuilder CLI, verify that your system meets the following requirements.

*Minimum Software Requirements*

* Windows or OS X Mavericks
* Node.js 0.10.x (32-bit or 64-bit)

*Additional Software Requirements for iOS Deployment*

* Node.js 0.10.x 32-bit
* iTunes

The bitness of Node.js and iTunes must match.

*Additional Software Requirements for Android Deployment*

* Any device drivers required by your system to recognize the connected Android device

### Install the Telerik AppBuilder CLI

In the command prompt, run the following command.

```bash
$ npm install appbuilder
```

[Back to Top][1]

<a id="quick-start"></a>
Quick Start
===

1. [Log In](#login "Log in the Telerik Platform")
1. [Create Project](#create "Create a local project")
1. [Run in Simulator](#simulator "Run in the device simulator")
1. [Run on Device](#device "Run on device")
1. [Modify Your Code](#code "Modify your code")
1. [Get Code Changes in the Simulator and on Device](#livesync "LiveSync changes from your code to your app in the simulator or on device")
1. [Get Help](#help "List the available commands and options")

<a id="login"></a>
**1. Log in the Telerik Platform**

To connect to your Telerik Platform account, run the following command.

```bash
$ appbuilder login
```

A new tab opens in your default browser. Provide your login credentials, confirm the sign in, verify that the following message is present in the command line: `Login completed`, and close the browser tab after the confirmation.

<a id="create"></a>
**2. Create project**

To create a new project from the default template, navigate to an empty directory and run the following command. The Telerik AppBuilder CLI creates a new project based on the Kendo UI Mobile template in the current directory.

```bash
$ appbuilder create MyApp
```

To initialize an existing project for development from the command line, navigate to the local directory that contains the project files and run the following command. The Telerik AppBuilder CLI creates the `.abproject` file required for working from the command-line. You can initialize any existing AppBuilder or third-party mobile project, if the project file structure mimics the AppBuilder project file structure. 

```bash
$ appbuilder init
```

<a id="simulator"></a>
**3. Run in simulator**

To load your newly created project in the simulator, run the following command.

```bash
appbuilder simulate
```

The Telerik AppBuilder CLI launches the device simulator. In the device simulator, you can change the target device form factor, mobile platform and version, and orientation. You can change the geolocation details, network connection configuration, file storage configuration, and the default contacts. You can debug your code using the built-in debug tools.

<a id="device"></a>
**4. Run on device**

To run your app on an Android device, install a QR code reader on the device, enable installing apps from unknown sources, and run the following command in the command line. After the operation completes, the Telerik AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment on Android devices. Scan the produced QR code on your device, install the app, and run it.

```bash
appbuilder build android
```

To run your app on an iOS device, install the Telerik AppBuilder companion app on the device, run it, and run the following command in the command line. After the operation completes, the Telerik AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the companion app. On the device, use the built-in QR code scanner in the companion app to scan the QR code and load the project. 

```bash
appbuilder build ios --companion
```

With the Telerik AppBuilder companion app, you can deploy and test your iOS apps without the need to provision them first. You can get the Telerik AppBuilder companion app from the <a href="https://itunes.apple.com/bg/app/telerik-appbuilder/id527547398?mt=8" target="_blank">App Store</a>. 

<a id="code"></a>
**5. Modify your code**

Edit your code in your preferred IDE or code editor. Save your changes.

<a id="livesync"></a>
**6. Get code changes in the simulator and on device**

In the running device simulator, your app refreshes automatically on save.

To get changes inside your running app, run the following command. On the device, in the running app, tap and hold with three fingers until the download pop-up appears. After the download completes, the app refreshes automatically.

```bash
appbuilder cloud-sync
```

<a id="help"></a>
**7. List the available commands**

To learn what are the available commands, run the following command.

```bash
appbuilder help
```

To learn more about a command, run the command with the `--help` option. For example, to show more information about `create`, run the following command.

```bash
appbuilder create --help
```

[Back to Top][1]

<a id="features"></a>
Features
===

Latest version: Telerik AppBuilder 2.0  
Build number: 2014.1.313.1  
Release date: 2014, March 13  
Release notes: <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-0" target="_blank">Telerik AppBuilder 2.0 Release Notes</a>

#### What you can do with this version of the Telerik AppBuilder CLI

* You can log in and log out of the Telerik Platform. You can view your current login information.
* You can create new projects from template.
* You can create new projects by cloning your existing projects from the cloud.
* You can create new projects by cloning the sample apps.
* You can build applications for iOS and Android and deploy them via QR code or cable connection. 
* You can build applications for distribution in Apple App Store and Google Play. You can upload your iOS application packages to iTunes Connect.
* You can load iOS applications in the AppBuilder companion app.
* You can LiveSync changes wirelessly and via cable connection.
* You can run your apps in the device simulator on Windows systems.
* You can debug your code with the built-in debug tools in the device simulator on Windows systems.
* You can fetch Apache Cordova custom plugins from the Apache Cordova Plugin Registry and import them into your projects.
* You can open the AndroidManifest.xml, Info.plist, and config.xml files for editing.
* You can configure the project properties for your project.
* You can view the device log for connected devices.
* You can manage certificates and provisioning profiles for code signing iOS apps.
* You can manage certificates for code signing Android apps.
* You can use the Telerik AppBuilder CLI with your preferred IDE or code editor.
* You can use the Telerik AppBuilder CLI with the Telerik AppBuilder package for Sublime Text 2 to build and deploy apps straight from Sublime Text 2.

#### What you cannot do with this version of the Telerik AppBuilder CLI

* You cannot build, test, deploy, or publish for Windows Phone 8.
* You cannot run and debug your apps in the device simulator on OS X systems.<br/>The device simulator will become available for OS X in the next release of Telerik AppBuilder.
* You cannot debug on device.

[Back to Top][1]

<a id="contribute" href="#contribute"></a>
Contribution
===

To learn how to log a bug that you just discovered, click [here](CONTRIBUTE#bug).

To learn how to suggest a new feature or improvement, click [here](CONTRIBUTE#request).

To learn how to contribute to the code base, click [here](CONTRIBUTE#contribute).

[Back to Top][1]

<a id="more-appbuilder"></a>
More Telerik AppBuilder Tools and Resources
===

* [Telerik AppBuilder Windows client](http://www.telerik.com/appbuilder/windows-client "The AppBuilder Windows Client"): Lightweight Windows IDE.
* [Telerik AppBuilder in-browser client](http://www.telerik.com/appbuilder/in-browser-client "The AppBuilder In-Browser Client"): Browser-based IDE that is compatible with most modern web and mobile browsers.
* [Telerik AppBuilder extension for Visual Studio](http://www.telerik.com/appbuilder/visual-studio-extension "The AppBuilder Extension for Visual Studio"): Extension for the popular Microsoft IDE.
* [Telerick AppBuilder package for Sublime Text 2](??? "The AppBuilder package for Sublime Text 2"): A package for the popular text editor.
* [Telerik AppBuilder companion app](http://www.telerik.com/appbuilder/companion-app "The AppBuilder Companion App"): iOS testing utility <a href="https://itunes.apple.com/bg/app/icenium-ion/id527547398" target="_blank">available for free on the App Store</a>.
* [Telerik AppBuilder documentation](http://docs.telerik.com/platform/appbuilder "The documentation resources for Telerik AppBuilder"): Learn more about what you can do with Telerik AppBuilder.
* [Telerik AppBuilder web page](http://www.telerik.com/appbuilder "The Telerik AppBuilder web page"): Visit the Telerik AppBuilder web site.

[Back to Top][1]

<a id="license" href="#license">License</a>
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #