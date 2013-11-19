@if not exist %appdata%\npm\node_modules\jshint call npm install jshint -g

jshint bin lib test
