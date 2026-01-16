import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import type Ajv from 'ajv';
import {
	createAjvInstance,
	createValidator,
	extractDataToValidate,
	extractDataFromPath,
	formatValidationErrorMessage,
	isValidJsonSchema,
	parseSchema,
	validateData,
} from './lib';
import type { DataSource, ValidatorOptions, MultiSchemaValidationResult } from './types';

export class SchemaValidator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Schema Validator',
		name: 'schemaValidator',
		icon: 'file:SchemaValidator.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["validationMode"]}}',
		description: 'Validates JSON data against JSON Schema with AJV, supporting formats and custom error messages',
		defaults: {
			name: 'Schema Validator',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
		outputNames: ['Valid', 'Invalid'],
		properties: [
			{
				displayName: 'Validation Mode',
				name: 'validationMode',
				type: 'options',
				options: [
					{
						name: 'Single Schema',
						value: 'single',
						description: 'Validate all items against a single JSON schema',
					},
					{
						name: 'Multiple Schemas',
						value: 'multiple',
						description: 'Validate items against multiple schemas with different configurations',
					},
				],
				default: 'single',
				description: 'Choose validation mode',
			},
			// Single Schema Mode Properties
			{
				displayName: 'JSON Schema',
				name: 'jsonSchema',
				type: 'json',
				default:
					'{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string"\n    },\n    "email": {\n      "type": "string",\n      "format": "email"\n    }\n  },\n  "required": ["name", "email"]\n}',
				description: 'The JSON Schema to validate against. Supports Draft 7 and ajv-formats.',
				required: true,
				displayOptions: {
					show: {
						validationMode: ['single'],
					},
				},
			},
			{
				displayName: 'Data Source',
				name: 'dataSource',
				type: 'options',
				options: [
					{
						name: 'Input Data',
						value: 'entireItem',
						description: 'Validate the JSON data from the input',
					},
					{
						name: 'Custom JSON',
						value: 'customJson',
						description: 'Validate custom JSON data (supports expressions)',
					},
				],
				default: 'entireItem',
				description: 'What data to validate',
				displayOptions: {
					show: {
						validationMode: ['single'],
					},
				},
			},
			{
				displayName: 'Custom JSON',
				name: 'customJson',
				type: 'json',
				default: '',
				placeholder: '={{ $json }}',
				description: 'Custom JSON data to validate (can use expressions)',
				displayOptions: {
					show: {
						dataSource: ['customJson'],
						validationMode: ['single'],
					},
				},
			},
			// Multiple Schemas Mode Properties
			{
				displayName: 'Schemas',
				name: 'schemas',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				placeholder: 'Add Schema',
				description: 'Define multiple schemas for validation',
				displayOptions: {
					show: {
						validationMode: ['multiple'],
					},
				},
				options: [
					{
						name: 'schemaItems',
						displayName: 'Schema',
						values: [
							{
								displayName: 'Schema Name',
								name: 'schemaName',
								type: 'string',
								default: '',
								placeholder: 'user-data',
								description: 'A name to identify this schema in error messages',
								required: true,
							},
							{
								displayName: 'JSON Schema',
								name: 'schema',
								type: 'json',
								default: '{\n  "type": "object",\n  "properties": {}\n}',
								description: 'The JSON Schema definition',
								required: true,
							},
							{
								displayName: 'Data Path',
								name: 'dataPath',
								type: 'string',
								default: '',
								placeholder: 'data.user or leave empty for entire item',
								description: 'JSON path to extract data from (e.g., "data.user" or "items[0]"). Leave empty to validate entire item.',
							},
						],
					},
				],
			},
			{
				displayName: 'Match Mode',
				name: 'matchMode',
				type: 'options',
				options: [
					{
						name: 'All Must Pass',
						value: 'all',
						description: 'Item is valid only if ALL schemas pass',
					},
					{
						name: 'Any Must Pass',
						value: 'any',
						description: 'Item is valid if ANY schema passes',
					},
				],
				default: 'all',
				description: 'How to combine multiple schema validations',
				displayOptions: {
					show: {
						validationMode: ['multiple'],
					},
				},
			},
			// Validator Options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Enable Formats',
						name: 'enableFormats',
						type: 'boolean',
						default: true,
						description: 'Whether to enable ajv-formats for validating formats like email, uri, date, uuid, etc.',
					},
					{
						displayName: 'Enable Custom Errors',
						name: 'enableCustomErrors',
						type: 'boolean',
						default: true,
						description: 'Whether to enable ajv-errors for custom error messages defined in schema',
					},
					{
						displayName: 'Strict Mode',
						name: 'strictMode',
						type: 'boolean',
						default: true,
						description: 'Whether to enable strict schema validation',
					},
					{
						displayName: 'All Errors',
						name: 'allErrors',
						type: 'boolean',
						default: true,
						description: 'Whether to collect all errors instead of stopping at first error',
					},
					{
						displayName: 'Coerce Types',
						name: 'coerceTypes',
						type: 'boolean',
						default: true,
						description: 'Whether to coerce data types (e.g., convert strings to numbers) during validation',
					},
					{
						displayName: 'Allow Union Types',
						name: 'allowUnionTypes',
						type: 'boolean',
						default: true,
						description: 'Whether to allow union types with type coercion',
					},
					{
						displayName: 'Include Error Details',
						name: 'includeErrorDetails',
						type: 'boolean',
						default: true,
						description: 'Whether to include detailed error information in the output',
					},
					{
						displayName: 'Include Original Data',
						name: 'includeOriginalData',
						type: 'boolean',
						default: false,
						description: 'Whether to include the original input data in the output',
					},
				],
			},
		],
	};

	/**
	 * Executes the JSON Schema validation for each input item.
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const validItems: INodeExecutionData[] = [];
		const invalidItems: INodeExecutionData[] = [];

		const validationMode = this.getNodeParameter('validationMode', 0) as string;
		const options = this.getNodeParameter('options', 0, {}) as {
			enableFormats?: boolean;
			enableCustomErrors?: boolean;
			strictMode?: boolean;
			allErrors?: boolean;
			coerceTypes?: boolean;
			allowUnionTypes?: boolean;
			includeErrorDetails?: boolean;
			includeOriginalData?: boolean;
		};

		// Create AJV instance with configured options
		const validatorOptions: ValidatorOptions = {
			allErrors: options.allErrors !== false,
			strict: options.strictMode !== false,
			verbose: true,
			useFormats: options.enableFormats !== false,
			useCustomErrors: options.enableCustomErrors !== false,
			allowUnionTypes: options.allowUnionTypes !== false,
			coerceTypes: options.coerceTypes !== false,
		};

		const ajv = createAjvInstance(validatorOptions);

		if (validationMode === 'single') {
			executeSingleSchemaMode(this, items, validItems, invalidItems, ajv, options);
		} else {
			executeMultipleSchemaMode(this, items, validItems, invalidItems, ajv, options);
		}

		return [validItems, invalidItems];
	}
}

/**
 * Executes single schema validation mode.
 */
function executeSingleSchemaMode(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	validItems: INodeExecutionData[],
	invalidItems: INodeExecutionData[],
	ajv: Ajv,
	options: { includeErrorDetails?: boolean; includeOriginalData?: boolean },
): void {
	const schemaJson = context.getNodeParameter('jsonSchema', 0) as string;
	const dataSource = context.getNodeParameter('dataSource', 0) as DataSource;

	let schema: object;
	try {
		schema = parseSchema(schemaJson);
		const validationResult = isValidJsonSchema(schema, ajv);
		if (!validationResult.isValid) {
			throw new Error(
				`Invalid JSON Schema: ${validationResult.error || 'Unknown error'}`,
			);
		}
	} catch (error) {
		throw new NodeOperationError(context.getNode(), error as Error);
	}

	const validator = createValidator(schema, ajv);

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		const item = items[itemIndex];

		try {
			const customJsonParam =
				dataSource === 'customJson'
					? (context.getNodeParameter('customJson', itemIndex) as string)
					: undefined;

			const dataToValidate = extractDataToValidate(item, dataSource, customJsonParam);
			const result = validateData(validator, dataToValidate);

			if (result.isValid) {
				validItems.push({
					...item,
					pairedItem: itemIndex,
				});
			} else {
				const errorMessage = formatValidationErrorMessage(result.errors);
				const outputItem: INodeExecutionData = {
					json: options.includeOriginalData
						? {
								...item.json,
								validationErrors: options.includeErrorDetails !== false ? result.errors : undefined,
								validationMessage: errorMessage,
							}
						: {
								validationErrors: options.includeErrorDetails !== false ? result.errors : undefined,
								validationMessage: errorMessage,
							},
					pairedItem: itemIndex,
				};
				if (options.includeOriginalData && item.binary) {
					outputItem.binary = item.binary;
				}
				invalidItems.push(outputItem);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const errorJson = options.includeOriginalData
				? {
						...item.json,
						validationErrors: [{ field: '/', message: errorMessage, keyword: 'parse', params: {} }],
						validationMessage: errorMessage,
					}
				: {
						validationErrors: [{ field: '/', message: errorMessage, keyword: 'parse', params: {} }],
						validationMessage: errorMessage,
					};
			invalidItems.push({
				json: errorJson,
				pairedItem: itemIndex,
			});
		}
	}
}

/**
 * Executes multiple schema validation mode.
 */
function executeMultipleSchemaMode(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	validItems: INodeExecutionData[],
	invalidItems: INodeExecutionData[],
	ajv: Ajv,
	options: { includeErrorDetails?: boolean; includeOriginalData?: boolean },
): void {
	const schemasParam = context.getNodeParameter('schemas', 0) as {
		schemaItems?: Array<{
			schemaName: string;
			schema: string;
			dataPath?: string;
		}>;
	};
	const matchMode = context.getNodeParameter('matchMode', 0) as 'all' | 'any';

	const schemas = schemasParam.schemaItems || [];

	if (schemas.length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'At least one schema is required in multiple schemas mode',
		);
	}

	// Parse and compile all schemas
	const compiledSchemas = schemas.map((schemaItem, index) => {
		try {
			const schema = parseSchema(schemaItem.schema);
			const validationResult = isValidJsonSchema(schema, ajv);
			if (!validationResult.isValid) {
				throw new Error(
					`Invalid JSON Schema "${schemaItem.schemaName || `Schema ${index + 1}`}": ${validationResult.error || 'Unknown error'}`,
				);
			}
			return {
				name: schemaItem.schemaName || `Schema ${index + 1}`,
				validator: createValidator(schema, ajv),
				dataPath: schemaItem.dataPath || '',
			};
		} catch (error) {
			throw new NodeOperationError(
				context.getNode(),
				`Error compiling schema "${schemaItem.schemaName || `Schema ${index + 1}`}": ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	});

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		const item = items[itemIndex];
		const schemaResults: MultiSchemaValidationResult[] = [];

		for (const compiledSchema of compiledSchemas) {
			try {
				let dataToValidate: unknown;

				if (compiledSchema.dataPath) {
					dataToValidate = extractDataFromPath(item, compiledSchema.dataPath);
					if (dataToValidate === undefined) {
						schemaResults.push({
							schemaName: compiledSchema.name,
							isValid: false,
							errors: [{
								field: compiledSchema.dataPath,
								message: `Path "${compiledSchema.dataPath}" not found in item`,
								keyword: 'path',
								params: { path: compiledSchema.dataPath },
							}],
						});
						continue;
					}
				} else {
					dataToValidate = item.json;
				}

				const result = validateData(compiledSchema.validator, dataToValidate);
				schemaResults.push({
					schemaName: compiledSchema.name,
					isValid: result.isValid,
					errors: result.errors,
				});
			} catch (error) {
				schemaResults.push({
					schemaName: compiledSchema.name,
					isValid: false,
					errors: [{
						field: '/',
						message: error instanceof Error ? error.message : String(error),
						keyword: 'parse',
						params: {},
					}],
				});
			}
		}

		// Determine overall validity based on match mode
		const isItemValid = matchMode === 'all'
			? schemaResults.every(r => r.isValid)
			: schemaResults.some(r => r.isValid);

		if (isItemValid) {
			validItems.push({
				...item,
				pairedItem: itemIndex,
			});
		} else {
			const failedSchemas = schemaResults.filter(r => !r.isValid);
			const errorMessages = failedSchemas.map(
				r => `[${r.schemaName}] ${formatValidationErrorMessage(r.errors)}`
			).join('; ');

			const outputItem: INodeExecutionData = {
				json: options.includeOriginalData
					? {
							...item.json,
							validationResults: options.includeErrorDetails !== false ? schemaResults : undefined,
							validationMessage: errorMessages,
						}
					: {
							validationResults: options.includeErrorDetails !== false ? schemaResults : undefined,
							validationMessage: errorMessages,
						},
				pairedItem: itemIndex,
			};
			if (options.includeOriginalData && item.binary) {
				outputItem.binary = item.binary;
			}
			invalidItems.push(outputItem);
		}
	}
}

export default SchemaValidator;

