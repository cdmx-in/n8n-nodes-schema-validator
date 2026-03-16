const esbuild = require('esbuild');
const path = require('path');
const glob = require('glob') || undefined;
const fs = require('fs');

// Find all .ts source files (excluding tests)
const entryPoints = fs.readdirSync('nodes/SchemaValidator/lib', { recursive: true })
	.filter(f => f.endsWith('.ts') && !f.includes('__tests__'))
	.map(f => path.join('nodes/SchemaValidator/lib', f));

entryPoints.push('nodes/SchemaValidator/SchemaValidator.node.ts');
entryPoints.push('nodes/SchemaValidator/types.ts');

esbuild.buildSync({
	entryPoints,
	bundle: true,
	platform: 'node',
	target: 'node18',
	outdir: 'dist',
	outbase: '.',
	format: 'cjs',
	sourcemap: true,
	// Don't bundle n8n-workflow - it's provided by the n8n runtime
	external: ['n8n-workflow'],
});
