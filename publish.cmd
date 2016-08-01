
@if "%1" == "" goto error
@if "%2" == "" goto error

@for /f "delims=. tokens=1-3" %%a in ( "%2" ) do (set major=%%a && set minor=%%b && set revision=%%c)

@if not defined revision goto error
@if not defined minor goto error
@if not defined major goto error

git fetch
git tag -a v%2 -m "Telerik AppBuilder %2" remotes/origin/release
git push origin v%2

npm publish "%1"
@goto :EOF

:error
@echo Sample usage: publish appbuilder.tgz 1.2.3
@echo Version string must be in Major.Minor.Revision format
