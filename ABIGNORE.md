.abignore
=========

To set exclude and include rules, you can create and manage an `.abignore` file in the root of your project.

* [Overview](#overview)
* [Create .abignore](#create-abignore)
* [Adding rules and comments](#adding-rules-and-comments)
* [Sample .abignore](#sample-abignore)
* [Troubleshooting](#troubleshooting)

## Overview

When you develop apps with the Progress Telerik AppBuilder Command-Line Interface (AppBuilder CLI), you can choose which files to exclude from your application package. To set exclude and include rules, you can modify the `.abignore` file in the root of your project.

The AppBuilder CLI respects `.abignore` during the following operations.

* Build an application package.
* Build an application package for publishing.
* Build and deploy an application package on device.
* Build and deploy in the companion app from QR code.
* Build and deploy in the native emulators.
* LiveSync changes to remote devices.
* LiveSync changes to connected devices.

The AppBuilder CLI does not respect `.abignore` during the following operations.

* Build and deploy in the device simulator.

## Create .abignore

Starting with AppBuilder 2.6, all newly created projects or cloned sample apps contain a default `.abignore`. To manage the exclude and include rules for projects created with earlier versions of AppBuilder, you need to manually add `.abignore` to your project.

### Create non-configuration-specific .abignore

* If you are running the AppBuilder CLI on a Windows system, complete these steps to create `.abignore`.
   1. From the command prompt, navigate to the root of your project.
   1. Run the following command.

      ```Shell
      type nul > .abignore
      ```
* If you are running the AppBuilder CLI on an OS X or Linux system, complete these steps to create `.abignore`.
   1. From the command prompt, navigate to the root of your project.
   1. Run the following command.

      ```Shell
      touch .abignore
      ```

### Create configuration-specific .abignore

* If you are running the AppBuilder CLI on a Windows system, complete these steps to create `.abignore`.
   1. From the command prompt, navigate to the root of your project.
   1. To create an `.abignore` file which AppBuilder respects when you build for debugging, run the following command.

      ```Shell
      type nul > .debug.abignore
      ```
   1. To create an `.abignore` file which AppBuilder respects when you build for production, run the following command.

      ```Shell
      type nul > .release.abignore
      ```
* If you are running the AppBuilder CLI on an OS X or Linux system, complete these steps to create `.abignore`.
   1. From the command prompt, navigate to the root of your project.
   1. To create an `.abignore` file which AppBuilder respects when you build for debugging, run the following command.

      ```Shell
      touch .debug.abignore
      ```
   1. To create an `.abignore` file which AppBuilder respects when you build for production, run the following command.

      ```Shell
      touch .release.abignore
      ```

For more information about working with build configurations in the AppBuilder CLI, see [Managing Build Configurations](http://docs.telerik.com/platform/appbuilder/build-configurations/overview).

## Adding rules and comments

> When you edit `.abignore`, make sure that your exclude and include rules comply with the glob syntax and any syntax specifics of the minimatch matching library.<br/>For more information about glob syntax, see <a href="http://man7.org/linux/man-pages/man7/glob.7.html" target="_blank">Glob in the Linux Programmer's Manual</a>.<br/>For more information about minimatch syntax, see <a href="https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations" target="_blank">Comparisons to other fnmatch/glob implementations</a>.

When you create and modify your `.abignore` file, keep in mind the following specifics.

* Each rule must start on a new line.
* Empty lines are ignored.
* By default, all rules are exclude rules.
* Starting with [AppBuilder 2.6\*](#troubleshooting), newly created projects contain a default `.abignore` file. This file excludes the following files and subdirectories from your application package.
   * All `Thumbs.db` files: Thumbnails cache files managed by Windows.
   * All `.DS_Store` files: Hidden OS X system files.
   * All `__MACOSX` directories and their contents: Hidden OS X system directories.
   * The `bin` directory and its contents: A subdirectory in projects created with Visual Studio. It contains your latest built application packages.
   * The `obj` directory and its contents: A subdirectory in projects created with Visual Studio. It contains the archived project files that AppBuilder sends to the build server.
   * The `.vs` directory and its contents: A subdirectory in projects created with Visual Studio 2015. It contains information, related specifically to your project in Visual Studio.
   * `.gitignore`: A file that Git uses to determine which files and directories to ignore when you are making a commit.
   * The `.git` directory and its contents: A subdirectory in which Git stores your version control history and other relevant version control data.
   * `.abignore`: This file contains exclude and include rules for your application package.
   * The `.ab` directory and its contents: The AppBuilder CLI creates and manages this subdirectory. It contains temporary working files which the AppBuilder CLI uses.
   * `.app.json`: This file contains configuration information about projects created with Screen Builder.
   * Files associated with popular development environments.
* For projects created with AppBuilder 2.5.2 or earlier, you need to manually create `.abignore`. For such projects, by default, the AppBuilder CLI excludes the following files and subdirectories. You do not need to manually list these files in your `.abignore` file.
   * `.ab:` The AppBuilder CLI creates and manages this subdirectory. It contains temporary working files which the AppBuilder CLI uses.
   * `.abignore:` This file contains exclude and include rules for your application package.
   * `IPA, APK, and XAP:` The application packages for iOS, Android, and Windows Phone 8, respectively.
* To introduce a comment, place a hash (`#`) before the text.<br/>For example:

   ```
   # This file contains exclude and include rules for my application package.
   ```
* Each rule must be a glob that complies with the minimatch syntax.<br/>For example:

   ```
   # The following rule excludes all HTML files from the root.
   *.html

   # The following rule excludes all files whose names consist of six characters, starting with index, and that are located in the root.
   # For example: index1.html, index2.js, etc.
   index?.*
   ```

   For more information about glob syntax, see <a href="http://man7.org/linux/man-pages/man7/glob.7.html" target="_blank">Glob in the Linux Programmer's Manual</a>.<br/>For more information about minimatch syntax, see <a href="https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations" target="_blank">Comparisons to other fnmatch/glob implementations</a>.
* File paths must be relative to the location of `.abignore` and must be in the following format: `directory/subdirectory/file`.<br/>For example:

   ```
   # The following rule excludes the views directory, its subdirectories and their contents.
   views/**/*

   # The following rule excludes the build.js file located in the scripts subdirectory.
   scripts/build.js
   ```
* To include or exclude a build configuration-specific file, reference the configuration-specific file.<br/>For example:

   ```
   # The following rule excludes the main.debug.js file located in the scripts subdirectory.
   scripts/main.debug.js
   ```

   For more information about configuration-specific files in AppBuilder, see [Managing Configuration-Specific Files](http://docs.telerik.com/platform/appbuilder/build-configurations/configuration-specific-files).
* Preserve the casing of file paths to ensure that your `.abignore` file works across Windows, OS X, and Linux.
* To introduce an include rule, place an exclamation mark (`!`) before the rule.<br/>For example:

   ```
   # The following rule excludes all HTML files located in the root except for index.html.
   *.html
   !index.html
   ```
* To refer to files and subdirectories whose names contain an exclamation mark (`!`) or a hash (`#`), place a backslash (`\`) before the exclamation mark or the hash.<br/>For example:

   ```
   # The following rule excludes the !name.js file located in the root.
   \!name.js

   # The following rule includes the #cordova.js file located in the root.
   !\#cordova.js
   ```

## Sample .abignore

This is the markup of a sample `.abignore` file. This sample is based on the default `.abignore` file included in projects created with AppBuilder 2.6 or later.

```
# This file contains sample exclude and include rules for my application package.

# The following rule excludes any .DS_Store files and __MACOSX subdirectories and their contents from your project. This rule is useful for projects developed on OS X systems or projects in which you have added files or subdirectories created on an OS X system.
**/.DS_Store
**/__MACOSX/**/*

# The following rule excludes any Thumbs.db files from your projects. Thumbs.db is a thumbnails cache file managed by Windows. This rule is useful for projects developed on Windows systems or projects in which you have added files or subdirectories created on a Windows system.
**/Thumbs.db

# The following rule excludes .git subdirectories and their contents and the .gitignore file. This rule is useful for projects developed with Git version control.
.git/**/*
.gitignore

# The following rule excludes the bin and obj subdirectories. This rule is useful for projects developed with or migrated from Microsoft Visual Studio.
bin/**/*
obj/**/*

# The following rule excludes all files with a selected name, located anywhere in your project. For example, views/my_views/my_page.html.
**/my_page.html

# The following rule excludes all files that begin with a selected prefix. For example, the test prefix.
**/test*.*

# The following rule excludes all files that end in a selected suffix. For example, the debug suffix.
**/*debug.*

# The following rule excludes all files with a selected extension. For example, Windows PowerShell scripts.
**/*.ps1

```

## Troubleshooting

Between AppBuilder 2.6 and 2.7.3, the default `.abignore` file contained exclude rules with incorrect syntax. If you have created your project with an AppBuilder version between 2.6 and 2.7.3, you need to manually replace the contents of your default `.abignore` file with the following markup.

```
# .abignore lets you configure which of your files and folders should be excluded from your application package during the build process.
# Each project created with AppBuilder 2.6 or later contains a default .abignore which lists a number of system files and folders that might affect the size of your app or might prevent build operations from completing successfully.
#
# For more information about .abignore and how to write exclude and include rules for your projects, see http://docs.telerik.com/platform/appbuilder/testing-your-app/abignore

# Windows files
**/Thumbs.db

# Mac OS files
**/.DS_Store
**/__MACOSX/**/*

# Visual Studio files
bin/**/*
obj/**/*
**/*.obj
**/*.pdb
**/*.user
**/*.aps
**/*.pch
**/*.vspscc
**/*_i.c
**/*_p.c
**/*.ncb
**/*.suo
**/*.tlb
**/*.tlh
**/*.ilk
**/*.lib
**/*.sbr

# Source control files
.gitignore
.git/**/*

# AppBuilder files
.abignore
.ab/**/*
.app.json

# TypeScript files
**/*.ts
**/*.map

# Other
**/*.bak
**/*.cache
**/*.log
```
