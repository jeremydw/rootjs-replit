# Using Root CMS MCP with Replit Agent

This guide explains how to use the Root CMS MCP plugin with Replit's AI Agent to build powerful CMS-driven applications.

## Overview

The Root CMS MCP plugin exposes your CMS content and operations through the Model Context Protocol, allowing Replit Agent (and other MCP-compatible AI assistants) to:

- **Browse and read** your CMS documents and collections
- **Create and edit** draft content
- **Publish** content to production
- **Get schema information** about your content types
- **Generate content** based on your existing schemas

## Setup

### 1. Install and Configure the Plugin

First, add the MCP plugin to your Root.js project:

```bash
pnpm add @blinkk/root-cms-mcp
```

Then update your `root.config.ts`:

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
        // ... your Firebase config
      },
    }),
    mcpPlugin({
      path: '/mcp', // Optional: customize endpoint path
    }),
  ],
});
```

### 2. Start Your Development Server

```bash
pnpm run dev
```

Your MCP endpoint will be available at `http://localhost:3000/mcp/message` (or your configured port).

## Using with Replit Agent

### Understanding Authentication

The MCP endpoint at `/mcp/message` **requires CMS authentication**. Replit Agent executes requests from the workspace environment and **does not automatically inherit your browser cookies**. This means you need to explicitly provide authentication credentials with each request.

### Method 1: Using Session Cookies (Development)

**Step 1: Get Your Session Cookie**

1. Start your Root.js dev server (`pnpm run dev`)
2. Log into your CMS at `http://localhost:3000/cms/login` in your browser
3. Open browser DevTools (F12) → Application → Cookies
4. Copy the value of the `root-session` cookie

**Step 2: Use the Cookie with Replit Agent**

Ask Replit Agent to make authenticated requests by including the cookie:

```
I have an authenticated MCP server at http://localhost:3000/mcp/message.

Please make a POST request with these headers:
- Content-Type: application/json
- Cookie: root-session=<paste-your-cookie-value-here>

Body:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_documents",
    "arguments": {
      "collection": "BlogPosts",
      "mode": "draft"
    }
  }
}
```

**Note:** Session cookies expire after 5 days. You'll need to re-login and get a fresh cookie when it expires.

### Method 2: Browser-Based MCP Client (Easiest)

Since the endpoint requires browser authentication, the easiest way to use it is through a browser-based MCP client or directly from your browser's dev console:

```javascript
// Run this in your browser's console (while logged into CMS)
async function callMCP(method, params) {
  const response = await fetch('http://localhost:3000/mcp/message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include', // Include cookies automatically
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });
  return response.json();
}

// Example: List documents
const result = await callMCP('tools/call', {
  name: 'list_documents',
  arguments: {collection: 'BlogPosts', mode: 'draft'}
});
console.log(result);
```

### Method 3: Localhost Proxy (Advanced)

Create a simple proxy that handles authentication:

```typescript
// proxy-server.ts
import express from 'express';

const app = express();
app.use(express.json());

const SESSION_COOKIE = 'root-session=your-session-cookie-value';

app.post('/mcp/*', async (req, res) => {
  const response = await fetch('http://localhost:3000' + req.path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': SESSION_COOKIE
    },
    body: JSON.stringify(req.body)
  });
  res.json(await response.json());
});

app.listen(3001, () => console.log('Proxy on :3001'));
```

Then ask Replit Agent to use `http://localhost:3001/mcp/message` instead.

## Available MCP Capabilities

### Resources

Browse CMS data:

```javascript
// List all documents in a collection
{
  "method": "resources/read",
  "params": {
    "uri": "rootcms://documents/BlogPosts?mode=draft"
  }
}

// List all collections
{
  "method": "resources/read",
  "params": {
    "uri": "rootcms://collections"
  }
}

// Get a collection schema
{
  "method": "resources/read",
  "params": {
    "uri": "rootcms://schemas/BlogPosts"
  }
}
```

### Tools

Perform CMS operations:

```javascript
// Get a specific document
{
  "method": "tools/call",
  "params": {
    "name": "get_document",
    "arguments": {
      "collection": "BlogPosts",
      "slug": "my-first-post",
      "mode": "draft"
    }
  }
}

// Create/update a draft
{
  "method": "tools/call",
  "params": {
    "name": "save_draft",
    "arguments": {
      "collection": "BlogPosts",
      "slug": "new-post",
      "fields": {
        "title": "My New Post",
        "content": "This is the content...",
        "author": "John Doe"
      }
    }
  }
}

// Publish a draft
{
  "method": "tools/call",
  "params": {
    "name": "publish_document",
    "arguments": {
      "collection": "BlogPosts",
      "slug": "new-post"
    }
  }
}

// Delete a document
{
  "method": "tools/call",
  "params": {
    "name": "delete_document",
    "arguments": {
      "collection": "BlogPosts",
      "slug": "old-post"
    }
  }
}
```

### Prompts

Use pre-configured templates:

```javascript
// Get the create-page prompt
{
  "method": "prompts/get",
  "params": {
    "name": "create-page",
    "arguments": {
      "title": "About Us",
      "collection": "Pages"
    }
  }
}

// Get the review-changes prompt
{
  "method": "prompts/get",
  "params": {
    "name": "review-changes",
    "arguments": {
      "collection": "BlogPosts",
      "slug": "my-post"
    }
  }
}
```

## Use Cases with Replit Agent

### 1. Content Generation

**Prompt:**
```
Using the MCP endpoint at /mcp/message, please:
1. Get the schema for my "BlogPosts" collection
2. Generate a new blog post about "AI in Web Development"
3. Save it as a draft with the slug "ai-in-web-dev"
```

### 2. Content Migration

**Prompt:**
```
I need to migrate all blog posts from my old site. Using the MCP endpoint:
1. List all existing posts in the "BlogPosts" collection
2. For each post title I give you, create a new draft
3. Preserve the original slugs
```

### 3. Batch Operations

**Prompt:**
```
Using the MCP tools, update all blog posts in draft mode:
1. List all drafts in "BlogPosts"
2. Add a "lastUpdated" field with today's date to each
3. Save each updated draft
```

### 4. Schema-Driven Content Creation

**Prompt:**
```
Look at my "ProductPages" schema and create 5 example product pages 
for a fictional e-commerce store selling outdoor gear.
Use realistic data and save them all as drafts.
```

### 5. Content Review and Publishing Workflow

**Prompt:**
```
Help me review and publish content:
1. List all drafts in my "BlogPosts" collection
2. For each draft, summarize its content
3. Ask me which ones to publish
4. Publish the approved ones
```

## Authentication Notes

**Important:** The MCP endpoint requires CMS authentication. Only logged-in CMS users can access it.

**Critical for Replit Agent Users:**
- Replit Agent **does not** automatically use your browser cookies
- You **must** explicitly provide authentication with each request
- Options: include session cookie in headers, use browser console, or create an auth proxy
- See authentication methods above for practical solutions

**Quick Test:** To verify your setup works, use the browser console method first (Method 2 above) before attempting to use with Replit Agent. This confirms:
1. The endpoint is running
2. Your CMS authentication is valid
3. The MCP tools are working correctly

## Security Best Practices

1. **Production Use:** The MCP endpoint is authenticated by default, but consider additional rate limiting for production
2. **API Keys:** For programmatic access, consider implementing API key authentication
3. **CORS:** If exposing to external clients, configure CORS appropriately
4. **Firewall:** In production, restrict MCP endpoint access to trusted IPs/networks

## Troubleshooting

### "Authentication required" Error

**Problem:** Getting 401 errors when calling the MCP endpoint

**Solution:**
1. Make sure you're logged into the CMS at `/cms/login`
2. Check that your session cookie is being sent with requests
3. Verify the CMS plugin is properly configured

### "Method not found" Error

**Problem:** Getting -32601 errors

**Solution:**
1. Check that you're using a valid method name (e.g., `tools/call`, `resources/read`)
2. Verify the request structure matches JSON-RPC 2.0 spec
3. See the API Reference section above for correct formats

### "Invalid params" Error

**Problem:** Getting -32602 errors

**Solution:**
1. Ensure required parameters are provided (e.g., `uri` for resources/read, `name` for tools/call)
2. Check that argument types are correct (strings, objects, etc.)
3. Refer to the examples above for proper parameter structure

## Advanced: Building Custom MCP Workflows

You can combine MCP tools to create powerful automated workflows:

```typescript
// Example: Automated content review workflow
async function reviewAndPublishWorkflow() {
  // 1. Get all drafts
  const drafts = await mcpCall('list_documents', {
    collection: 'BlogPosts',
    mode: 'draft'
  });
  
  // 2. For each draft, get AI summary
  for (const draft of drafts) {
    const doc = await mcpCall('get_document', {
      collection: 'BlogPosts',
      slug: draft.slug,
      mode: 'draft'
    });
    
    // 3. Ask AI to review
    console.log(`Review for ${draft.slug}:`, doc);
    
    // 4. Publish if approved
    if (approved(doc)) {
      await mcpCall('publish_document', {
        collection: 'BlogPosts',
        slug: draft.slug
      });
    }
  }
}
```

## Next Steps

- Explore the [MCP Plugin README](../README.md) for detailed API reference
- Check out [Root CMS documentation](https://rootjs.dev) for CMS features
- Learn about [Model Context Protocol](https://modelcontextprotocol.io/) specification

## Support

For issues and questions:
- Root.js: https://github.com/blinkk/rootjs/issues
- MCP Specification: https://modelcontextprotocol.io/
- Replit Support: https://replit.com/support
