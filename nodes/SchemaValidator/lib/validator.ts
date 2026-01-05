import Ajv, { type ValidateFunction, type Options } from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import type { ValidationError, ValidationResult, ValidatorOptions } from '../types';

/**
 * Creates and configures an AJV instance with optional formats and custom errors.
 * @param options Validator options
 * @returns Configured AJV instance
 */
export function createAjvInstance(options: ValidatorOptions): Ajv {
	const ajvOptions: Options = {
		allErrors: options.allErrors,
		strict: options.strict,
		verbose: options.verbose,
	};

	const ajv = new Ajv(ajvOptions);

	// Add ajv-formats support for format validations like email, uri, date, etc.
	if (options.useFormats) {
		addFormats(ajv);
	}

	// Add ajv-errors support for custom error messages
	if (options.useCustomErrors) {
		ajvErrors(ajv);
	}

	return ajv;
}

/**
 * Default AJV instance with formats and custom errors enabled.
 */
const defaultAjv = createAjvInstance({
	allErrors: true,
	strict: true,
	verbose: true,
	useFormats: true,
	useCustomErrors: true,
});

/**
 * Validates if a schema is a valid JSON Schema.
 * @param schema Schema object to validate
 * @param ajvInstance Optional custom AJV instance
 * @returns Object with isValid flag and optional error message
 */
export function isValidJsonSchema(
	schema: object,
	ajvInstance: Ajv = defaultAjv
): { isValid: boolean; error?: string } {
	try {
		ajvInstance.compile(schema);
		return { isValid: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return { isValid: false, error: errorMessage };
	}
}

/**
 * Creates AJV validator instance for a schema.
 * @param schema JSON schema object
 * @param ajvInstance Optional custom AJV instance
 * @returns Compiled validator function
 */
export function createValidator(
	schema: object,
	ajvInstance: Ajv = defaultAjv
): ValidateFunction {
	return ajvInstance.compile(schema);
}

/**
 * Transforms AJV errors to validation error format.
 * @param validator AJV validator with errors
 * @returns Array of validation errors
 */
export function transformValidationErrors(validator: ValidateFunction): ValidationError[] {
	return (
		validator.errors?.map((err) => ({
			field: err.instancePath || '/',
			message: err.message || 'Validation failed',
			keyword: err.keyword,
			params: err.params || {},
		})) || []
	);
}

/**
 * Validates data against compiled validator.
 * @param validator Compiled AJV validator
 * @param data Data to validate
 * @returns Validation result with errors if any
 */
export function validateData(validator: ValidateFunction, data: unknown): ValidationResult {
	const isValid = validator(data);
	const errors = isValid ? [] : transformValidationErrors(validator);
	return { isValid: Boolean(isValid), errors };
}

/**
 * Formats validation errors into error message.
 * @param errors Validation errors
 * @returns Formatted error message
 */
export function formatValidationErrorMessage(errors: ValidationError[]): string {
	return errors.map((err) => `${err.field}: ${err.message}`).join(', ');
}

/**
 * Gets all supported format names from ajv-formats.
 * @returns Array of format names
 */
export function getSupportedFormats(): string[] {
	return [
		'date',
		'time',
		'date-time',
		'duration',
		'uri',
		'uri-reference',
		'uri-template',
		'url',
		'email',
		'hostname',
		'ipv4',
		'ipv6',
		'regex',
		'uuid',
		'json-pointer',
		'relative-json-pointer',
		'byte',
		'int32',
		'int64',
		'float',
		'double',
		'password',
		'binary',
	];
}
