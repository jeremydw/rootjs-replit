# @blinkk/root-cms-mcp

## 0.1.0 (2024-11-16)

Initial release of Root CMS MCP server.

### Features

- **MCP Resources**: Access to CMS documents, collections, and schemas
- **MCP Tools**: Complete CRUD operations for CMS documents
  - `create_document` - Create new documents
  - `update_document` - Update existing documents
  - `delete_document` - Delete documents
  - `query_documents` - Query and filter documents
  - `publish_document` - Publish drafts to production
  - `get_schema` - Retrieve collection schemas
- **MCP Prompts**: Templates for common CMS operations
  - `create_page` - Page creation template
  - `create_blog_post` - Blog post template
  - `optimize_seo` - SEO optimization helper
- **Firebase Integration**: Built on Firebase Admin SDK
- **TypeScript Support**: Fully typed API
