global.$injector = require("./yok").injector;

$injector.require("config", "./config");
$injector.require("fs", "./file-system");
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
$injector.require("listDevicesCommandDataFactory","./commands/list-devices");
$injector.requireCommand("list-devices", "./commands/list-devices");

$injector.require("deployCommandDataFactory", "./commands/deploy");
$injector.requireCommand("deploy", "./commands/deploy");

$injector.require("syncCommandDataFactory", "./commands/sync");
$injector.requireCommand("sync", "./commands/sync");

$injector.require("openDeviceLogStreamCommand", "./commands/open-device-log-stream");
$injector.requireCommand("open-device-log-stream", "./commands/open-device-log-stream");

$injector.require("iOSCore", "./mobile/ios/ios-core");
$injector.require("coreFoundation", "./mobile/ios/ios-core");
$injector.require("mobileDevice", "./mobile/ios/ios-core");
$injector.require("plistService", "./mobile/ios/ios-core");

$injector.require("installationProxyClient", "./mobile/ios/ios-proxy-services");
$injector.require("notificationProxyClient", "./mobile/ios/ios-proxy-services");
$injector.require("houseArrestClient", "./mobile/ios/ios-proxy-services");

$injector.require("signal", "./events/signal");
$injector.require("deviceFound", "./mobile/mobile-core/device-discovery");
$injector.require("deviceLost", "./mobile/mobile-core/device-discovery");

$injector.require("deviceDiscovery", "./mobile/mobile-core/device-discovery");
$injector.require("iOSDeviceDiscovery", "./mobile/mobile-core/device-discovery");
$injector.require("androidDeviceDiscovery", "./mobile/mobile-core/device-discovery");
$injector.require("iOSDevice", "./mobile/ios/ios-device");
$injector.require("androidDevice", "./mobile/android/android-device");

$injector.require("devicesServices", "./mobile/mobile-core/devices-services");


