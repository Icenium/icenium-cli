///<reference path="../.d.ts"/>
"use strict";

export class JsonSchemaConstants implements IJsonSchemaConstants {
	public BASE_VALIDATION_SCHEMA_ID = "Base";
	public BASE_CORDOVA_SCHEMA_ID = "Cordova*";
	public CORDOVA_VERSION_2_SCHEMA_ID = "Cordova-2.*";
	public CORDOVA_VERSION_3_SCHEMA_ID = "Cordova-3.*";
	public NATIVESCRIPT_SCHEMA_ID = "NativeScript*";
}
$injector.register("jsonSchemaConstants", JsonSchemaConstants);