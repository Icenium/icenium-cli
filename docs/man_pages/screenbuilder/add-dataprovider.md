add-dataProvider
==========

Usage | Synopsis
------|-------
General | `$ appbuilder add-dataProvider` [--answers <File Path>]

Connects your project to a Telerik Backend Services, JSON, OData or a Progress Data Services data provider. <% if(isHtml) { %>After you configure the data provider, you can use it in your code or use it with the `add-list`, `add-signin` and `add-signup` commands to generate lists, sign-in and sign-up forms connected to the data provider. An interactive prompt guides you through the setup process.<% } %>
<% if(isConsole) { %>WARNING: This command is applicable only to Apache Cordova projects created with Screen Builder.<% } %>

### Options

* `--answers` - If set, the Telerik AppBuilder CLI looks for the specified `JSON` file and tries to pull the configuration data required by the command. If one or more required properties are not specified, the Telerik AppBuilder CLI will prompt you to provide the missing values.

### Attributes

* `<File Path>` is the absolute or relative file path to a `JSON` file which contains configuration information about your project.<% if(isHtml) { %> The file must comply with the JSON specification described in detail [here](http://docs.telerik.com/platform/appbuilder/creating-your-project/screen-builder-automation#add-dataprovider).<% } %>

<% if(isHtml) { %>
### Command Limitations

* You can run this command only on projects created with Screen Builder.

### Related Commands

Command | Description
----------|----------
[create screenbuilder](../project/creation/create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[screenbuilder](screenbuilder.html) | Shows all commands for project development with Screen Builder.
[upgrade-screenbuilder](upgrade-screenbuilder.html) | Upgrades a project to the latest Screen Builder version.
[add-about](add-about.html) | Inserts an about form in an existing application view.
[add-authentication](add-authentication.html) | Inserts sign-in and sign-up forms in an existing application view.
[add-field](add-field.html) | Inserts an input field in an existing form.
[add-form](add-form.html) | Inserts a generic input form in an existing application view.
[add-list](add-list.html) | Inserts a list in an existing application view.
[add-view](add-view.html) | Adds a new application view to your project.
[add-editablelist](add-editablelist.html) | Inserts an editable list in an existing application view.
[add-editablelistform](add-editablelistform.html) | Inserts an editable form in an existing editable list.
[add-editablelistformfield](add-editablelistformfield.html) | Inserts an editable field in an existing editable form.
<% } %>