import type { INodeExecutionData } from 'n8n-workflow';
import {
	extractCustomJsonData,
	extractDataToValidate,
	extractDataFromPath,
} from '../dataExtractor';

describe('dataExtractor', () => {
	describe('extractCustomJsonData', () => {
		it('should parse JSON string', () => {
			const jsonString = '{"name": "John", "age": 30}';
			const result = extractCustomJsonData(jsonString);

			expect(result).toEqual({ name: 'John', age: 30 });
		});

		it('should return object as-is', () => {
			const jsonObject = { name: 'John', age: 30 };
			const result = extractCustomJsonData(jsonObject);

			expect(result).toEqual(jsonObject);
			expect(result).toBe(jsonObject);
		});

		it('should handle arrays', () => {
			const arrayString = '[1, 2, 3]';
			const result = extractCustomJsonData(arrayString);

			expect(result).toEqual([1, 2, 3]);
		});

		it('should throw error for invalid JSON', () => {
			const invalidJson = '{name: "John"}';

			expect(() => extractCustomJsonData(invalidJson)).toThrow(/Invalid custom JSON/);
		});
	});

	describe('extractDataToValidate', () => {
		const mockItem: INodeExecutionData = {
			json: { id: 1, name: 'Test' },
		};

		it('should extract data from item.json when dataSource is entireItem', () => {
			const result = extractDataToValidate(mockItem, 'entireItem');

			expect(result).toEqual({ id: 1, name: 'Test' });
		});

		it('should extract custom JSON when dataSource is customJson', () => {
			const customJson = '{"custom": "data"}';
			const result = extractDataToValidate(mockItem, 'customJson', customJson);

			expect(result).toEqual({ custom: 'data' });
		});

		it('should extract custom JSON object when already parsed', () => {
			const customJson = { custom: 'data' };
			const result = extractDataToValidate(mockItem, 'customJson', customJson);

			expect(result).toEqual({ custom: 'data' });
		});

		it('should throw error when customJson is required but not provided', () => {
			expect(() => extractDataToValidate(mockItem, 'customJson')).toThrow(
				'Custom JSON is required when Data Source is "Custom JSON"',
			);
		});

		it('should handle array data automatically when input is an array', () => {
			const arrayData = [
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
			];

			const result = extractDataToValidate(mockItem, 'customJson', arrayData);

			expect(result).toEqual([
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
			]);
		});

		it('should handle custom JSON that contains an array', () => {
			const customJsonWithArray = JSON.stringify([
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
			]);

			const result = extractDataToValidate(mockItem, 'customJson', customJsonWithArray);

			expect(result).toEqual([
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
			]);
		});
	});

	describe('extractDataFromPath', () => {
		it('should extract data from simple path', () => {
			const item: INodeExecutionData = {
				json: {
					user: {
						name: 'John',
						age: 30,
					},
				},
			};

			const result = extractDataFromPath(item, 'user');
			expect(result).toEqual({ name: 'John', age: 30 });
		});

		it('should extract data from nested path', () => {
			const item: INodeExecutionData = {
				json: {
					data: {
						user: {
							profile: {
								name: 'John',
							},
						},
					},
				},
			};

			const result = extractDataFromPath(item, 'data.user.profile');
			expect(result).toEqual({ name: 'John' });
		});

		it('should extract data from path with array index', () => {
			const item: INodeExecutionData = {
				json: {
					items: [
						{ id: 1, name: 'First' },
						{ id: 2, name: 'Second' },
					],
				},
			};

			const result = extractDataFromPath(item, 'items[1]');
			expect(result).toEqual({ id: 2, name: 'Second' });
		});

		it('should extract data from complex path with array', () => {
			const item: INodeExecutionData = {
				json: {
					data: {
						users: [
							{ name: 'John', email: 'john@example.com' },
							{ name: 'Jane', email: 'jane@example.com' },
						],
					},
				},
			};

			const result = extractDataFromPath(item, 'data.users[0].name');
			expect(result).toBe('John');
		});

		it('should return undefined for non-existent path', () => {
			const item: INodeExecutionData = {
				json: {
					user: { name: 'John' },
				},
			};

			const result = extractDataFromPath(item, 'user.email');
			expect(result).toBeUndefined();
		});

		it('should return undefined for invalid array index', () => {
			const item: INodeExecutionData = {
				json: {
					items: [{ id: 1 }],
				},
			};

			const result = extractDataFromPath(item, 'items[5]');
			expect(result).toBeUndefined();
		});

		it('should return undefined when accessing array on non-array', () => {
			const item: INodeExecutionData = {
				json: {
					user: { name: 'John' },
				},
			};

			const result = extractDataFromPath(item, 'user[0]');
			expect(result).toBeUndefined();
		});
	});
});
