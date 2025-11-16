# @blinkk/root-cms-mcp

A Root.js plugin that adds **Model Context Protocol (MCP)** endpoints to your Root CMS, enabling AI-powered features like intelligent page builders, automated content workflows, and change management.

## Features

- 🔌 **Plugin Architecture**: Integrates seamlessly as a Root.js plugin - no separate server needed
- 🔐 **Secure**: Uses your existing Firebase credentials from the CMS plugin
- 🤖 **AI-Ready**: Exposes CMS operations through the MCP protocol for AI assistants
- 📦 **Minimal Dependencies**: Lightweight with only essential dependencies
- 🚀 **Zero Configuration**: Works out of the box with your existing CMS setup

## Installation

```bash
npm install @blinkk/root-cms-mcp
# or
pnpm add @blinkk/root-cms-mcp
```

## Usage

Add the MCP plugin to your `root.config.ts` file alongside your CMS plugin:

```typescript
import {defineConfig} from '@blinkk/root';
import {cmsPlugin} from '@blinkk/root-cms';
import {mcpPlugin} from '@blinkk/root-cms-mcp';

export default defineConfig({
  plugins: [
    cmsPlugin({
      id: 'my-project',
      firebaseConfig: {
        projectId: 'your-firebase-project',
        // ... other Firebase config
      },
    }),
    mcpPlugin(), // Add the MCP plugin
  ],
});
```

That's it! The MCP endpoint will be available at `/mcp/message` on your Root.js server.

## Configuration

### Plugin Options

```typescript
mcpPlugin({
  path: '/mcp', // Optional: customize the endpoint path (default: '/mcp')
})
```

## MCP Capabilities

The plugin exposes three types of MCP capabilities:

### Resources

Browse CMS data through the MCP protocol:

- `rootcms://documents/{collection}?mode=draft|published` - Browse documents in a collection
- `rootcms://collections` - List all collections
- `rootcms://schemas/{collection}` - Get collection schema

### Tools

Perform CMS operations:

- `get_document` - Retrieve a document
- `list_documents` - List documents in a collection
- `save_draft` - Create or update a draft document
- `publish_document` - Publish a draft to production
- `delete_document` - Remove a document
- `list_collections` - Get all collections
- `get_schema` - Retrieve collection schema

### Prompts

Pre-configured templates for common tasks:

- `create-page` - Guide for creating new pages
- `review-changes` - Template for reviewing content changes

## Authentication

**Important**: The MCP endpoint requires authentication. Only logged-in CMS users can access the endpoint. This is enforced automatically by the plugin using the same authentication system as the CMS.

When accessing the endpoint, you must:
1. Be authenticated via the CMS login system
2. Have a valid session cookie
3. Be authorized to access the CMS (via the CMS plugin's `isUserAuthorized` callback if configured)

## Using with AI Assistants

The MCP endpoint is designed to be accessed by authenticated users through their browsers or authenticated API clients. Because it requires CMS authentication, direct integration with standalone MCP clients (like Claude Desktop) may require additional proxy setup to handle authentication.

For local development with authenticated access:

```typescript
// Example: Make authenticated requests to the MCP endpoint
const response = await fetch('http://localhost:3000/mcp/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Include your session cookie here
  },
  credentials: 'include',
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'list_documents',
      arguments: {collection: 'Pages', mode: 'draft'},
    },
  }),
});
```

## API Reference

### POST /mcp/message

The main MCP endpoint accepts JSON-RPC 2.0 requests:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_documents",
    "arguments": {
      "collection": "BlogPosts",
      "mode": "draft",
      "limit": 10
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 5 documents..."
      }
    ]
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm run build

# Watch mode for development
pnpm run dev
```

## How It Works

1. The plugin integrates with your existing CMS plugin to access Firebase/Firestore
2. It adds an HTTP endpoint (`/mcp/message`) to your Root.js server
3. The endpoint implements the Model Context Protocol (JSON-RPC 2.0)
4. AI assistants can send requests to this endpoint to interact with your CMS

## Architecture

- **SimpleCMSClient**: Lightweight Firestore client that works directly with the database
- **MCP Server**: Handles MCP protocol communication
- **Resources/Tools/Prompts**: Implement specific CMS capabilities
- **Plugin Integration**: Seamlessly connects with Root.js and CMS plugin

## Use Cases

### AI-Powered Content Creation

Use AI agents to:
- Create pages from design files
- Generate blog posts from outlines
- Populate CMS content from Google Docs
- Optimize SEO metadata

### Automation

- Bulk import content from external sources
- Automated content publishing workflows
- Schema validation and migration
- Content auditing and cleanup

### Development

- Build custom CMS integrations
- Create content management tools
- Automate testing with CMS data
- Generate documentation from schemas

## Documentation

- **[Using with Replit Agent](./docs/REPLIT_AGENT.md)** - Complete guide for integrating with Replit's AI Agent and MCP clients
- **[AI Integration Guide](./docs/INTEGRATION.md)** - Enhance Root CMS AI features with MCP tool-calling capabilities

## Requirements

- Root.js project with `@blinkk/root-cms` configured
- Firebase/Firestore backend
- Node.js 18 or higher

## Examples

### Quick Start with Replit Agent

```typescript
// 1. Configure your root.config.ts
import {defineConfig} from '@blinkk/root';
import {cmsPlugin} from '@blinkk/root-cms';
import {mcpPlugin} from '@blinkk/root-cms-mcp';

export default defineConfig({
  plugins: [
    cmsPlugin({id: 'my-project', firebaseConfig: {...}}),
    mcpPlugin(),
  ],
});

// 2. Start your server
// pnpm run dev

// 3. Log into CMS and get your session cookie
// Navigate to http://localhost:3000/cms/login
// Open DevTools → Application → Cookies → copy 'root-session' value

// 4. Use Replit Agent with authentication
// Ask: "Make a POST request to http://localhost:3000/mcp/message
//       with Cookie header: root-session=<your-cookie>
//       and this JSON body: {jsonrpc:'2.0', id:1, method:'tools/call',
//       params:{name:'list_documents', arguments:{collection:'BlogPosts'}}}"
```

**Note:** The endpoint requires authentication. See the [Replit Agent Guide](./docs/REPLIT_AGENT.md) for detailed authentication methods.

### Enhancing Root CMS AI

```typescript
// Enable AI with MCP capabilities
cmsPlugin({
  // ... other config
  experiments: {
    ai: {
      model: 'vertexai/gemini-2.5-flash',
      systemPrompt: `You are a CMS assistant with access to MCP tools.
      You can list documents, create drafts, publish content, and more.`
    }
  }
})
```

See the [Integration Guide](./docs/INTEGRATION.md) for detailed examples.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR on the [Root.js repository](https://github.com/blinkk/rootjs).
