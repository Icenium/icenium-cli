screenbuilder
==========

<br>
<span style="color:red;font-size:15px"><%= #{screenBuilderService.getDeprecationWarning} %> </span>
<br>

Usage | Synopsis
------|-------
General | `$ appbuilder screenbuilder`

Shows all commands for project development with Screen Builder.

<% if(isConsole) { %>WARNING: This set of commands is applicable only to Apache Cordova projects created with Screen Builder.<% } %>
<br>
<span style="color:red;font-size:15px"><%= "These commands are deprecated and will be removed in the next official release." %></span>
<br>

Command | Description
----------|----------
[add-about](add-about.html) | Inserts an about form in an existing application view.
[add-authentication](add-authentication.html) | Inserts sign-in and sign-up forms in an existing application view.
[add-dataprovider](add-dataprovider.html) | Connects your project to a data provider.
[add-field](add-field.html) | Inserts an input field in an existing form.
[add-form](add-form.html) | Inserts a generic input form in an existing application view.
[add-list](add-list.html) | Inserts a list in an existing application view.
[add-view](add-view.html) | Adds a new application view to your project.

<% if(isHtml) { %>
### Prerequisites

* Verify that you have installed git on your system.

### Command Limitations

* You cannot add components to projects created with earlier version of the AppBuilder CLI. This behavior will be fixed in an upcoming release.

### Related Commands
Command | Description
----------|----------
[create screenbuilder](../project/creation/create-screenbuilder.html) | Creates a new project for hybrid development with Screen Builder.
[upgrade-screenbuilder](upgrade-screenbuilder.html) | Upgrades a project to the latest Screen Builder version.
<% } %>
