global._ = require("underscore");
global.$injector = require("../lib/yok").injector;
$injector.require("config", "../lib/config");
$injector.require("resources", "../lib/resource-loader");