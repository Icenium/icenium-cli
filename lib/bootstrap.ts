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
$injector.require("marketplacePluginsService", "./services/marketplace-plugins-service");
$injector.require("pluginsService", "./services/plugins-service");

$injector.require("cordovaMigrationService", "./services/cordova-migration-service");
$injector.require("samplesService", "./services/samples-service");
$injector.requireCommand("sample|*list", "./commands/samples");
$injector.requireCommand("sample|clone", "./commands/samples");
$injector.require("opener", "./opener");
$injector.require("x509", "./x509");
$injector.require("qr", "./qr");

$injector.requireCommand("plugin|*list", "./commands/plugin/list-plugin");
$injector.requireCommand("plugin|add", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|remove", "./commands/plugin/remove-plugin");
$injector.requireCommand("plugin|configure", "./commands/plugin/configure-plugin");
$injector.requireCommand("plugin|find", "./commands/plugin/find-plugin");
$injector.requireCommand("plugin|fetch", "./commands/plugin/fetch-plugin");

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

$injector.require("serviceContractGenerator", "./swagger/service-contract-generator");
$injector.require("serviceContractProvider", "./swagger/service-contract-provider");

$injector.requireCommand("dev-generate-api", "./commands/generate-server-api");

$injector.require("loginManager", "./login");
$injector.require("userDataStore", "./login");

$injector.requireCommand("dev-telerik-login", "./login");

$injector.require("buildPropertiesAdjustment", "./services/build");
$injector.requireCommand("login", "./commands/authentication");
$injector.requireCommand("logout", "./commands/authentication");

$injector.require("buildService", "./services/build");
$injector.requireCommand("build", "./commands/build");

$injector.require("multipartUploadService", "./services/multipart-upload");
$injector.require("hashService", "./services/hash-service");

$injector.require("project", "./project");
$injector.require("projectPropertiesService", "./services/project-properties-service");
$injector.requireCommand("create|hybrid", "./commands/project");
$injector.requireCommand("create|native", "./commands/project");
$injector.requireCommand("create|website", "./commands/project");
$injector.requireCommand("init|*unknown", "./commands/project");
$injector.requireCommand("init|hybrid", "./commands/project");
$injector.requireCommand("init|native", "./commands/project");
$injector.requireCommand("init|website", "./commands/project");

$injector.requireCommand("prop|add", "./commands/prop/prop-add");
$injector.requireCommand("prop|set", "./commands/prop/prop-set");
$injector.requireCommand("prop|rm", "./commands/prop/prop-remove");
$injector.requireCommand("prop|remove", "./commands/prop/prop-remove");
$injector.requireCommand("prop|print", "./commands/prop/prop-print");

$injector.requireCommand("cloud|*list", "./commands/cloud-projects");
$injector.requireCommand("cloud|export", "./commands/cloud-projects");

$injector.requireCommand("deploy", "./commands/deploy");

$injector.requireCommand(["livesync|*devices", "live-sync|*devices"], "./commands/live-sync");
$injector.requireCommand(["livesync|cloud", "live-sync|cloud"], "./commands/livesync-cloud");

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

$injector.requireCommand("dev-post-install", "./commands/dev/post-install");
$injector.requireCommand("dev-prepackage", "./commands/dev/prepackage");
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
$injector.require("domainNameSystem", "./dns");
$injector.require("remoteProjectService", "./services/remote-projects-service");
$injector.require("optionsService", "./services/options-service");
$injector.require("processInfo", "./process-info");
$injector.requireCommand("mobileframework|*print", "./commands/framework-versions/print-versions");
$injector.requireCommand("mobileframework|set", "./commands/framework-versions/set-version");
