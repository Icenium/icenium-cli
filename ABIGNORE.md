.abignore
=========

To set exclude and include rules, you can create and manage an .abignore file in the root of your project.

* [Overview](#overview)
* [Create .abignore](#create-abignore)
* [Adding rules and comments](#adding-rules-and-comments)
* [Sample .abignore](#sample-abignore)

## Overview

When you develop apps with the Telerik AppBuilder Command-Line Interface (AppBuilder CLI), you can choose which files to exclude from your application package. To set exclude and include rules, you can modify the `.abignore` file in the root of your project.

The AppBuilder CLI respects `.abignore` during the following operations.

* Build an application package.
* Build an application package for publishing.
* Build and deploy an application package on device.
* Build and deploy in the companion app from QR code.
* Build and deploy in the native emulators.
* LiveSync changes to remote devices.

The AppBuilder CLI does not respect `.abignore` during the following operations.

* Build and deploy in the device simulator.
* LiveSync changes to connected devices.

## Create .abignore

Starting with {{site.ab}} 2.6, all newly created projects or cloned sample apps contain a default `.abignore`. To manage the exclude and include rules for projects created with earlier versions of {{site.ab}}, you need to manually add `.abignore` to your project.

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

## Adding rules and comments

> When you edit `.abignore`, make sure that your exclude and include rules comply with the glob syntax and any syntax specifics of the minimatch matching library.<br/>For more information about glob syntax, see <a href="http://unixhelp.ed.ac.uk/CGI/man-cgi?glob+7" target="_blank">Glob in the Linux Programmer's Manual</a>.<br/>For more information about minimatch syntax, see <a href="https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations" target="_blank">Comparisons to other fnmatch/glob implementations</a>.

When you create and modify your `.abignore` file, keep in mind the following specifics.
   
* Each rule must start on a new line. 
* Empty lines are ignored.
* By default, all rules are exclude rules.
* Starting with {{site.ab}} 2.6, newly created projects contain a default `.abignore` file. This file excludes the following files and subdirectories from your application package.
   * All `Thumbs.db` files: Thumbnails cache files managed by Windows.
   * All `.DS_Store` files: Hidden OS X system files.
   * All `__MACOSX` directories and their contents: Hidden OS X system directories.
   * `bin`: A subdirectory in projects created with Visual Studio. It contains your latest built application packages.
   * `obj`: A subdirectory in projects created with Visual Studio. It contains the archived project files that {{site.ab}} sends to the build server.
   * `.gitignore`: A file that Git uses to deremine which files and directories to ignore when you are making a commit.
   * `.git`: A subdirectory in which Git stores your version control history and other relevant version control data. 
   * `.abignore`: This file contains exclude and include rules for your application package.
   * `.ab`: The {{site.ab-cli}} creates and manages this subdirectory. It contains temporary working files which the {{site.ab-cli}} uses.
* For projects created with {{site.ab}} 2.5.2 or earlier, you need to manually create `.abignore`. For such projects, by default, the {{site.ab-cli}} excludes the following files and subdirectories. You do not need to manually list these files in your `.abignore` file.
   * `.ab:` The {{site.ab-cli}} creates and manages this subdirectory. It contains temporary working files which the {{site.ab-cli}} uses.
   * `.abignore:` This file contains exclude and include rules for your application package.
   * `IPA, APK, and XAP:` The application packages for iOS, Android, and {{site.wp8}}, respectively.
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

   For more information about glob syntax, see <a href="http://unixhelp.ed.ac.uk/CGI/man-cgi?glob+7" target="_blank">Glob in the Linux Programmer's Manual</a>.<br/>For more information about minimatch syntax, see <a href="https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations" target="_blank">Comparisons to other fnmatch/glob implementations</a>.
* File paths must be relative to the location of `.abignore` and must be in the following format: `directory/subdirectory/file`.<br/>For example:

   ```
   # The following rule excludes the views directory, its subdirectories and their contents.
   views/**/*

   # The following rule excludes the build.js file located in the scripts subdirectory.
   scripts/build.js
   ```
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

This is the markup of a sample `.abignore` file. This sample is based on the default `.abignore` file included in projects created with {{site.ab}} 2.6 or later.

```
# This file contains sample exclude and include rules for my application package.

# The following rule excludes any .DS_Store files and __MACOSX subdirectories and their contents from your project. This rule is useful for projects developed on OS X systems or projects in which you have added files or subdirectories created on an OS X system.
*/**/.DS_Store
*/**/__MACOSX/**/*

# The following rule excludes any Thumbs.db files from your projects. Thumbs.db is a thumbnails cache file managed by Windows. This rule is useful for projects developed on Windows systems or projects in which you have added files or subdirectories created on a Windows system.
*/**/Thumbs.db

# The following rule excludes .git subdirectories and their contents and the .gitignore file. This rule is useful for projects developed with Git version control.
.git/**/*
.gitignore

# The following rule excludes the bin and obj subdirectories. This rule is useful for projects developed with or migrated from Microsoft Visual Studio. 
bin/**/*
obj/**/*

# The following rule excludes all files with a selected name, located anywhere in your project. For example, views/my_views/my_page.html.
*/**/my_page.html

# The following rule excludes all files that begin with a selected prefix. For example, the test prefix.
*/**/test*.*

# The following rule excludes all files that end in a selected suffix. For example, the debug suffix.
*/**/*debug.*

# The following rule excludes all files with a selected extension. For example, Windows PowerShell scripts.
*/**/*.ps1

```