Command-Line Interface for Telerik AppBuilder
===========

*Build and publish iOS, Android and Windows Phone hybrid apps using a single pure HTML5, CSS, and JavaScript code base*

[![Telerik AppBuilder](https://raw.github.com/Icenium/icenium-cli/release/ab-logo.png "Telerik AppBuilder")](http://www.telerik.com/appbuilder "The Telerik AppBuilder web site")

**Leverage the cloud capabilities of the Telerik Platform and Telerik AppBuilder from the command line**

The Telerik AppBuilder CLI lets you build, test, deploy, and publish hybrid mobile apps for iOS, Android, and Windows Phone from your favorite IDE or code editor. You can develop your projects locally from the convenience of your favorite code editor and run the command-line to test, build, deploy in the simulator or on devices, and publish your applications to the App Store, Google Play or Windows Phone Store.

* [Installation](#installation "How to install the Telerik AppBuilder CLI")
* [Quick Start](#quick-start "Get started with the Telerik AppBuilder CLI")
* [Features](#features "What are the features of the Telerik AppBuilder CLI")
* [How to Contribute](#contribution "How to contribute to the Telerik AppBuilder CLI")
* [More Telerik AppBuilder Tools and Resources](#more-telerik-appbuilder-tools-and-resources "Get the other Telerik AppBuilder clients and tools")
* [License](#license "Licensing information about the Telerik AppBuilder CLI")

Installation
===

Latest version: Telerik AppBuilder 2.8.2  
Release date: 2015, February 26

> Telerik AppBuilder 2.8.2 is a maintenance release. For a complete list of the updates available in Telerik AppBuilder 2.8.2, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-8-2" target="_blank">Telerik AppBuilder 2.8.2 Release Notes</a>.<br/>For a complete list of the features available in the earlier major release Telerik AppBuilder 2.8, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-8" target="_blank">Telerik AppBuilder 2.8 Release Notes</a>.

### System Requirements

Before installing the Telerik AppBuilder CLI, verify that your system meets the following requirements.

#### Windows Systems

**Minimum Software Requirements**

* Windows 7 or later
* .NET 4.0 or later
* Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](http://docs.telerik.com/platform/appbuilder/troubleshooting/known-issues/known-issues-cli-and-sp#the-appbuilder-command-line-interface-and-appbuilder-package-for-sublime-text-27-have-introduced-the-following-known-issues) prevents the AppBuilder CLI from working properly with Node.js 0.10.34.
* An Internet browser (latest official release)

> To be able to work with connected iOS devices from the command line, download and install the 32-bit Node.js.<br/>You can download and install the 32-bit Node.js from the <a href="http://nodejs.org/download/" target="_blank">Node.js web site</a>.

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)
* Node.js

> The bitness of Node.js and iTunes must match.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the Telerik AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### OS X Systems

**Minimum Software Requirements**

* OS X Mavericks
* Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](http://docs.telerik.com/platform/appbuilder/troubleshooting/known-issues/known-issues-cli-and-sp#the-appbuilder-command-line-interface-and-appbuilder-package-for-sublime-text-27-have-introduced-the-following-known-issues) prevents the AppBuilder CLI from working properly with Node.js 0.10.34.
* An Internet browser (latest official release)

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the Telerik AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### Linux Systems

**Minimum Software Requirements** 

* Ubuntu 14.04 LTS<br/>The Telerik AppBuilder CLI is tested and verified to run on Ubuntu 14.04 LTS. You might be able to run the Telerik AppBuilder CLI on other Linux distributions.
* Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](http://docs.telerik.com/platform/appbuilder/troubleshooting/known-issues/known-issues-cli-and-sp#the-appbuilder-command-line-interface-and-appbuilder-package-for-sublime-text-27-have-introduced-the-following-known-issues) prevents the AppBuilder CLI from working properly with Node.js 0.10.34.

   > **IMPORTANT:** If you are using `sudo apt-get install` to install Node.js, make sure to install the `nodejs-legacy` package instead of `node`.

* An Internet browser (latest official release)
* (64-bit systems) The runtime libraries for the ia32/i386 architecture
   * In the terminal, run the following command.
      
      ```
      sudo apt-get install lib32z1 lib32ncurses5 lib32bz2-1.0 libstdc++6:i386
      ```

**Additional Software Requirements for iOS On-Device Deployment**

> In this version of the Telerik AppBuilder CLI, you cannot deploy and LiveSync on connected iOS devices from the command line. You need to manually deploy the application package using iTunes.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* G++ compiler
   * In the terminal, run `sudo apt-get install g++`

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the Telerik AppBuilder CLI, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

### Install the Telerik AppBuilder CLI

The Telerik AppBuilder CLI is available for installing as an npm package.

In the command prompt, run the following command.

OS | Node.js installed from http://nodejs.org/ | Node.js installed via package manager
---|---------------------|----
Windows | `npm install appbuilder -g` | `npm install appbuilder -g`
OS X | `sudo npm install appbuilder -g` | `npm install appbuilder -g`
Linux | `sudo npm install appbuilder -g` | `npm install appbuilder -g`

[Back to Top][1]

Quick Start
===

1. [Log In](#login "Log in the Telerik Platform")
1. [Create Project](#create "Create a local project")
1. [Run in Simulator](#simulator "Run in the device simulator")
1. [Run on Device](#device "Run on device")
1. [Modify Your Code](#code "Modify your code")
1. [Get Code Changes in the Simulator and on Device](#livesync "LiveSync changes from your code to your app in the simulator or on device")
1. [Modify the Application Package with .abignore](#modify-the-application-package)
1. [Get Help](#help "List the available commands and options")

<a name="login"><b>1. Log in the Telerik Platform</b></a>

To connect to your Telerik Platform account, run the following command.

```bash
$ appbuilder login
```

A new tab opens in your default browser. Provide your login credentials, confirm the sign in, verify that the following message is present in the command line: `Login completed`, and close the browser tab after the confirmation.

<a name="create"><b>2. Create project</b></a>

**Create new project from template**

To create a new hybrid project from the default template, navigate to an empty directory and run the following command. 

```bash
$ appbuilder create hybrid MyApp
```

The Telerik AppBuilder CLI creates a new subdirectory MyApp in the current directory and places the project files inside it. The project is based on the Kendo UI TabStrip template.

**Create new project from existing project**

To initialize an existing project for development from the command line, navigate to the local directory that contains the project files and run the following command. 

```bash
$ appbuilder init
```

The Telerik AppBuilder CLI attempts to retain any existing project configuration and, if missing, creates any AppBuilder-specific files required for development.
If the directory contains an existing AppBuilder project, after the operation completes, you might want to manually set new unique values for the WP8ProductID and WP8PublisherID properties to avoid issues when running your app on device. 

For more information about how to configure your project properties, run `appbuilder prop --help`.

**Create new project from sample**

To create a new project from the AppBuilder sample apps from the command line, navigate to an empty directory and run the following command.

```bash
appbuilder sample clone <Sample>
```

To list the available sample apps, run `appbuilder sample`.

The Telerik AppBuilder CLI creates a new subdirectory in the current directory, clones the sample inside it and preserves the existing project configuration of the sample app.

If you want to develop for Windows Phone, make sure to manually set new unique values for the WP8ProductID and WP8PublisherID properties to avoid issues when running your app on device. For more information about how to configure your project properties, run `appbuilder prop --help`.

<a name="simulator"><b>3. Run in simulator</b></a>

To load your newly created project in the simulator, navigate to the folder containing your project files and run the following command.

```bash
$ appbuilder simulate
```

> In this version of the Telerik AppBuilder CLI, you cannot run the device simulator on Linux systems.

The Telerik AppBuilder CLI launches the device simulator. In the device simulator, you can change the target device form factor, mobile platform and version, and orientation. You can adjust the geolocation details, network connection configuration, file storage configuration, and the default contacts. You can debug your code using the built-in debug tools.

For more information about the Telerik AppBuilder device simulator, see <a href="http://docs.telerik.com/platform/appbuilder/testing-your-app/running-apps-in-simulator/device-simulator" target="_blank">Running Apps in the Device Simulator</a>.

<a name="device"><b>4. Run on device</b></a>

To run your app on an Android device, install a QR code reader on the device, install the Telerik AppBuilder companion app, navigate to the folder containing your project files and run the following command in the command line. 

```bash
$ appbuilder build android --companion
```

After the operation completes, the Telerik AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the companion app. On the device, use the built-in QR code scanner in the companion app to scan the QR code and load the project. To toggle the built-in QR code scanner, run the companion app and complete the tutorial. With two fingers, tap and swipe the left edge of the screen to the right and tap **QR Scanner**.

With the Telerik AppBuilder companion app, you can deploy and test your Android apps without the need to configure any device drivers on your system, to configure your device for deployment, and to build an application package. You can get the Telerik AppBuilder companion app from <a href="https://play.google.com/store/apps/details?id=com.telerik.AppBuilder" target="_blank">Google Play</a>.

To run your app on an iOS device, install the Telerik AppBuilder companion app on the device, run it, and navigate to the folder containing your project files and run the following command in the command line. 

```bash
$ appbuilder build ios --companion
```

After the operation completes, the Telerik AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the companion app. On the device, use the built-in QR code scanner in the companion app to scan the QR code and load the project. To toggle the built-in QR code scanner, run the companion app and complete the tutorial. With two fingers, tap and swipe the left edge of the screen to the right and tap **QR Scanner**.

With the Telerik AppBuilder companion app, you can deploy and test your iOS apps without the need to provision them first. You can get the Telerik AppBuilder companion app from the <a href="https://itunes.apple.com/bg/app/telerik-appbuilder/id527547398?mt=8" target="_blank">App Store</a>. 

To run your app on a Windows Phone device, install a QR code reader on the device, navigate to the folder containing your project files and run the following command in the command line. 

```bash
$ appbuilder build wp8 --companion
```

After the operation completes, the Telerik AppBuilder CLI opens a new tab in your browser and shows a QR code for deployment in the companion app. On the device, use the built-in QR code scanner in the companion app to scan the QR code and load the project. To toggle the built-in QR code scanner, run the companion app, with two fingers, tap and swipe the left edge of the screen to the right and tap **QR Scanner**.

With the Telerik AppBuilder companion app, you can deploy and test your iOS apps without the need to provision them first. You can get the Telerik AppBuilder companion app from the <a href="http://www.windowsphone.com/en-us/store/app/appbuilder/0171d46b-b5f2-43d9-a36b-0a78c9692aab" target="_blank">Windows Phone Store</a>. 

<a name="code"><b>5. Modify your code</b></a>

Edit your code in your preferred IDE or code editor. Save your changes.

> In Sublime Text 2 and Sublime Text 3, you can install the Telerik AppBuilder package which provides integration with the Telerik AppBuilder CLI. For more information, click <a href="https://sublime.wbond.net/packages/Telerik%20AppBuilder" target="_blank">here</a>. 

<a name="livesync"><b>6. Get code changes in the simulator and on device</b></a>

In the running device simulator, your app refreshes automatically on save.

To get changes inside your running app, navigate to the folder containing your project files and run the following command. 

```bash
$ appbuilder livesync cloud
```

On the device, in the running app, tap and hold with three fingers until the download pop-up appears. After the download completes, the app refreshes automatically.

<a name="modify-the-application-package"><b>8. Modify the application package with .abignore</b></a>

When you develop apps with the Telerik AppBuilder Command-Line Interface (AppBuilder CLI), you can choose which files to exclude from your application package. To set exclude and include rules, you can modify the `.abignore` file in the root of your project.

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

Features
===

Latest version: Telerik AppBuilder 2.8.2  
Release date: 2015, February 26

> Telerik AppBuilder 2.8.2 is a maintenance release. For a complete list of the updates available in Telerik AppBuilder 2.8.2, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-8-2" target="_blank">Telerik AppBuilder 2.8.2 Release Notes</a>.<br/>For a complete list of the features available in the earlier major release Telerik AppBuilder 2.8, see <a href="http://docs.telerik.com/platform/appbuilder/release-notes/v2-8" target="_blank">Telerik AppBuilder 2.8 Release Notes</a>.

#### What you can do with this version of the Telerik AppBuilder CLI

To see a complete list of the available commands, click <a href="https://github.com/Icenium/icenium-cli/blob/release/resources/help.txt" target="_blank">here</a> or run `$ appbuilder help` in the command prompt.

Platform | Operation | Windows | OS&nbsp;X | Linux
---------|-----------|---------|------|------
**Cross-platform** | Develop hybrid mobile apps locally | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Develop hybrid mobile apps with third-party tools | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Develop hybrid mobile apps with Sublime Text | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Develop mobile websites | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Log in and out of the Telerik Platform | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | View login information | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Switch Telerik AppBuilder accounts | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Create projects from the project templates | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Initialize existing projects for development | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Clone the sample apps | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Export existing projects from your Telerik Platform account and initialize them for development | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Develop with Apache Cordova 3.0.0 or later | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Migrate between supported Apache Cordova versions | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Enable and disable the core Apache Cordova plugins | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Enable and disable the integrated Apache Cordova plugins | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Enable and disable the Telerik verified plugins | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Fetch custom Apache Cordova plugins from the Apache Cordova Plugin Registry | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Customize the Debug and Release build configurations | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Configure plugin variables from the command-line | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Run apps in the device simulator | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Debug apps in the device simulator | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Manage code signing identities | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Configure project properties | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Edit configuration files | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Edit `.abignore` to exclude files and folders from the build process<br/>(You might need to add `.abignore` to your projects manually.) | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Design user interfaces with the UI Designer tool | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
**iOS**  | Connect devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | List connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | View the device log for connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Build and deploy via QR code | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> 
         | Build and deploy manually | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Run in the companion app | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes wirelessly with the three-finger gesture | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Debug apps while running on connected device | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Run apps in the native iOS Simulator | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Build for distribution in the App Store | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Upload application packages to iTunes Connect | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and upload your app to Telerik AppManager | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
**Android** | Connect devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | List connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | View the device log for connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy via QR code | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy manually | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Run in the companion app | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes wirelessly with the three-finger gesture | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Debug apps while running on connected device | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Run apps in the native Android emulator | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Run apps in Genymotion | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build for distribution in Google Play | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and upload your app to Telerik AppManager | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
**Windows Phone** | Connect devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | List connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | View the device log for connected devices | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Build and deploy via QR code | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy manually | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and deploy via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Run in the companion app | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes wirelessly with the three-finger gesture | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | LiveSync changes via cable connection | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Debug apps while running on connected device | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Run apps in the native Windows Phone emulator | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/no-support.png" style="width: 16px;">
         | Build for distribution in the Windows Phone Store | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">
         | Build and upload your app to Telerik AppManager | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;"> | <img src="https://raw.github.com/Icenium/icenium-cli/release/support.png" style="width: 16px;">

The following Telerik AppBuilder features are not applicable to the Telerik AppBuilder CLI and will not become available in a future release.

* You cannot use the **Data Navigator** to review your Telerik Backend Services projects and their resources.
* You cannot use the Telerik AppBuilder version control and storage cloud services.

[Back to Top][1]

Contribution
===

To learn how to log a bug that you just discovered, click [here](CONTRIBUTING.md#report-an-issue).

To learn how to suggest a new feature or improvement, click [here](CONTRIBUTING.md#request-a-feature).

To learn how to contribute to the code base, click [here](CONTRIBUTING.md#contribute-to-the-code-base).

[Back to Top][1]

More Telerik AppBuilder Tools and Resources
===

* [Telerik AppBuilder Windows client](http://www.telerik.com/appbuilder/windows-client "The AppBuilder Windows Client"): Lightweight Windows IDE.
* [Telerik AppBuilder in-browser client](http://www.telerik.com/appbuilder/in-browser-client "The AppBuilder In-Browser Client"): Browser-based IDE that is compatible with most modern web and mobile browsers.
* [Telerik AppBuilder extension for Visual Studio](http://www.telerik.com/appbuilder/visual-studio-extension "The AppBuilder Extension for Visual Studio"): Extension for the popular Microsoft IDE.
* [Telerik AppBuilder package for Sublime Text](http://www.telerik.com/appbuilder/sublime-text-package "The AppBuilder package for Sublime Text"): A package for the popular text editor.
* [Telerik AppBuilder companion app](http://www.telerik.com/appbuilder/companion-app "The AppBuilder Companion App"): iOS testing utility <a href="https://itunes.apple.com/bg/app/icenium-ion/id527547398" target="_blank">available for free on the App Store</a>.
* [Telerik AppBuilder documentation](http://docs.telerik.com/platform/appbuilder "The documentation resources for Telerik AppBuilder"): Learn more about what you can do with Telerik AppBuilder.
* [Telerik AppBuilder web page](http://www.telerik.com/appbuilder "The Telerik AppBuilder web page"): Visit the Telerik AppBuilder web site.

[Back to Top][1]

License
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #command-line-interface-for-telerik-appbuilder
