# @blinkk/root-cms-mcp

MCP (Model Context Protocol) server for Root CMS, enabling AI agents and developers to interact with Root CMS programmatically.

## Features

- **Resources**: Access CMS documents, collections, and schemas
- **Tools**: Create, update, delete, query, and publish documents
- **Prompts**: Templates for common CMS operations
- **Firebase Integration**: Built on Firebase Admin SDK
- **TypeScript**: Fully typed for excellent developer experience

## Installation

```bash
npm install @blinkk/root-cms-mcp
# or
pnpm add @blinkk/root-cms-mcp
```

## Usage

### As a Standalone Server

```bash
# Set environment variables
export FIREBASE_PROJECT_ID="your-firebase-project"
export CMS_PROJECT_ID="your-cms-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

# Run the server
npx root-cms-mcp
```

### Programmatic Usage

```typescript
import {RootCMSMCPServer} from '@blinkk/root-cms-mcp';

const server = new RootCMSMCPServer({
  projectId: 'your-firebase-project',
  cmsProjectId: 'your-cms-project-id',
  credentialsPath: '/path/to/credentials.json',
});

await server.run();
```

## MCP Resources

### Available Resources

- `cms://documents` - List all CMS documents
- `cms://collections` - List all collections
- `cms://schemas` - Get all collection schemas
- `cms://collection/{name}` - Get documents in a specific collection
- `cms://doc/{collection}/{slug}` - Get a specific document

### Example

```typescript
// In an MCP client
const docs = await client.readResource('cms://documents');
const pages = await client.readResource('cms://collection/Pages');
const homePage = await client.readResource('cms://doc/Pages/home');
```

## MCP Tools

### create_document

Create a new CMS document.

```typescript
await client.callTool('create_document', {
  collection: 'Pages',
  slug: 'about-us',
  fields: {
    title: 'About Us',
    content: '...',
  },
  mode: 'draft',
});
```

### update_document

Update an existing document.

```typescript
await client.callTool('update_document', {
  collection: 'Pages',
  slug: 'about-us',
  fields: {
    title: 'About Our Company',
  },
});
```

### delete_document

Delete a document.

```typescript
await client.callTool('delete_document', {
  collection: 'Pages',
  slug: 'old-page',
});
```

### query_documents

Query documents in a collection.

```typescript
await client.callTool('query_documents', {
  collection: 'BlogPosts',
  mode: 'published',
  limit: 10,
});
```

### publish_document

Publish a draft document.

```typescript
await client.callTool('publish_document', {
  collection: 'Pages',
  slug: 'new-feature',
});
```

### get_schema

Get the schema for a collection.

```typescript
await client.callTool('get_schema', {
  collection: 'Pages',
});
```

## MCP Prompts

### create_page

Template for creating a new page with common modules.

```typescript
await client.getPrompt('create_page', {
  title: 'Our Services',
  slug: 'services',
});
```

### create_blog_post

Template for creating a blog post.

```typescript
await client.getPrompt('create_blog_post', {
  title: 'New Product Launch',
  author: 'John Doe',
});
```

### optimize_seo

Generate SEO optimization suggestions.

```typescript
await client.getPrompt('optimize_seo', {
  collection: 'Pages',
  slug: 'home',
});
```

## Environment Variables

- `FIREBASE_PROJECT_ID` - Firebase project ID (required)
- `CMS_PROJECT_ID` - Root CMS project ID (default: "default")
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase credentials JSON
- `FIRESTORE_DATABASE_ID` - Firestore database ID (optional)

## Configuration

### MCP Client Configuration

To use this server with Claude Desktop or other MCP clients, add to your MCP settings:

```json
{
  "mcpServers": {
    "root-cms": {
      "command": "npx",
      "args": ["@blinkk/root-cms-mcp"],
      "env": {
        "FIREBASE_PROJECT_ID": "your-project-id",
        "CMS_PROJECT_ID": "your-cms-id",
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

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

## API Reference

See [TypeScript definitions](./src/types.ts) for complete API documentation.

## License

MIT
