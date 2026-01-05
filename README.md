# n8n-nodes-schema-validator

[![npm version](https://badge.fury.io/js/n8n-nodes-schema-validator.svg)](https://www.npmjs.com/package/n8n-nodes-schema-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Advanced JSON Schema validation node for [n8n](https://n8n.io/) workflows. Validate your data against JSON Schema standards with support for multiple schemas, format validation, and custom error messages.

## Features

- ✅ **Single & Multiple Schema Validation** - Validate against one or multiple schemas per item
- 📧 **Format Validation** - Built-in support for email, URI, UUID, date, date-time, IPv4, IPv6, and more via [ajv-formats](https://github.com/ajv-validator/ajv-formats)
- 💬 **Custom Error Messages** - Define custom error messages in your schemas via [ajv-errors](https://github.com/ajv-validator/ajv-errors)
- 🔀 **Dual Output** - Valid items go to one output, invalid items go to another
- 🎯 **Data Path Extraction** - Validate specific parts of your data using JSON paths
- ⚙️ **Configurable Options** - Control strict mode, all errors collection, and more

## Installation

### Community Nodes Installation

1. Go to **Settings** > **Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-schema-validator` in the search field
4. Click **Install**

### Manual Installation

For self-hosted n8n instances:

```bash
npm install n8n-nodes-schema-validator
```

Then restart your n8n instance.

## Usage

### Single Schema Mode

Validate all incoming items against a single JSON schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "number", "minimum": 0 }
  },
  "required": ["name", "email"]
}
```

### Multiple Schemas Mode

Validate different parts of your data against different schemas:

1. Set **Validation Mode** to "Multiple Schemas"
2. Add multiple schema definitions
3. For each schema, specify:
   - **Schema Name**: A descriptive name for error messages
   - **JSON Schema**: The validation schema
   - **Data Path**: Optional path to extract data (e.g., `user.profile` or `items[0]`)

### Match Modes

When using multiple schemas:
- **All Must Pass**: Item is valid only if ALL schemas pass
- **Any Must Pass**: Item is valid if ANY schema passes

### Supported Formats

Thanks to ajv-formats, the following formats are supported:

- `email` - Email addresses
- `uri` / `url` - URIs and URLs
- `uuid` - UUIDs
- `date` - ISO 8601 dates (YYYY-MM-DD)
- `time` - ISO 8601 times
- `date-time` - ISO 8601 date-times
- `ipv4` / `ipv6` - IP addresses
- `hostname` - Hostnames
- `regex` - Regular expressions
- And more...

### Custom Error Messages

Use ajv-errors syntax to define custom messages:

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "errorMessage": {
        "format": "Please provide a valid email address"
      }
    }
  },
  "required": ["email"],
  "errorMessage": {
    "required": {
      "email": "Email address is required"
    }
  }
}
```

## Output

### Valid Items (Output 1)
Items that pass validation are output unchanged.

### Invalid Items (Output 2)
Items that fail validation include:
- `_validationMessage`: Human-readable error summary
- `_validationErrors` (single mode) or `_validationResults` (multiple mode): Detailed error information

## Options

| Option | Default | Description |
|--------|---------|-------------|
| Enable Formats | `true` | Enable ajv-formats for format validation |
| Enable Custom Errors | `true` | Enable ajv-errors for custom messages |
| Strict Mode | `true` | Enable strict schema validation |
| All Errors | `true` | Collect all errors vs. stop at first |
| Include Error Details | `true` | Include detailed errors in output |

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm run lint
```

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
- [JSON Schema Documentation](https://json-schema.org/)
- [AJV JSON Schema Validator](https://ajv.js.org/)
- [AJV Formats](https://github.com/ajv-validator/ajv-formats)
- [AJV Errors](https://github.com/ajv-validator/ajv-errors)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
