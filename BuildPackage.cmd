call "c:\Program Files (x86)\nodejs\nodevars.bat"
call npm.cmd install -g grunt-cli

set APPBUILDER_SKIP_POSTINSTALL_TASKS=1
call npm.cmd install
set APPBUILDER_SKIP_POSTINSTALL_TASKS=

call grunt.cmd pack --no-color

call npm.cmd cache rm appbuilder
cmd /C "rmdir /S /Q node_modules"
