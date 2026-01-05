/**
 * Validation error details from AJV.
 */
export interface ValidationError {
	field: string;
	message: string;
	keyword: string;
	params: Record<string, unknown>;
}

/**
 * Result of schema validation.
 */
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

/**
 * Data source options for validation.
 */
export type DataSource = 'entireItem' | 'customJson';

/**
 * Schema definition for multi-schema validation.
 */
export interface SchemaDefinition {
	name: string;
	schema: object;
	dataSource: DataSource;
	customJsonPath?: string;
}

/**
 * Multi-schema validation result.
 */
export interface MultiSchemaValidationResult {
	schemaName: string;
	isValid: boolean;
	errors: ValidationError[];
}

/**
 * Options for the AJV validator.
 */
export interface ValidatorOptions {
	allErrors: boolean;
	strict: boolean;
	verbose: boolean;
	useFormats: boolean;
	useCustomErrors: boolean;
}
