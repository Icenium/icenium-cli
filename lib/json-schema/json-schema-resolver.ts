export class JsonSchemaResolver implements IJsonSchemaResolver {
	private schemasCache: IDictionary<any>;

	constructor(private schemas: ISchema[],
		private $errors: IErrors) {
		this.schemasCache = Object.create(null);
	}

	public getSchema(schemaId: string): ISchema {
		if (!this.schemasCache[schemaId]) {
			this.schemasCache[schemaId] = this.findSchema(schemaId);

			if (!this.schemasCache[schemaId]) {
				this.$errors.fail("Unable to find schema with id %s.", schemaId);
			}

			let extendsProperty = this.schemasCache[schemaId].extends;
			if (extendsProperty) {
				this.schemasCache[schemaId].extends = {};
				this.schemasCache[schemaId].extends.properties = Object.create(null);

				this.buildValidationSchema(extendsProperty, schemaId);
			}
		}

		return this.schemasCache[schemaId];
	}

	private buildValidationSchema(extendsProperty: ISchemaExtends[], schemaId: string): void {
		_.each(extendsProperty, (ext: ISchemaExtends) => {
			let refSchema = this.findSchema(ext.$ref);
			if (refSchema && refSchema.properties) {
				_.each(_.keys(refSchema.properties), (propertyName: string) => {
					if (!this.schemasCache[schemaId].extends.properties[propertyName]) {
						this.schemasCache[schemaId].extends.properties[propertyName] = refSchema.properties[propertyName];
					}
				});
			}
			if (refSchema.extends) {
				this.buildValidationSchema(refSchema.extends, schemaId);
			}
		});
	}

	private findSchema(schemaId: string): ISchema {
		return _.find(this.schemas, (s: ISchema) => s.id === schemaId);
	}
}

$injector.register("jsonSchemaResolver", JsonSchemaResolver);
