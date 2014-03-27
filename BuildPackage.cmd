call "c:\Program Files (x86)\nodejs\nodevars.bat"
call npm.cmd install
call npm.cmd install -g grunt-cli
call grunt.cmd pack --no-color
