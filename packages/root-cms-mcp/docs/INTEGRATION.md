# Integrating Root CMS MCP with Root CMS AI

This guide shows how to enhance the Root CMS built-in AI feature with MCP capabilities, allowing the AI assistant to directly interact with your CMS content.

## Overview

The Root CMS AI feature provides an experimental chat interface powered by Vertex AI. By integrating it with the MCP plugin, you can give the AI assistant the ability to:

- Browse and search CMS documents
- Create and edit content
- Publish drafts
- Access schema information
- Perform complex multi-step operations

## Architecture

```
┌─────────────────┐
│   CMS UI Chat   │  (Frontend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI API Endpoint│  (/cms/api/ai.chat)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Vertex AI     │  (Genkit + Gemini)
│   + MCP Tools   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MCP Plugin    │  (Tool execution)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Firestore     │  (CMS data)
└─────────────────┘
```

## Setup

### 1. Enable the AI Feature

In your `root.config.ts`:

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
        location: 'us-central1', // Required for Vertex AI
        // ... other config
      },
      experiments: {
        ai: {
          model: 'vertexai/gemini-2.5-flash', // or other supported models
        },
      },
    }),
    mcpPlugin(),
  ],
});
```

### 2. Enhanced AI System Prompts

The AI feature can now be enhanced to use MCP tools. Here's how to configure it:

```typescript
// In your CMS plugin options
experiments: {
  ai: {
    model: 'vertexai/gemini-2.5-flash',
    systemPrompt: `You are a helpful CMS assistant with access to tools that can:
    - List and browse CMS collections
    - Read document content (drafts and published)
    - Create and update drafts
    - Publish content to production
    - Get schema information
    
    When users ask to view, create, or modify content, use the available MCP tools.
    Always confirm before making changes to published content.`,
  },
}
```

### 3. Using Tool Calling with Gemini

The Gemini 2.5 models support native function calling. You can define MCP tools as Genkit tools:

```typescript
import {defineTool} from 'genkit';
import {SimpleCMSClient} from '@blinkk/root-cms-mcp';

// Example: Define MCP tools for Genkit
const listDocumentsTool = defineTool({
  name: 'list_documents',
  description: 'Lists documents in a CMS collection',
  inputSchema: {
    collection: {type: 'string', description: 'Collection ID'},
    mode: {type: 'string', enum: ['draft', 'published']},
    limit: {type: 'number', optional: true},
  },
  outputSchema: {
    documents: {type: 'array'},
  },
}, async ({collection, mode, limit}) => {
  const cmsClient = new SimpleCMSClient(db, projectId);
  const docs = await cmsClient.listDocs(collection, {mode, limit});
  return {documents: docs};
});
```

## Example Use Cases

### 1. Content Discovery

**User Query in CMS Chat:**
```
"Show me all published blog posts from the last month"
```

**AI Response:**
The AI can use the `list_documents` tool to query the BlogPosts collection and filter results.

### 2. Content Creation

**User Query:**
```
"Create a new blog post about 'Getting Started with Root.js'"
```

**AI Response:**
The AI can:
1. Get the BlogPosts schema using `get_schema` 
2. Generate content based on the schema
3. Save it as a draft using `save_draft`
4. Confirm with the user before publishing

### 3. Batch Operations

**User Query:**
```
"Add a 'featured' tag to all blog posts about 'tutorials'"
```

**AI Response:**
The AI can:
1. List all drafts in BlogPosts
2. Filter those containing "tutorial" in the title or content
3. Update each one to add the 'featured' tag
4. Save the changes

### 4. Content Review

**User Query:**
```
"Review the draft for 'my-new-post' and suggest improvements"
```

**AI Response:**
The AI can:
1. Fetch the draft using `get_document`
2. Analyze the content
3. Provide specific suggestions
4. Optionally apply changes with confirmation

## Advanced: Custom AI Modes

You can create custom AI modes that leverage MCP capabilities:

```typescript
// In your ai.ts or custom AI handler
export type CustomChatMode = 'chat' | 'edit' | 'altText' | 'cms-workflow';

async function buildSystemPrompt(mode: CustomChatMode) {
  if (mode === 'cms-workflow') {
    return `You are a CMS workflow automation assistant.
    
    Available MCP Tools:
    - list_documents: Browse collections
    - get_document: Fetch specific documents
    - save_draft: Create/update drafts
    - publish_document: Publish to production
    - delete_document: Remove content
    - get_schema: View collection schemas
    
    Workflow capabilities:
    - Content migration
    - Bulk updates
    - Automated publishing workflows
    - Schema-based content generation
    
    Always explain what you're about to do and ask for confirmation before making changes.`;
  }
  // ... other modes
}
```

## MCP Tool Integration Patterns

### Pattern 1: Sequential Operations

```typescript
// AI performs multi-step workflow
async function contentWorkflow() {
  // Step 1: Get schema
  const schema = await mcpTool('get_schema', {collection: 'BlogPosts'});
  
  // Step 2: Generate content based on schema
  const content = await generateContent(schema);
  
  // Step 3: Save as draft
  await mcpTool('save_draft', {
    collection: 'BlogPosts',
    slug: 'generated-post',
    fields: content
  });
  
  // Step 4: Confirm and publish
  if (userConfirms) {
    await mcpTool('publish_document', {
      collection: 'BlogPosts',
      slug: 'generated-post'
    });
  }
}
```

### Pattern 2: Parallel Operations

```typescript
// AI performs batch operations in parallel
async function batchUpdate(slugs: string[]) {
  await Promise.all(
    slugs.map(slug => 
      mcpTool('save_draft', {
        collection: 'BlogPosts',
        slug,
        fields: {lastUpdated: new Date().toISOString()}
      })
    )
  );
}
```

### Pattern 3: Error Handling

```typescript
// AI handles errors gracefully
async function safePublish(slug: string) {
  try {
    // Check if draft exists
    const draft = await mcpTool('get_document', {
      collection: 'BlogPosts',
      slug,
      mode: 'draft'
    });
    
    if (!draft) {
      return {error: 'Draft not found'};
    }
    
    // Publish
    await mcpTool('publish_document', {
      collection: 'BlogPosts',
      slug
    });
    
    return {success: true};
  } catch (error) {
    return {error: error.message};
  }
}
```

## Security Considerations

1. **Tool Access Control:** The MCP endpoint requires authentication, so AI tool calls are only available to logged-in users

2. **Confirmation for Destructive Actions:** Always implement confirmation prompts for:
   - Publishing content
   - Deleting documents
   - Batch operations affecting multiple documents

3. **Rate Limiting:** Consider implementing rate limits for AI-driven MCP calls to prevent abuse

4. **Audit Logging:** Log all MCP tool calls made by the AI for accountability:

```typescript
async function logAiToolCall(user: string, tool: string, params: any) {
  await db.collection('AuditLogs').add({
    timestamp: Date.now(),
    user,
    tool,
    params,
    source: 'ai-assistant'
  });
}
```

## Testing

Test your AI + MCP integration:

```typescript
// Example test cases
describe('AI with MCP Tools', () => {
  it('should list documents', async () => {
    const response = await chatClient.sendPrompt(
      [{text: 'List all blog posts'}],
      {mode: 'cms-workflow'}
    );
    expect(response.data).toHaveProperty('documents');
  });
  
  it('should create draft', async () => {
    const response = await chatClient.sendPrompt(
      [{text: 'Create a blog post about testing'}],
      {mode: 'cms-workflow'}
    );
    expect(response.message).toContain('created');
  });
});
```

## Troubleshooting

### AI Not Using Tools

**Problem:** AI responds with text instead of calling MCP tools

**Solution:**
1. Ensure your system prompt explicitly mentions the available tools
2. Use a model that supports function calling (Gemini 2.5+)
3. Define tools with clear descriptions and schemas

### Tools Failing Silently

**Problem:** Tool calls fail but AI doesn't report errors

**Solution:**
1. Implement robust error handling in tool definitions
2. Return structured error responses
3. Log all tool calls and responses

### Performance Issues

**Problem:** AI + MCP responses are slow

**Solution:**
1. Use batch operations where possible
2. Implement caching for frequently accessed schemas
3. Use streaming responses for better UX
4. Optimize Firestore queries with indexes

## Next Steps

- Explore [Genkit documentation](https://firebase.google.com/docs/genkit) for advanced AI features
- Review [MCP specification](https://modelcontextprotocol.io/) for protocol details
- Check [Root CMS AI examples](https://github.com/blinkk/rootjs/tree/main/examples) for reference implementations

## Resources

- [Root.js Documentation](https://rootjs.dev)
- [Genkit Function Calling](https://firebase.google.com/docs/genkit/function-calling)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Gemini Models](https://ai.google.dev/models)
