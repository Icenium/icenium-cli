import * as path from "path";
import temp = require("temp");
import jsonSchemaResolverPath = require("./json-schema-resolver");

export class JsonSchemaLoader implements IJsonSchemaLoader {

	private schemasFolderPath: string = null;
	private schemas: IDictionary<ISchema> = null;
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

		let schemaResolver = this.$injector.resolve(jsonSchemaResolverPath.JsonSchemaResolver, { schemas: this.loadedSchemas });
		this.$injector.register("jsonSchemaResolver", schemaResolver);
	}

	public downloadSchemas(): IFuture<void> {
		return (() => {
			temp.track();
			this.$fs.deleteDirectory(this.schemasFolderPath).wait();
			this.$fs.createDirectory(this.schemasFolderPath).wait();

			let filePath = temp.path({suffix: ".zip"});
			let file = this.$fs.createWriteStream(filePath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");

			let schemasEndpoint = `http://${this.$config.AB_SERVER}/appbuilder/Resources/Files/Schemas.zip`;
			this.$httpClient.httpRequest({ url: schemasEndpoint, pipeTo: file}).wait();
			fileEnd.wait();

			this.$fs.unzip(filePath, this.schemasFolderPath).wait();
		}).future<void>()();
	}

	private loadSchemas(): IFuture<void> {
		return (() => {
			if(this.$fs.exists(this.schemasFolderPath).wait()) {

				let fileNames = this.$fs.readDirectory(this.schemasFolderPath).wait();
				_.each(fileNames, (fileName: string) => {
					if( path.extname(fileName) === ".json") {
						let fullFilePath = path.join(this.schemasFolderPath, fileName);
						let schema = this.$fs.readJson(fullFilePath).wait();
						this.schemas[schema.id] = schema;
					}
				});

				let schemas = _.values(this.schemas);
				_.each(schemas, (schema: ISchema) => this.loadSchema(schema).wait());
			}
		}).future<void>()();
	}

	private isSchemaLoaded(schemaId: string): boolean {
		let schemaIds = _.keys(this.loadedSchemas);
		return _.includes(schemaIds, schemaId);
	}

	private loadSchema(schema: ISchema): IFuture<void> {
		return (() => {
			let id = schema.id;
			let extendsProperty = schema.extends;

			if(!this.isSchemaLoaded(id)) {
				if(extendsProperty && extendsProperty.length > 0) {
					_.each(extendsProperty, (ext: ISchemaExtends) => {
						let schemaRef = ext.$ref;
						let extSchema = this.findSchema(schemaRef);

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
