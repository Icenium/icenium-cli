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

		this.loadSchemas();

		let schemaResolver = this.$injector.resolve(jsonSchemaResolverPath.JsonSchemaResolver, { schemas: this.loadedSchemas });
		this.$injector.register("jsonSchemaResolver", schemaResolver);
	}

	public async downloadSchemas(): Promise<void> {
		temp.track();
		this.$fs.deleteDirectory(this.schemasFolderPath);
		this.$fs.createDirectory(this.schemasFolderPath);

		let filePath = temp.path({ suffix: ".zip" });
		let file = this.$fs.createWriteStream(filePath);
		let fileEnd = this.$fs.futureFromEvent(file, "finish");

		let schemasEndpoint = `http://${this.$config.AB_SERVER}/appbuilder/Resources/Files/Schemas.zip`;
		await this.$httpClient.httpRequest({ url: schemasEndpoint, pipeTo: file });
		await fileEnd;

		await this.$fs.unzip(filePath, this.schemasFolderPath);
	}

	private loadSchemas(): void {
		if (this.$fs.exists(this.schemasFolderPath)) {

			let fileNames = this.$fs.readDirectory(this.schemasFolderPath);
			_.each(fileNames, (fileName: string) => {
				if (path.extname(fileName) === ".json") {
					let fullFilePath = path.join(this.schemasFolderPath, fileName);
					let schema = this.$fs.readJson(fullFilePath);
					this.schemas[schema.id] = schema;
				}
			});

			let schemas = _.values(this.schemas);
			_.each(schemas, (schema: ISchema) => this.loadSchema(schema));
		}
	}

	private isSchemaLoaded(schemaId: string): boolean {
		let schemaIds = _.keys(this.loadedSchemas);
		return _.includes(schemaIds, schemaId);
	}

	private loadSchema(schema: ISchema): void {
		let id = schema.id;
		let extendsProperty = schema.extends;

		if (!this.isSchemaLoaded(id)) {
			if (extendsProperty && extendsProperty.length > 0) {
				_.each(extendsProperty, (ext: ISchemaExtends) => {
					let schemaRef = ext.$ref;
					let extSchema = this.findSchema(schemaRef);

					if (!extSchema) {
						this.$errors.fail("Schema %s not found.", schemaRef);
					}

					this.loadSchema(extSchema);
				});
			}

			this.loadedSchemas[schema.id] = schema;
		}
	}

	private findSchema(schemaId: string): ISchema {
		return this.schemas[schemaId];
	}
}

$injector.register("jsonSchemaLoader", JsonSchemaLoader);
