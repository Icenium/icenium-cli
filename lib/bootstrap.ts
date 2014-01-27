global.$injector = require("./yok").injector;

$injector.require("config", "./config");
$injector.require("fs", "./file-system");
$injector.require("logger", "./logger");
$injector.require("commandsService", "./commands-service");
$injector.require("cordovaPluginsService", "./services/cordova-plugins");

$injector.require("helpCommandDataFactory", "./commands/help");
$injector.requireCommand("help", "./commands/help");

$injector.require("findPluginsCommandDataFactory", "./commands/find-plugins");
$injector.requireCommand("find-plugins", "./commands/find-plugins");

$injector.require("fetchPluginCommandDataFactory", "./commands/fetch-plugin");
$injector.requireCommand("fetch-plugin", "./commands/fetch-plugin");

$injector.require("editConfigurationCommandDataFactory", "./commands/configuration");
$injector.requireCommand("edit-configuration", "./commands/configuration");

$injector.require("simulateCommandDataFactory", "./commands/simulate");
$injector.requireCommand("simulate", "./commands/simulate");

$injector.require("server", "./server-api");
$injector.require("httpClient", "./service-util");
$injector.require("serviceProxy", "./service-util");
$injector.require("serviceContractGenerator", "./service-util");
$injector.require("serviceContractProvider", "./service-util");
$injector.requireCommand("dev-generate-api", "./commands/generate-server-api");

$injector.require("loginManager", "./login");
$injector.require("userDataStore", "./login");
$injector.requireCommand("login", "./login");
$injector.requireCommand("logout", "./login");
$injector.requireCommand("telerik-login", "./login");

$injector.require("identityManager", "./identity");
$injector.requireCommand("list-certificates", "./commands/identity");
$injector.requireCommand("list-provisions", "./commands/identity");

$injector.require("buildService", "./project");