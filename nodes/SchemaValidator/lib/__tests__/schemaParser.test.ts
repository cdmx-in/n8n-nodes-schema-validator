import { parseSchema, parseMultipleSchemas } from '../schemaParser';

describe('schemaParser', () => {
	describe('parseSchema', () => {
		it('should parse valid JSON string', () => {
			const schemaString = '{"type": "object"}';
			const result = parseSchema(schemaString);

			expect(result).toEqual({ type: 'object' });
		});

		it('should return object as-is when already parsed', () => {
			const schemaObject = { type: 'object', properties: { name: { type: 'string' } } };
			const result = parseSchema(schemaObject);

			expect(result).toEqual(schemaObject);
			expect(result).toBe(schemaObject);
		});

		it('should handle complex schema with nested properties', () => {
			const complexSchema = `{
				"type": "object",
				"properties": {
					"user": {
						"type": "object",
						"properties": {
							"name": { "type": "string" },
							"age": { "type": "number" }
						}
					}
				}
			}`;

			const result = parseSchema(complexSchema);

			expect(result).toEqual({
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							age: { type: 'number' },
						},
					},
				},
			});
		});

		it('should throw error for invalid JSON string', () => {
			const invalidJson = '{"type": "object"';

			expect(() => parseSchema(invalidJson)).toThrow(/Invalid JSON schema format/);
		});

		it('should throw error for malformed JSON', () => {
			const malformedJson = '{type: object}';

			expect(() => parseSchema(malformedJson)).toThrow();
		});
	});

	describe('parseMultipleSchemas', () => {
		it('should parse JSON array string', () => {
			const schemasString = '[{"type": "object"}, {"type": "string"}]';
			const result = parseMultipleSchemas(schemasString);

			expect(result).toEqual([{ type: 'object' }, { type: 'string' }]);
		});

		it('should return array as-is when already parsed', () => {
			const schemasArray = [{ type: 'object' }, { type: 'string' }];
			const result = parseMultipleSchemas(schemasArray);

			expect(result).toEqual(schemasArray);
		});

		it('should throw error for non-array JSON', () => {
			const nonArrayJson = '{"type": "object"}';

			expect(() => parseMultipleSchemas(nonArrayJson)).toThrow(/Expected an array of schemas/);
		});

		it('should throw error for invalid JSON', () => {
			const invalidJson = '[{type: object}]';

			expect(() => parseMultipleSchemas(invalidJson)).toThrow();
		});
	});
});
