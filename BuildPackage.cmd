call "c:\Program Files (x86)\nodejs\nodevars.bat"
call npm.cmd install -g grunt-cli

call npm.cmd install
node prepublish.js

call grunt.cmd pack --no-color

call npm.cmd cache rm appbuilder
call npm.cmd install -g rimraf
call rimraf.cmd node_modules
