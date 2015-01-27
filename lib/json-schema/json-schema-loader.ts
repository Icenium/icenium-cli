///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util")
import jsonSchemaResolverPath = require("./json-schema-resolver");

export class JsonSchemaLoader implements IJsonSchemaLoader {

	private schemasFolderPath: string = null;
	private schemas: IDictionary<ISchema> = null;
	private schema: ISchema = null;
	private loadedSchemas: IDictionary<ISchema> = null;

	public constructor(private $config: IConfiguration,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $injector: IInjector,
		private $resources: IResourceLoader) {
		this.schemasFolderPath = this.$resources.resolvePath("json-schemas");
		this.schemas = Object.create(null);
		this.loadedSchemas = Object.create(null);

		this.loadSchemas().wait();

		var schemaResolver = this.$injector.resolve(jsonSchemaResolverPath.JsonSchemaResolver, { schemas: this.loadedSchemas });
		this.$injector.register("jsonSchemaResolver", schemaResolver);
	}

	public downloadSchemas(): IFuture<void> {
		return (() => {
			this.$fs.deleteDirectory(this.schemasFolderPath).wait();
			this.$fs.createDirectory(this.schemasFolderPath).wait();

			var zipUrl = util.format("http://%s/appbuilder/Resources/Files/Schemas.zip", this.$config.AB_SERVER);

			var filePath = path.join(this.schemasFolderPath, "schemas.zip");
			var file = this.$fs.createWriteStream(filePath);
			var fileEnd = this.$fs.futureFromEvent(file, "finish");

			this.$httpClient.httpRequest({ url: zipUrl, pipeTo: file}).wait();
			fileEnd.wait();

			this.$fs.unzip(filePath, this.schemasFolderPath).wait();
			this.$fs.deleteFile(filePath).wait();
		}).future<void>()();
	}

	private loadSchemas(): IFuture<void> {
		return (() => {
			if(this.$fs.exists(this.schemasFolderPath).wait()) {

				var fileNames = this.$fs.readDirectory(this.schemasFolderPath).wait();
				_.each(fileNames, (fileName: string) => {
					if( path.extname(fileName) === ".json") {
						var fullFilePath = path.join(this.schemasFolderPath, fileName);
						var schema = this.$fs.readJson(fullFilePath).wait();
						this.schemas[schema.id] = schema;
					}
				});

				var schemas = _.values(this.schemas);
				_.each(schemas, (schema: ISchema) => this.loadSchema(schema).wait());
			}
		}).future<void>()();
	}

	private isSchemaLoaded(schemaId: string): boolean {
		var schemaIds = _.keys(this.loadedSchemas);
		return _.contains(schemaIds, schemaId);
	}

	private loadSchema(schema: ISchema): IFuture<void> {
		return (() => {
			var id = schema.id;
			var extendsProperty = schema.extends;

			if(!this.isSchemaLoaded(id)) {
				if(extendsProperty && extendsProperty.length > 0) {
					_.each(extendsProperty, (ext: ISchemaExtends) => {
						var schemaRef = ext.$ref;
						var extSchema = this.findSchema(schemaRef);

						if(!extSchema) {
							this.$errors.fail("Schema %s not found.", schemaRef);
						}

						this.loadSchema(extSchema).wait();
					});
				}

				this.loadedSchemas[schema.id] = schema;
			}
		}).future<void>()();
	}

	private findSchema(schemaId: string): ISchema {
		return this.schemas[schemaId];
	}
}
$injector.register("jsonSchemaLoader", JsonSchemaLoader);