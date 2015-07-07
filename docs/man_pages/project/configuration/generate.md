generate
==========

Usage | Synopsis
------|-------
General | `$ appbuilder generate <Command>`

Generates images from a single high-resolution one and saves them to the current project

<% if(isConsole) { %>
<% if(isMobileWebsite)  { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help generate`
<% } %>
<% } %>
<% if((isConsole && isCordova && isNativeScript) || isHtml) { %>

### Attributes
`<Command>` extends the `generate` command. You can set the following values for this attribute.
* `icon` - For generating icons
* `splashscreen` - For generating splashscreens
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[generate-icon](generate-icon.html) | Generates icons based on a single high-resolution image and saves them to the project.
[generate-splashscreen](generate-splashscreen.html) | Generates splashscreens based on a single high-resolution image and saves them to the project.
<% } %>