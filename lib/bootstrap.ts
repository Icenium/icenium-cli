require("./common/appbuilder/appbuilder-bootstrap");
$injector.require("logger", "./common/logger");
$injector.require("staticConfig", "./config");
$injector.require("config", "./config");
$injector.require("dependencyConfigService", "./services/dependency-config");
$injector.require("userSettingsService", "./services/user-settings-service");
$injector.require("options", "./options");
// note: order above is important!

$injector.require("serverConfiguration", "./server-config");
$injector.requireCommand("dev-config", "./commands/dev/config");
$injector.requireCommand("dev-config-apply", "./commands/dev/config-apply");
$injector.requireCommand("dev-config-reset", "./commands/dev/config-reset");
$injector.require("cordovaResources", "./cordova-resource-loader");
$injector.require("resourceDownloader", "./resource-downloader");
$injector.require("platformMigrator", "./services/platform-migration");
$injector.require("templatesService", "./templates-service");
$injector.require("serverExtensionsService", "./services/server-extensions");
$injector.require("appScaffoldingExtensionsService", "./services/app-scaffolding-extensions-service");
$injector.require("screenBuilderService", "./services/screen-builder-service");

$injector.require("cordovaPluginsService", "./services/cordova-plugins");
$injector.require("marketplacePluginsService", "./services/marketplace-plugins-service");
$injector.require("cordovaProjectPluginsService", "./services/cordova-project-plugins-service");
$injector.require("nativeScriptProjectPluginsService", "./services/nativescript-project-plugins-service");
$injector.require("pluginsService", "./services/plugins-service");

$injector.require("cordovaMigrationService", "./services/cordova-migration-service");
$injector.require("nativeScriptMigrationService", "./services/nativescript-migration-service");
$injector.require("samplesService", "./services/samples-service");
$injector.requireCommand("sample|*list", "./commands/samples");
$injector.requireCommand("sample|clone", "./commands/samples");
$injector.require("x509", "./x509");
$injector.require("qr", "./qr");

$injector.requireCommand("plugin|*list", "./commands/plugin/list-plugin");
$injector.requireCommand("plugin|add", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|remove", "./commands/plugin/remove-plugin");
$injector.requireCommand("plugin|configure", "./commands/plugin/configure-plugin");
$injector.requireCommand("plugin|find", "./commands/plugin/find-plugins");
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
$injector.require("serviceProxyBase", "./service-util");

$injector.require("serviceContractGenerator", "./swagger/service-contract-generator");
$injector.require("serviceContractProvider", "./swagger/service-contract-provider");

$injector.requireCommand("dev-generate-api", "./commands/generate-server-api");

$injector.require("loginManager", "./login");
$injector.require("userDataStore", "./login");

$injector.requireCommand("dev-telerik-login", "./login");

$injector.requireCommand("login", "./commands/authentication");
$injector.requireCommand("logout", "./commands/authentication");

$injector.require("buildService", "./services/build");
$injector.requireCommand("build|android", "./commands/build");
$injector.requireCommand("build|ios", "./commands/build");
$injector.requireCommand("build|wp8", "./commands/build");

$injector.require("multipartUploadService", "./services/multipart-upload");
$injector.require("hashService", "./services/hash-service");

$injector.require("frameworkProjectResolver", "./project/resolvers/framework-project-resolver");
$injector.require("frameworkSimulatorServiceResolver", "./project/resolvers/framework-simulator-service-resolver");

$injector.require("projectSimulatorService", "./services/project-simulator-service");
$injector.require("cordovaSimulatorService", "./services/project-simulator-service");
$injector.require("nativeScriptSimulatorService", "./services/project-simulator-service");

$injector.require("simulatorPlatformServices", "./services/simulatorPlatformServices");
$injector.require("simulatorService", "./services/simulator-service");

$injector.require("project", "./project");
$injector.require("cordovaProject", "./project/cordova-project");
$injector.require("nativeScriptProject", "./project/nativescript-project");
$injector.require("configFilesManager", "./project/config-files-manager");
$injector.require("projectPropertiesService", "./services/project-properties-service");
$injector.require("nameCommandParameter", "./commands/project/name-command-parameter");
$injector.requireCommand("create|*default", "./commands/project/create");
$injector.requireCommand("create|screenbuilder", "./commands/project/create");
$injector.requireCommand("init|*unknown", "./commands/project/init");

$injector.requireCommand("prop|add", "./commands/prop/prop-add");
$injector.requireCommand("prop|set", "./commands/prop/prop-set");
$injector.requireCommand("prop|rm", "./commands/prop/prop-remove");
$injector.requireCommand("prop|remove", "./commands/prop/prop-remove");
$injector.requireCommand("prop|print", "./commands/prop/prop-print");
$injector.requireCommand("prop|print|frameworkversion", "./commands/framework-versions/print-versions");
$injector.requireCommand("prop|set|frameworkversion", "./commands/framework-versions/set-version");
$injector.requireCommand("prop|set|androidversioncode", "./commands/prop/prop-set-android-version-code");
$injector.requireCommand("prop|print|androidversioncode", "./commands/prop/prop-print-android-version-code");

$injector.requireCommand("cloud|*list", "./commands/cloud-projects");
$injector.requireCommand("cloud|export", "./commands/cloud-projects");

$injector.require("deployHelper", "./commands/deploy");
$injector.requireCommand("deploy|*devices", "./commands/deploy");
$injector.requireCommand("deploy|android", "./commands/deploy");
$injector.requireCommand("deploy|ios", "./commands/deploy");
$injector.requireCommand("deploy|wp8", "./commands/deploy");

$injector.requireCommand(["livesync|*devices", "live-sync|*devices"], "./commands/live-sync");
$injector.requireCommand(["livesync|cloud", "live-sync|cloud"], "./commands/livesync-cloud");
$injector.requireCommand(["livesync|android", "live-sync|android"], "./commands/live-sync");
$injector.requireCommand(["livesync|ios", "live-sync|ios"], "./commands/live-sync");
$injector.requireCommand(["livesync|wp8", "live-sync|wp8"], "./commands/live-sync");

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
$injector.require("appStoreService", "./services/appstore-service");
$injector.requireCommand("appstore|list", "./commands/itunes-connect");
$injector.requireCommand("appstore|upload", "./commands/itunes-connect");
$injector.requireCommand("appmanager|upload|android", "./commands/appmanager");
$injector.requireCommand("appmanager|upload|ios", "./commands/appmanager");
$injector.requireCommand("appmanager|upload|wp8", "./commands/appmanager");
$injector.requireCommand("appmanager|groups", "./commands/appmanager");

$injector.require("kendoUIService", "./services/kendoui-service");

$injector.requireCommand("update-kendoui", "./commands/kendoui-install");
$injector.requireCommand("kendoui|*list", "./commands/kendoui-list");
$injector.requireCommand("kendoui|install", "./commands/kendoui-install");
$injector.requireCommand("kendoui|notes", "./commands/kendoui-notes");

$injector.requireCommand("upgrade-screenbuilder", "./commands/upgrade-screenbuilder");

$injector.requireCommand("dev-prepackage", "./commands/dev/prepackage");
$injector.require("platformServices", "./commands/simulate");
$injector.require("remoteService", "./services/remote-service");
$injector.requireCommand("remote", "./commands/remote");
$injector.require("clientUserSettingsFileService", "./services/user-settings-service");
$injector.require("clientSpecificUserSettingsService", "./services/user-settings-service");
$injector.require("sharedUserSettingsFileService", "./services/user-settings-service");
$injector.require("sharedUserSettingsService", "./services/user-settings-service");
$injector.require("analyticsSettingsService", "./services/analytics-settings-service");

$injector.require("emulatorSettingsService", "./services/emulator-settings-service");
$injector.require("express", "./express");
$injector.require("domainNameSystem", "./dns");
$injector.require("remoteProjectService", "./services/remote-projects-service");
$injector.require("processInfo", "./process-info");
$injector.requireCommand("mobileframework|*print", "./commands/framework-versions/print-versions");
$injector.requireCommand("mobileframework|set", "./commands/framework-versions/set-version");

$injector.require("jsonSchemaLoader", "./json-schema/json-schema-loader");
$injector.require("jsonSchemaResolver", "./json-schema/json-schema-resolver");
$injector.require("jsonSchemaValidator", "./json-schema/json-schema-validator");
$injector.require("jsonSchemaConstants", "./json-schema/json-schema-constants");

$injector.require("liveSyncService", "./services/livesync/livesync-service");
$injector.require("liveSyncProvider", "./providers/livesync-provider");
$injector.require("appManagerService", "./services/appmanager-service");
$injector.requireCommand("appmanager|livesync", "./commands/appmanager-livesync");

$injector.require("dynamicHelpProvider", "./dynamic-help-provider");
$injector.require("hostCapabilities", "./host-capabilities");

$injector.require("commandsServiceProvider", "./providers/commands-service-provider");
$injector.require("deviceLogProvider", "./common/mobile/device-log-provider");

$injector.require("projectCommandsService", "./services/project-commands-service");

$injector.requireCommand("screenbuilder", "./commands/screenbuilder");

$injector.require("webViewService", "./services/web-view-service");
$injector.requireCommand("webview|*list", "./commands/web-view/list-web-views");
$injector.requireCommand("webview|set", "./commands/web-view/set-web-view");

$injector.require("doctorService", "./services/doctor-service");

$injector.require("imageService", "./services/image-service");

$injector.requireCommand("resource|*list", "./commands/resource");
$injector.requireCommand("resource|create", "./commands/resource");

$injector.require("nativeScriptResources", "./nativescript-resources");
$injector.require("sysInfo", "./sys-info");
$injector.require("messages", "./messages");
