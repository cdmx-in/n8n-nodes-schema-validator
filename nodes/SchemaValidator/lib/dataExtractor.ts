import type { INodeExecutionData } from 'n8n-workflow';
import type { DataSource } from '../types';

/**
 * Extracts data to validate from custom JSON parameter.
 * @param customJsonParam Custom JSON string or object
 * @returns Parsed data
 * @throws Error if JSON is invalid
 */
export function extractCustomJsonData(customJsonParam: string | object): unknown {
	if (typeof customJsonParam === 'string') {
		try {
			return JSON.parse(customJsonParam);
		} catch (error) {
			throw new Error(`Invalid custom JSON: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return customJsonParam;
}

/**
 * Determines what data to validate based on data source.
 * @param item Input item
 * @param dataSource Data source type
 * @param customJsonParam Custom JSON parameter (required if dataSource is 'customJson')
 * @returns Data to validate
 */
export function extractDataToValidate(
	item: INodeExecutionData,
	dataSource: DataSource,
	customJsonParam?: string | object,
): unknown {
	if (dataSource === 'customJson') {
		if (!customJsonParam) {
			throw new Error('Custom JSON is required when Data Source is "Custom JSON"');
		}
		return extractCustomJsonData(customJsonParam);
	}
	return item.json;
}

/**
 * Extracts data from a specific JSON path within the item.
 * @param item Input item
 * @param path JSON path (e.g., 'data.user' or 'items[0]')
 * @returns Extracted data or undefined if path doesn't exist
 */
export function extractDataFromPath(item: INodeExecutionData, path: string): unknown {
	const parts = path.split('.').flatMap(part => {
		// Handle array notation like 'items[0]'
		const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
		if (arrayMatch) {
			return [arrayMatch[1], parseInt(arrayMatch[2], 10)];
		}
		return part;
	});

	let current: unknown = item.json;
	for (const part of parts) {
		if (current === null || current === undefined) {
			return undefined;
		}
		if (typeof part === 'number') {
			if (!Array.isArray(current)) {
				return undefined;
			}
			current = current[part];
		} else {
			if (typeof current !== 'object') {
				return undefined;
			}
			current = (current as Record<string, unknown>)[part];
		}
	}
	return current;
}
