upgrade-screenbuilder
==========

<br>
<span style="color:red;font-size:15px"><%= #{screenBuilderService.getDeprecationWarning} %> </span>
<br>

Usage | Synopsis
------|-------
General | `$ appbuilder upgrade-screenbuilder`

Upgrades a project to the latest Screen Builder version. This operation regenerates the project and you might lose custom code changes.<% if(isHtml) { %> For more information how to preserve your custom code changes, see [How To Add And Keep Custom Code Changes In Your App](http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes).<% } %>

<% if(isConsole) { %>WARNING: This command is applicable only to Apache Cordova projects created with Screen Builder.<% } %>

<% if(isHtml) { %>
### Command Limitations

* You can run this command only on Apache Cordova projects created with Screen Builder 0.0.7 and later. For projects created with earlier versions of Screen Builder, you need to upgrade your project manually. You need to create a new Screen Builder project and transfer custom code and resources to the newly created project.

### Related Commands

Command | Description
----------|----------
[create screenbuilder](../project/creation/create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[screenbuilder](screenbuilder.html) | Shows all commands for project development with Screen Builder.
[add-about](add-about.html) | Inserts an about form in an existing application view.
[add-authentication](add-authentication.html) | Inserts sign-in and sign-up forms in an existing application view.
[add-dataprovider](add-dataprovider.html) | Connects your project to a data provider.
[add-field](add-field.html) | Inserts an input field in an existing form.
[add-form](add-form.html) | Inserts a generic input form in an existing application view.
[add-list](add-list.html) | Inserts a list in an existing application view.
<% } %>
