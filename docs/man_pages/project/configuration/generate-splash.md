generate splashscreen
==========

Usage | Synopsis
------|-------
General | `$ appbuilder generate splashscreen <Path>` [--force]

Generates splashscreens from a single high-resolution image and saves them to the current project

<% if(isConsole) { %>
<% if(isMobileWebsite)  { %>
WARNING: This command and its extended commands are not applicable to mobile website projects. To view the complete help for this command, run `$ appbuilder help generate`
<% } %>
<% } %>
<% if((isConsole && isCordova && isNativeScript) || isHtml) { %>

### Options
`--force` - If set, will replace all conflicting existing images in the project.

### Attributes
`<Path>` the path to the high-resolution image from which to generate splashscreens
<% } %>
<% if(isHtml) { %> 
### Command Limitations

* You cannot run this command on mobile website projects.

### Related Commands

Command | Description
----------|----------
[generate](generate.html) | Generates splashscreens or icons based on a single high-resolution image and saves them to the project.
[generate-icon](generate-icon.html) | Generates icons based on a single high-resolution image and saves them to the project.
<% } %>