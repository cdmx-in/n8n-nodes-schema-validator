/**
 * Parses JSON schema from string or object.
 * @param schemaJson Schema as string or object
 * @returns Parsed schema object
 * @throws Error if JSON is invalid
 */
export function parseSchema(schemaJson: string | object): object {
	if (typeof schemaJson === 'string') {
		try {
			return JSON.parse(schemaJson);
		} catch (error) {
			throw new Error(`Invalid JSON schema format: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return schemaJson;
}

/**
 * Parses multiple schemas from a JSON array string or array of objects.
 * @param schemasJson Schemas as string or array
 * @returns Array of parsed schema objects
 * @throws Error if JSON is invalid
 */
export function parseMultipleSchemas(schemasJson: string | object[]): object[] {
	if (typeof schemasJson === 'string') {
		try {
			const parsed = JSON.parse(schemasJson);
			if (!Array.isArray(parsed)) {
				throw new Error('Expected an array of schemas');
			}
			return parsed;
		} catch (error) {
			throw new Error(`Invalid schemas format: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return schemasJson;
}
