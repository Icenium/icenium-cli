<h1 style="padding: 8px; background-color: #f1c40f; color: #34495e; font-weight: bold;">Progress will discontinue Telerik Platform on May 10th, 2018. <a id="qwdq" style="border: 1px solid #34495e; padding: 3px 8px; margin-left: 10px" href="https://www.telerik.com/platform-next-level">Learn more</a></h1><br/><br/><br/>


Command-Line Interface for Progress Telerik AppBuilder
===========

*Build and publish cross-platform hybrid or native apps using a single pure HTML5, CSS, and JavaScript code base*

[![AppBuilder](https://raw.github.com/Icenium/icenium-cli/release/ab-logo.png "AppBuilder")](http://www.telerik.com/appbuilder "The AppBuilder web site")

**Leverage the cloud capabilities of the Progress Telerik Platform and Progress Telerik Platform AppBuilder from the command line**

The AppBuilder CLI lets you build, test, deploy, and publish cross-platform hybrid and native mobile apps for iOS, Android and Windows Phone from your favorite IDE or code editor. You can develop your projects locally from the convenience of your preferred code editor and run the command-line to test, build, deploy in the simulator or on devices, and publish your applications to the App Store, Google Play or Windows Phone Store.

* [Installation](#installation "How to install the AppBuilder CLI")
	* [System Requirements](#system-requirements)
	* [Install the AppBuilder CLI](#install-the-telerik-appbuilder-cli)
	* [Configure Proxy Usage](#configure-proxy-usage)
* [Quick Start](#quick-start "Get started with the AppBuilder CLI")
* [Troubleshooting](#troubleshooting "Troubleshooting")
* [Features](#features "What are the features of the AppBuilder CLI")
* [How to Contribute](#contribution "How to contribute to the AppBuilder CLI")
* [More AppBuilder Tools and Resources](#more-telerik-appbuilder-tools-and-resources "Get the other AppBuilder clients and tools")
* [License](#license "Licensing information about the AppBuilder CLI")

Installation
===

Latest version: AppBuilder 3.7.8
<br/>Release date: Nov 30, 2017

> AppBuilder 3.7.8 is an update release. For a complete list of the improvements and updates available in this release, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v3-7-5" target="_blank">AppBuilder 3.7.8 Release Notes</a>.<br/>For a complete list of the improvements and updates available in the earlier major release, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v3-7" target="_blank">AppBuilder 3.7 Release Notes</a>.

### System Requirements

Before installing the AppBuilder CLI, verify that your system meets the following requirements.

#### Windows Systems

**Minimum Software Requirements**

* Windows 7 or later
* .NET 4.5 or later
* Node.js
	* (Windows 7 systems): Any of the following Node.js versions:
		* The latest stable official Node.js [4.2.1 or later 4.x](https://nodejs.org/dist/v4.2.1/)<br/>Node.js 4.x with npm 2 is required for development with Screen Builder.
		* The latest stable official Node.js [6.x](https://nodejs.org/dist/latest-v6.x/)
		* The latest stable official Node.js [7.x](https://nodejs.org/dist/latest-v7.x/)
	* (Windows 8 and later systems): Any of the following Node.js versions:
		* The latest stable official Node.js [4.2.1 or later 4.x](https://nodejs.org/dist/v4.2.1/)<br/>Node.js 4.x with npm 2 is required for development with Screen Builder.
		* The latest stable official Node.js [6.x](https://nodejs.org/dist/latest-v6.x/)
		* The latest stable official Node.js [7.x](https://nodejs.org/dist/latest-v7.x/)
* An Internet browser (latest official release) with enabled cookies
* (Optional) git<br/>git is required for development with Screen Builder.

> To be able to work with connected iOS devices from the command line, download and install the 32-bit Node.js.<br/>You can download and install the 32-bit Node.js from the <a href="http://nodejs.org/download/" target="_blank">Node.js web site</a>.

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)
* Node.js

> The bitness of Node.js and iTunes must match.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### macOS Systems

**Minimum Software Requirements**

* macOS Yosemite or later
* Any of the following Node.js versions:
	* The latest stable official Node.js [4.2.1 or later 4.x](https://nodejs.org/dist/v4.2.1/)<br/>Node.js 4.x with npm 2 is required for development with Screen Builder.
	* The latest stable official Node.js [6.x](https://nodejs.org/dist/latest-v6.x/)
	* The latest stable official Node.js [7.x](https://nodejs.org/dist/latest-v7.x/)
* An Internet browser (latest official release) with enabled cookies
* Mono 3.12 or later
* (Optional) git<br/>git is required for development with Screen Builder.

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)
* For testing in the native emulator
	* Xcode 5 or later

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### Linux Systems

**Minimum Software Requirements**

* Ubuntu 14.04 LTS<br/>The AppBuilder CLI is tested and verified to run on Ubuntu 14.04 LTS. You might be able to run the AppBuilder CLI on other Linux distributions.
* Any of the following Node.js versions:
	* The latest stable official Node.js [4.2.1 or later 4.x](https://nodejs.org/dist/v4.2.1/)<br/>Node.js 4.x with npm 2 is required for development with Screen Builder.
	* The latest stable official Node.js [6.x](https://nodejs.org/dist/latest-v6.x/)
	* The latest stable official Node.js [7.x](https://nodejs.org/dist/latest-v7.x/)

	You can follow the instructions provided [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) to install Node.js on your system.
* An Internet browser (latest official release) with enabled cookies
* (64-bit systems) The runtime libraries for the ia32/i386 architecture
   * In the terminal, run the following command.

      ```
      sudo apt-get install lib32z1 lib32ncurses5 lib32bz2-1.0 libstdc++6:i386
      ```
* (Optional) git<br/>git is required for development with Screen Builder.

**Additional Software Requirements for iOS On-Device Deployment**

> In this version of the AppBuilder CLI, you cannot deploy and LiveSync on connected iOS devices from the command line. You need to manually deploy the application package using iTunes.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* G++ compiler
   * In the terminal, run `sudo apt-get install g++`
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

### Install the AppBuilder CLI

The AppBuilder CLI is available for installing as an npm package.

In the command prompt, run the following command.

OS | Node.js installed from http://nodejs.org/ | Node.js installed via package manager
---|---------------------|----
Windows | `npm install appbuilder -g` | `npm install appbuilder -g`
macOS | `sudo npm install appbuilder -g --unsafe-perm` | `npm install appbuilder -g`
Linux | `sudo npm install appbuilder -g --unsafe-perm` | `npm install appbuilder -g`

To check if your system is configured properly, run the following command.

```bash
$ appbuilder doctor
```

[Back to Top][1]

### Configure Proxy Usage

If you are working with the AppBuilder CLI behind a web proxy, you might need to configure your proxy settings.

1. On your file system, locate the directory where the **appbuilder** npm package is installed.
1. In a text editor, open `config` &#8594; `config.json`.
1. Set `USE_PROXY` to `true`.
1. Set `PROXY_PORT`.
1. Set `PROXY_HOSTNAME`.

> Make sure to preserve the quotation marks and commas as in the initial `config.json` file.

[Back to Top][1]

Quick Start
===

1. [Log In](#login "Log in the Progress Telerik Platform")
1. [Create Project](#create "Create a local project")
1. [Run in Simulator](#simulator "Run in the device simulator")
1. [Run on Device](#device "Run on device")
1. [Modify Your Code](#code "Modify your code")
1. [Get Code Changes in the Simulator and on Device](#livesync "LiveSync changes from your code to your app in the simulator or on device")
1. [Modify the Application Package with .abignore](#modify-the-application-package)
1. [Get Help](#help "List the available commands and options")

<a name="login"><b>1. Log in the Progress Telerik Platform</b></a>

To connect to your Progress Telerik Platform account, run the following command.

```bash
$ appbuilder login
```

A new tab opens in your default browser. Provide your login credentials, confirm the sign in, verify that the following message is present in the command line: `Login completed`, and close the browser tab after the confirmation.

<a name="create"><b>2. Create project</b></a>

**Create new project from template**

To create a new project from the default template, navigate to an empty directory and run the following command.

```bash
$ appbuilder create <Type> MyApp
```

You can set hybrid or native for `<Type>`.

The AppBuilder CLI creates a new subdirectory MyApp in the current directory and places the project files inside it.

**Create new project from locally stored existing project**

To initialize an existing project for development from the command line, navigate to the local directory that contains the project files and run the following command.

```bash
$ appbuilder init
```

The AppBuilder CLI attempts to retain any existing project configuration and, if missing, creates any AppBuilder-specific files required for development.
If the directory contains an existing AppBuilder project, after the operation completes, you might want to manually set new unique values for the WP8ProductID and WP8PublisherID properties to avoid issues when running your app on device.

For more information about how to configure your project properties, run `appbuilder prop --help`.

**Create new project from an existing project in the cloud**

You can quickly get an existing project from the cloud by downloading it locally. Navigate to the directory in which you want to download your existing project and run the following command.

```bash
$ appbuilder cloud <Solution Name or Index> <Project Name or Index>
```

`<Solution Name or Index>` and `<Project Name or Index>` are the name or the index of the solution and project, respectively, as listed by `$ appbuilder cloud` or as they appear in the AppBuilder in-browser client or the AppBuilder Windows client.

This operation creates a new directory named after the project which contains all your project files. After you navigate to the newly created directory, you can continue development immediately with the AppBuilder CLI.

**Create new project from sample**

To create a new project from the AppBuilder sample apps from the command line, navigate to an empty directory and run the following command.

```bash
appbuilder sample clone <Sample>
```

To list the available sample apps, run `appbuilder sample`.

The AppBuilder CLI creates a new subdirectory in the current directory, clones the sample inside it and preserves the existing project configuration of the sample app.

**Create new project with Screen Builder**

Screen Builder lets you quickly create a new project for hybrid mobile development customized with navigation, home view and user interface skin.

```Shell
appbuilder create screenbuilder <My App>
```

The AppBuilder CLI creates a new subdirectory MyApp in the current directory and places the project files inside it. After you navigate to your Screen Builder-based project, you can run the Screen Builder commands to further customize your project by adding application views, connecting to data sources, creating user registration and sign-in and adding forms, lists and fields. For more information, run `$ appbuilder screenbuilder -h`

<a name="simulator"><b>3. Run in simulator</b></a>

> This operation is applicable only to hybrid projects.

To load your newly created project in the simulator, navigate to the folder containing your project files and run the following command.

```bash
$ appbuilder simulate
```

> In this version of the AppBuilder CLI, you cannot run the device simulator on Linux systems.

The AppBuilder CLI launches the device simulator. In the device simulator, you can change the target device form factor, mobile platform and version, and orientation. You can adjust the geolocation details, network connection configuration, file storage configuration, and the default contacts. You can debug your code using the built-in debug tools.

For more information about the AppBuilder device simulator, see <a href="http://docs.telerik.com/platform/appbuilder/testing-your-app/running-apps-in-simulator/device-simulator" target="_blank">Running Apps in the Device Simulator</a>.

<a name="device"><b>4. Run on device</b></a>

> This operation is applicable to hybrid and native projects.

To run your app on an Android device, install the Platform companion app, install the Cordova developer app for hybrid apps or the NativeScript developer app for native projects, navigate to the folder containing your project files and run the following command in the command line.

```bash
$ appbuilder build android --companion
```

After the operation completes, the AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the developer app. On the device, use the built-in QR code scanner in the Platform companion app to scan the QR code and load the project in the respective framework-specific developer app. To toggle the built-in QR code scanner, run the Platform companion app, complete the tutorial and tap **QR Scanner**.

With the developer app, you can deploy and test your Android apps without the need to configure any device drivers on your system, to configure your device for deployment, and to build an application package. You can get the Platform companion app from <a href="https://play.google.com/store/apps/details?id=com.telerik.PlatformCompanion" target="_blank">Google Play</a>. You can get the Cordova developer app from <a href="https://play.google.com/store/apps/details?id=com.telerik.AppBuilder" target="_blank">Google Play</a>. You can get the NativeScript developer app from <a href="https://play.google.com/store/apps/details?id=com.telerik.NativeScript" target="_blank">Google Play</a>.

To run your app on an iOS device, install the Platform companion app, install the Cordova developer app for hybrid apps or the NativeScript developer app for native projects, navigate to the folder containing your project files and run the following command in the command line.

```bash
$ appbuilder build ios --companion
```

After the operation completes, the AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the developer app. On the device, use the built-in QR code scanner in the Platform companion app to scan the QR code and load the project in the respective framework-specific developer app. To toggle the built-in QR code scanner, run the Platform companion app, complete the tutorial and tap **QR Scanner**.

With the developer app, you can deploy and test your iOS apps without the need to provision them first. You can get the Platform companion app from the <a href="https://itunes.apple.com/bg/app/platform-companion/id1083895251" target="_blank">App Store</a>. You can get the Cordova developer app from the <a href="https://itunes.apple.com/bg/app/telerik-appbuilder/id527547398?mt=8" target="_blank">App Store</a>. You can get the NativeScript developer app from <a href="https://itunes.apple.com/bg/app/nativescript/id882561588?mt=8" target="_blank">App Store</a>.

> For Windows Phone, you can develop only hybrid apps.

To run your app on a Windows Phone device, install the Cordova developer app on the device, navigate to the folder containing your project files and run the following command in the command line.

```bash
$ appbuilder build wp8 --companion
```

After the operation completes, the AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the developer app. On the device, use the built-in QR code scanner in the developer app to scan the QR code and load the project. To toggle the built-in QR code scanner, run the developer app, with two fingers, tap and swipe the left edge of the screen to the right and tap **QR Scanner**.

With the developer app, you can deploy and test your iOS apps without the need to provision them first. You can get the Cordova developer app from the <a href="http://www.windowsphone.com/en-us/store/app/appbuilder/0171d46b-b5f2-43d9-a36b-0a78c9692aab" target="_blank">Windows Phone Store</a>.

<a name="code"><b>5. Modify your code</b></a>

Edit your code in your preferred IDE or code editor. Save your changes.

> In Sublime Text 2 and Sublime Text 3, you can install the AppBuilder package which provides integration with the AppBuilder CLI. For more information, click <a href="https://sublime.wbond.net/packages/Telerik%20AppBuilder" target="_blank">here</a>.

<a name="livesync"><b>6. Get code changes in the simulator and on device</b></a>

> This operation is applicable only to hybrid and native projects.

In the running device simulator, your app refreshes automatically on save.

To get changes inside your running app, navigate to the folder containing your project files and run the following command.

```bash
$ appbuilder livesync cloud
```

On the device, in the running app, tap and hold with three fingers until the download pop-up appears. After the download completes, the app refreshes automatically.

<a name="modify-the-application-package"><b>8. Modify the application package with .abignore</b></a>

When you develop apps with the Progress Telerik AppBuilder Command-Line Interface (AppBuilder CLI), you can choose which files to exclude from your application package. To set exclude and include rules, you can modify the `.abignore` file in the root of your project.

Starting with AppBuilder 2.6, all newly created projects or cloned sample apps contain a default `.abignore`. To manage the exclude and include rules for projects created with earlier versions of AppBuilder, you need to manually add `.abignore` to your project.

For more information about creating and maintaining your `.abignore` file, see [this manual](ABIGNORE.md).

<a name="help"><b>7. List the available commands</b></a>

To list the available commands, run the following command.

```bash
$ appbuilder help
```

To learn more about a command, run the command with the `--help` option. For example, to show more information about `create`, run the following command.

```bash
$ appbuilder create --help
```

[Back to Top][1]

Troubleshooting
===

If the AppBuilder CLI does not behave as expected, you might be facing a configuration issue. For example, a missing `JAVA` path. To check if your system is configured properly for the AppBuilder CLI, run the following command.

```bash
$ appbuilder doctor
```

This command prints warnings about current configuration issues and provides basic information about how to resolve them.

If addressing the configuration issues does not resolve your problem, you can [report an issue](CONTRIBUTING.md#report-an-issue), [post in the forums](http://www.telerik.com/forums/appbuilder) or [request assistance](http://www.telerik.com/account/support-tickets/my-support-tickets.aspx) from the Telerik support team.

[Back to Top][1]

Features
===

Latest version: AppBuilder 3.7.8
<br/>Release date: Nov 30, 2017

> AppBuilder 3.7.8 is an update release. For a complete list of the improvements and updates available in this release, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v3-7-5" target="_blank">AppBuilder 3.7.8 Release Notes</a>.<br/>For a complete list of the improvements and updates available in the earlier major release, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v3-7" target="_blank">AppBuilder 3.7 Release Notes</a>.

#### What you can do with this version of the AppBuilder CLI

* You can develop, test, build and publish cross-platform hybrid mobile apps with Apache Cordova.
* You can develop, test, build and publish cross-platform native mobile apps with the NativeScript framework.

For a complete list of the features available in the AppBuilder CLI, click [here](http://docs.telerik.com/platform/appbuilder/development-tools/running-appbuilder/running-the-cli/appbuilder-cli).

To see a complete list of the available commands, click <a href="https://github.com/Icenium/icenium-cli/blob/release/docs/man_pages/index.md" target="_blank">here</a> or run `$ appbuilder help` in the command prompt.

[Back to Top][1]

Contribution
===

To learn how to log a bug that you just discovered, click [here](CONTRIBUTING.md#report-an-issue).

To learn how to suggest a new feature or improvement, click [here](CONTRIBUTING.md#request-a-feature).

To learn how to contribute to the code base, click [here](CONTRIBUTING.md#contribute-to-the-code-base).

[Back to Top][1]

More AppBuilder Tools and Resources
===

* [AppBuilder Windows client](http://www.telerik.com/appbuilder/windows-client "The AppBuilder Windows Client"): Lightweight Windows IDE.
* [AppBuilder in-browser client](http://www.telerik.com/appbuilder/in-browser-client "The AppBuilder In-Browser Client"): Browser-based IDE that is compatible with most modern web and mobile browsers.
* [AppBuilder extension for Visual Studio](http://www.telerik.com/appbuilder/visual-studio-extension "The AppBuilder Extension for Visual Studio"): Extension for the popular Microsoft IDE.
* [AppBuilder package for Sublime Text](http://www.telerik.com/appbuilder/sublime-text-package "The AppBuilder package for Sublime Text"): A package for the popular text editor.
* [AppBuilder companion apps](http://www.telerik.com/appbuilder/companion-app "The AppBuilder Companion App"): mobile testing utility <a href="https://itunes.apple.com/bg/app/icenium-ion/id527547398" target="_blank">available for free on the App Store</a>.
* [AppBuilder documentation](http://docs.telerik.com/platform/appbuilder "The documentation resources for AppBuilder"): Learn more about what you can do with AppBuilder.
* [AppBuilder web page](http://www.telerik.com/appbuilder "The AppBuilder web page"): Visit the AppBuilder web site.

[Back to Top][1]

License
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #command-line-interface-for-telerik-appbuilder
