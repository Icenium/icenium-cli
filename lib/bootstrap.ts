global._ = require("underscore");
global.$injector = require("./yok").injector;
require("colors");

$injector.require("serverConfiguration", "./server-config");
$injector.require("config", "./config");
$injector.requireCommand("dev-config-apply", "./config");
$injector.requireCommand("dev-config-reset", "./config");
$injector.require("errors", "./errors");
$injector.require("fs", "./file-system");
$injector.require("resources", "./resource-loader");
$injector.require("resourceDownloader", "./resource-loader");
$injector.require("childProcess", "./child-process");
$injector.require("logger", "./logger");
$injector.require("commandsService", "./commands-service");
$injector.require("templatesService", "./templates-service");
$injector.require("serverExtensionsService", "./services/server-extensions");
$injector.require("cordovaPluginsService", "./services/cordova-plugins");
$injector.require("opener", "./opener");
$injector.require("x509", "./x509");
$injector.require("qr", "./qr");

$injector.requireCommand(["help", "/?"], "./commands/help");

$injector.requireCommand("find-plugins", "./commands/find-plugins");
$injector.requireCommand("fetch-plugin", "./commands/fetch-plugin");

$injector.requireCommand("edit-configuration", "./commands/edit-configuration");
$injector.requireCommand("simulate", "./commands/simulate");
$injector.requireCommand("debug", "./commands/debug");

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
$injector.requireCommand("dev-telerik-login", "./login");

$injector.require("buildService", "./services/build");
$injector.requireCommand("build", "./services/build");
$injector.requireCommand("cloud-sync", "./services/build");

$injector.require("project", "./project");
$injector.requireCommand("create", "./project");
$injector.requireCommand("init", "./project");
$injector.requireCommand("prop-add", "./project");
$injector.requireCommand("prop-set", "./project");
$injector.requireCommand("prop-rm", "./project");
$injector.requireCommand("prop-remove", "./project");
$injector.requireCommand("prop-print", "./project");
$injector.require("projectNameValidator", "./validators/project-name-validator");

$injector.requireCommand("list-projects", "./remote-projects");
$injector.requireCommand("export-project", "./remote-projects");
$injector.requireCommand("list-devices", "./commands/list-devices");

$injector.requireCommand("deploy", "./commands/deploy");

$injector.requireCommand(["livesync", "live-sync"], "./commands/live-sync");

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
$injector.require("prompter", "./prompter");


$injector.require("identityManager", "./commands/cryptographic-identities");
$injector.requireCommand("list-provisions", "./commands/cryptographic-identities");
$injector.requireCommand("import-provision", "./commands/cryptographic-identities");
$injector.requireCommand("remove-provision", "./commands/cryptographic-identities");
$injector.requireCommand("list-certificates", "./commands/cryptographic-identities");
$injector.require("selfSignedIdentityValidator", "./validators/cryptographic-identity-validators");
$injector.requireCommand("create-self-signed-certificate", "./commands/cryptographic-identities");
$injector.requireCommand("remove-certificate", "./commands/cryptographic-identities");
$injector.requireCommand("export-certificate", "./commands/cryptographic-identities");
$injector.requireCommand("import-certificate", "./commands/cryptographic-identities");
$injector.requireCommand("create-certificate-request", "./commands/cryptographic-identities");
$injector.requireCommand("list-certificate-requests", "./commands/cryptographic-identities");
$injector.requireCommand("remove-certificate-request", "./commands/cryptographic-identities");
$injector.requireCommand("download-certificate-request", "./commands/cryptographic-identities");

$injector.requireCommand("user", "./commands/user-status");

$injector.requireCommand("appstore-list", "./commands/itunes-connect");
$injector.requireCommand("appstore-upload", "./commands/itunes-connect");

$injector.requireCommand("dev-post-install", "./commands/post-install");
$injector.require("platformServices", "./commands/simulate");
$injector.require("analyticsService", "./services/analytics-service");
$injector.require("clientSpecificUserSettingsService", "./services/user-settings-service");
$injector.require("sharedUserSettingsService", "./services/user-settings-service");
$injector.require("futureDispatcher", "./appbuilder-cli");

$injector.require("pathFilteringService", "./services/path-filtering");
