global.$injector = require("./yok").injector;

global.$injector.require("log", "./log");
global.$injector.require("cordovaPluginsService", "./services/cordova-plugins");

global.$injector.require("help", "./commands/help");
global.$injector.require("helpCommandDataFactory", "./commands/help");

global.$injector.require("find-plugins", "./commands/find-plugins");
global.$injector.require("findPluginsCommandDataFactory", "./commands/find-plugins");

global.$injector.require("fetch-plugin", "./commands/fetch-plugin");
global.$injector.require("fetchPluginCommandDataFactory", "./commands/fetch-plugin");

global.$injector.require("simulate", "./commands/simulate");
global.$injector.require("simulateCommandDataFactory", "./commands/simulate");
