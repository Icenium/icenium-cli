global.$injector = require("./yok").injector;

$injector.require("logger", "./logger");
$injector.require("cordovaPluginsService", "./services/cordova-plugins");

$injector.require("helpCommandDataFactory", "./commands/help");
$injector.requireCommand("help", "./commands/help");

$injector.require("findPluginsCommandDataFactory", "./commands/find-plugins");
$injector.requireCommand("find-plugins", "./commands/find-plugins");

$injector.require("fetchPluginCommandDataFactory", "./commands/fetch-plugin");
$injector.requireCommand("fetch-plugin", "./commands/fetch-plugin");

$injector.require("simulateCommandDataFactory", "./commands/simulate");
$injector.requireCommand("simulate", "./commands/simulate");
