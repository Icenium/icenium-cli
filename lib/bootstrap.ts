require("./options");
require("./common/bootstrap");

$injector.require("serverConfiguration", "./server-config");
$injector.require("config", "./config");
$injector.require("staticConfig", "./config");
$injector.requireCommand("dev-config-apply", "./commands/dev/config-apply");
$injector.requireCommand("dev-config-reset", "./commands/dev/config-reset");
$injector.require("resources", "./resource-loader");
$injector.require("resourceDownloader", "./resource-loader");
$injector.require("platformMigrator", "./services/platform-migration");
$injector.require("templatesService", "./templates-service");
$injector.require("serverExtensionsService", "./services/server-extensions");
$injector.require("cordovaPluginsService", "./services/cordova-plugins");
$injector.require("cordovaMigrationService", "./services/cordova-migration-service");
$injector.require("samplesService", "./services/samples-service");
$injector.requireCommand("sample|*list", "./services/samples-service");
$injector.requireCommand("sample|clone", "./services/samples-service");
$injector.require("opener", "./opener");
$injector.require("x509", "./x509");
$injector.require("qr", "./qr");

$injector.requireCommand("plugin|find", "./commands/find-plugins");
$injector.requireCommand("plugin|fetch", "./commands/fetch-plugin");

$injector.requireCommand("edit-configuration", "./commands/edit-configuration");
$injector.requireCommand("simulate", "./commands/simulate");
$injector.require("emulate", "./commands/emulate");
$injector.requireCommand("emulate|android", "./commands/emulate");
$injector.requireCommand("emulate|ios", "./commands/emulate");
$injector.requireCommand("emulate|wp8", "./commands/emulate");
$injector.requireCommand("debug", "./commands/debug");

$injector.require("server", "./server-api");
$injector.require("httpServer", "./http-server");
$injector.require("serviceProxy", "./service-util");
$injector.require("serviceContractGenerator", "./service-util");
$injector.require("serviceContractProvider", "./service-util");
$injector.requireCommand("dev-generate-api", "./commands/generate-server-api");

$injector.require("loginManager", "./login");
$injector.require("userDataStore", "./login");
$injector.requireCommand("login", "./login");
$injector.requireCommand("logout", "./login");

$injector.require("buildService", "./services/build");
$injector.requireCommand("build", "./services/build");

$injector.require("projectTypes", "./project-types");
$injector.require("project", "./project");
$injector.require("projectPropertiesService", "./services/project-properties-service");
$injector.requireCommand("create|hybrid", "./project");
$injector.requireCommand("create|native", "./project");
$injector.requireCommand("init", "./project");
$injector.requireCommand("prop|add", "./project");
$injector.requireCommand("prop|set", "./project");
$injector.requireCommand("prop|rm", "./project");
$injector.requireCommand("prop|remove", "./project");
$injector.requireCommand("prop|print", "./project");


$injector.requireCommand("cloud|*list", "./remote-projects");
$injector.requireCommand("cloud|export", "./remote-projects");

$injector.requireCommand("device|*list", "./commands/list-devices");
$injector.requireCommand("device|log", "./commands/open-device-log-stream");

$injector.requireCommand("deploy", "./commands/deploy");

$injector.requireCommand(["livesync|*devices", "live-sync|*devices"], "./commands/live-sync");
$injector.requireCommand(["livesync|cloud", "live-sync|cloud"], "./services/build");

$injector.require("identityManager", "./commands/cryptographic-identities");
$injector.requireCommand("provision|*list", "./commands/cryptographic-identities");
$injector.requireCommand("provision|import", "./commands/cryptographic-identities");
$injector.requireCommand("provision|remove", "./commands/cryptographic-identities");
$injector.require("selfSignedIdentityValidator", "./validators/cryptographic-identity-validators");
$injector.requireCommand("certificate|*list", "./commands/cryptographic-identities");
$injector.requireCommand("certificate|create-self-signed", "./commands/cryptographic-identities");
$injector.requireCommand("certificate|remove", "./commands/cryptographic-identities");
$injector.requireCommand("certificate|export", "./commands/cryptographic-identities");
$injector.requireCommand("certificate|import", "./commands/cryptographic-identities");
$injector.requireCommand("certificate-request|*list", "./commands/cryptographic-identities");
$injector.requireCommand("certificate-request|create", "./commands/cryptographic-identities");
$injector.requireCommand("certificate-request|remove", "./commands/cryptographic-identities");
$injector.requireCommand("certificate-request|download", "./commands/cryptographic-identities");

$injector.requireCommand("user", "./commands/user-status");

$injector.requireCommand("appstore|list", "./commands/itunes-connect");
$injector.requireCommand("appstore|upload", "./commands/itunes-connect");
$injector.requireCommand("appmanager|upload", "./commands/appmanager");

$injector.requireCommand("update-kendoui", "./commands/update-kendoui");

$injector.requireCommand("dev-prepackage", "./commands/post-install");
$injector.require("platformServices", "./commands/simulate");
$injector.requireCommand("remote", "./commands/remote");
$injector.require("clientUserSettingsFileService", "./services/user-settings-service");
$injector.require("clientSpecificUserSettingsService", "./services/user-settings-service");
$injector.require("sharedUserSettingsFileService", "./services/user-settings-service");
$injector.require("sharedUserSettingsService", "./services/user-settings-service");
$injector.require("userSettingsService", "./services/user-settings-service");
$injector.require("analyticsSettingsService", "./services/analytics-settings-service");

$injector.require("pathFilteringService", "./services/path-filtering");
$injector.require("emulatorSettingsService", "./services/emulator-settings-service");
$injector.require("express", "./express");
