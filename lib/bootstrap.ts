global.$injector = require("./yok").injector;

$injector.require("config", "./config");
$injector.requireCommand("config-apply", "./config");
$injector.requireCommand("config-reset", "./config");
$injector.require("errors", "./errors");
$injector.require("fs", "./file-system");
$injector.require("childProcess", "./child-process");
$injector.require("logger", "./logger");
$injector.require("commandsService", "./commands-service");
$injector.require("cordovaPluginsService", "./services/cordova-plugins");

$injector.requireCommand("help", "./commands/help");

$injector.requireCommand("find-plugins", "./commands/find-plugins");

$injector.requireCommand("fetch-plugin", "./commands/fetch-plugin");

$injector.requireCommand("edit-configuration", "./commands/edit-configuration");
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
$injector.requireCommand("list-certificates", "./identity");
$injector.requireCommand("list-provisions", "./identity");

$injector.require("buildService", "./project");
$injector.require("project", "./project");
$injector.requireCommand("build", "./project");
$injector.requireCommand("ion", "./project");
$injector.requireCommand("update", "./project");
$injector.requireCommand("create", "./project");
$injector.requireCommand("prop-add", "./project");
$injector.requireCommand("prop-set", "./project");
$injector.requireCommand("prop-del", "./project");
$injector.requireCommand("prop-print", "./project");
$injector.require("projectNameValidator", "./validators/project-name-validator");

$injector.requireCommand("list-projects", "./remote-projects");
$injector.requireCommand("export-project", "./remote-projects");
$injector.require("buildService", "./project");
$injector.requireCommand("list-devices", "./commands/list-devices");

$injector.requireCommand("deploy", "./commands/deploy");

$injector.requireCommand("sync", "./commands/sync");

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


