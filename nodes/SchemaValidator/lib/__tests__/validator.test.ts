import {
	createAjvInstance,
	createValidator,
	formatValidationErrorMessage,
	isValidJsonSchema,
	transformValidationErrors,
	validateData,
	getSupportedFormats,
} from '../validator';
import type { ValidationError } from '../../types';

describe('validator', () => {
	describe('createAjvInstance', () => {
		it('should create AJV instance with default options', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			expect(ajv).toBeDefined();
		});

		it('should create AJV instance without formats', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: false,
				verbose: true,
				useFormats: false,
				useCustomErrors: false,
			});

			expect(ajv).toBeDefined();
		});
	});

	describe('isValidJsonSchema', () => {
		it('should return true for valid JSON Schema', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
			};

			const result = isValidJsonSchema(schema);
			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should return true for complex valid schema', () => {
			const schema = {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							age: { type: 'number' },
						},
						required: ['name'],
					},
				},
			};

			const result = isValidJsonSchema(schema);
			expect(result.isValid).toBe(true);
		});

		it('should return false for invalid schema with wrong type', () => {
			const schema = {
				type: 'invalid-type',
			};

			const result = isValidJsonSchema(schema);
			expect(result.isValid).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('createValidator', () => {
		it('should create validator for simple schema', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
			};

			const validator = createValidator(schema);
			expect(validator).toBeDefined();
			expect(typeof validator).toBe('function');
		});
	});

	describe('validateData', () => {
		it('should validate valid data successfully', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
				required: ['name'],
			};

			const validator = createValidator(schema);
			const result = validateData(validator, { name: 'John' });

			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should return validation errors for invalid data', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
				required: ['name'],
			};

			const validator = createValidator(schema);
			const result = validateData(validator, {});

			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].keyword).toBe('required');
		});

		it('should validate type mismatches', () => {
			const schema = {
				type: 'object',
				properties: {
					age: { type: 'number' },
				},
			};

			const validator = createValidator(schema);
			const result = validateData(validator, { age: 'not a number' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].keyword).toBe('type');
		});
	});

	describe('validateData with formats', () => {
		it('should validate email format', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			const schema = {
				type: 'object',
				properties: {
					email: { type: 'string', format: 'email' },
				},
			};

			const validator = createValidator(schema, ajv);

			// Valid email
			const validResult = validateData(validator, { email: 'test@example.com' });
			expect(validResult.isValid).toBe(true);

			// Invalid email
			const invalidResult = validateData(validator, { email: 'not-an-email' });
			expect(invalidResult.isValid).toBe(false);
			expect(invalidResult.errors[0].keyword).toBe('format');
		});

		it('should validate uuid format', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			const schema = {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
				},
			};

			const validator = createValidator(schema, ajv);

			// Valid UUID
			const validResult = validateData(validator, { id: '550e8400-e29b-41d4-a716-446655440000' });
			expect(validResult.isValid).toBe(true);

			// Invalid UUID
			const invalidResult = validateData(validator, { id: 'not-a-uuid' });
			expect(invalidResult.isValid).toBe(false);
		});

		it('should validate uri format', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			const schema = {
				type: 'object',
				properties: {
					website: { type: 'string', format: 'uri' },
				},
			};

			const validator = createValidator(schema, ajv);

			// Valid URI
			const validResult = validateData(validator, { website: 'https://example.com' });
			expect(validResult.isValid).toBe(true);

			// Invalid URI
			const invalidResult = validateData(validator, { website: 'not-a-uri' });
			expect(invalidResult.isValid).toBe(false);
		});

		it('should validate date format', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			const schema = {
				type: 'object',
				properties: {
					birthDate: { type: 'string', format: 'date' },
				},
			};

			const validator = createValidator(schema, ajv);

			// Valid date
			const validResult = validateData(validator, { birthDate: '2023-12-25' });
			expect(validResult.isValid).toBe(true);

			// Invalid date
			const invalidResult = validateData(validator, { birthDate: '25-12-2023' });
			expect(invalidResult.isValid).toBe(false);
		});
	});

	describe('transformValidationErrors', () => {
		it('should transform AJV errors correctly', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
				required: ['name'],
			};

			const validator = createValidator(schema);
			validator({}); // Trigger validation

			const errors = transformValidationErrors(validator);

			expect(errors).toHaveLength(1);
			expect(errors[0]).toHaveProperty('field');
			expect(errors[0]).toHaveProperty('message');
			expect(errors[0]).toHaveProperty('keyword');
			expect(errors[0]).toHaveProperty('params');
		});
	});

	describe('formatValidationErrorMessage', () => {
		it('should format single error', () => {
			const errors: ValidationError[] = [
				{
					field: '/name',
					message: 'must be string',
					keyword: 'type',
					params: { type: 'string' },
				},
			];

			const result = formatValidationErrorMessage(errors);
			expect(result).toBe('/name: must be string');
		});

		it('should format multiple errors', () => {
			const errors: ValidationError[] = [
				{
					field: '/name',
					message: 'must be string',
					keyword: 'type',
					params: { type: 'string' },
				},
				{
					field: '/age',
					message: 'must be number',
					keyword: 'type',
					params: { type: 'number' },
				},
			];

			const result = formatValidationErrorMessage(errors);
			expect(result).toBe('/name: must be string, /age: must be number');
		});

		it('should return empty string for empty errors', () => {
			const result = formatValidationErrorMessage([]);
			expect(result).toBe('');
		});
	});

	describe('getSupportedFormats', () => {
		it('should return list of supported formats', () => {
			const formats = getSupportedFormats();

			expect(formats).toContain('email');
			expect(formats).toContain('uri');
			expect(formats).toContain('uuid');
			expect(formats).toContain('date');
			expect(formats).toContain('date-time');
			expect(formats).toContain('ipv4');
			expect(formats).toContain('ipv6');
		});
	});

	describe('custom error messages with ajv-errors', () => {
		it('should support custom error messages in schema', () => {
			const ajv = createAjvInstance({
				allErrors: true,
				strict: true,
				verbose: true,
				useFormats: true,
				useCustomErrors: true,
			});

			const schema = {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						minLength: 2,
						errorMessage: {
							type: 'Name must be a string',
							minLength: 'Name must be at least 2 characters',
						},
					},
				},
				required: ['name'],
				errorMessage: {
					required: {
						name: 'Name is required',
					},
				},
			};

			const validator = createValidator(schema, ajv);
			const result = validateData(validator, {});

			expect(result.isValid).toBe(false);
			// The custom error message should be used
			expect(result.errors.some(e => e.message === 'Name is required')).toBe(true);
		});
	});
});
