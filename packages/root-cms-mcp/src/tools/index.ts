import {MCPServerContext, CreateDocumentParams, UpdateDocumentParams, QueryDocumentsParams, PublishDocumentParams} from '../types.js';

export function registerTools(context: MCPServerContext) {
  const {cmsClient} = context;

  return {
    async list() {
      return {
        tools: [
          {
            name: 'get_document',
            description: 'Get a specific CMS document by collection and slug',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name (e.g., "Pages", "BlogPosts")',
                },
                slug: {
                  type: 'string',
                  description: 'Document slug (unique identifier)',
                },
                mode: {
                  type: 'string',
                  enum: ['draft', 'published'],
                  description: 'Document mode (default: draft)',
                },
              },
              required: ['collection', 'slug'],
            },
          },
          {
            name: 'list_documents',
            description: 'List all documents in a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name',
                },
                mode: {
                  type: 'string',
                  enum: ['draft', 'published'],
                  description: 'Document mode (default: draft)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of documents to return (default: 50)',
                },
                offset: {
                  type: 'number',
                  description: 'Number of documents to skip (default: 0)',
                },
              },
              required: ['collection'],
            },
          },
          {
            name: 'save_draft',
            description: 'Save or update a draft document (creates if it doesn\'t exist)',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name',
                },
                slug: {
                  type: 'string',
                  description: 'Document slug',
                },
                fields: {
                  type: 'object',
                  description: 'Document field values',
                },
                locales: {
                  type: 'array',
                  items: {type: 'string'},
                  description: 'Enabled locales for this document',
                },
              },
              required: ['collection', 'slug', 'fields'],
            },
          },
          {
            name: 'create_document',
            description: 'Create a new CMS document',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name (e.g., "Pages", "BlogPosts")',
                },
                slug: {
                  type: 'string',
                  description: 'Document slug (unique identifier)',
                },
                fields: {
                  type: 'object',
                  description: 'Document field values',
                },
                mode: {
                  type: 'string',
                  enum: ['draft', 'published'],
                  description: 'Document mode (default: draft)',
                },
                locales: {
                  type: 'array',
                  items: {type: 'string'},
                  description: 'Enabled locales for this document',
                },
              },
              required: ['collection', 'slug', 'fields'],
            },
          },
          {
            name: 'update_document',
            description: 'Update an existing CMS document',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {type: 'string'},
                slug: {type: 'string'},
                fields: {
                  type: 'object',
                  description: 'Document field values to update',
                },
                mode: {
                  type: 'string',
                  enum: ['draft', 'published'],
                },
              },
              required: ['collection', 'slug', 'fields'],
            },
          },
          {
            name: 'delete_document',
            description: 'Delete a CMS document',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {type: 'string'},
                slug: {type: 'string'},
              },
              required: ['collection', 'slug'],
            },
          },
          {
            name: 'query_documents',
            description: 'Query and filter CMS documents',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {type: 'string'},
                mode: {
                  type: 'string',
                  enum: ['draft', 'published'],
                },
                limit: {type: 'number'},
                offset: {type: 'number'},
              },
              required: ['collection'],
            },
          },
          {
            name: 'publish_document',
            description: 'Publish a draft document to production',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {type: 'string'},
                slug: {type: 'string'},
              },
              required: ['collection', 'slug'],
            },
          },
          {
            name: 'get_schema',
            description: 'Get the schema definition for a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {type: 'string'},
              },
              required: ['collection'],
            },
          },
        ],
      };
    },

    async call(name: string, args: any) {
      try {
        switch (name) {
          case 'get_document':
            return await getDocument(cmsClient, args);

          case 'list_documents':
            return await listDocuments(cmsClient, args);

          case 'save_draft':
            return await saveDraft(cmsClient, args);

          case 'create_document':
            return await createDocument(cmsClient, args as CreateDocumentParams);

          case 'update_document':
            return await updateDocument(cmsClient, args as UpdateDocumentParams);

          case 'delete_document':
            return await deleteDocument(cmsClient, args);

          case 'query_documents':
            return await queryDocuments(cmsClient, args as QueryDocumentsParams);

          case 'publish_document':
            return await publishDocument(cmsClient, args as PublishDocumentParams);

          case 'get_schema':
            return await getSchema(cmsClient, args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

async function getDocument(cmsClient: any, params: {collection: string; slug: string; mode?: 'draft' | 'published'}) {
  const {collection, slug, mode = 'draft'} = params;

  const doc = await cmsClient.getDoc(collection, slug, {mode});

  if (!doc) {
    return {
      content: [
        {
          type: 'text',
          text: `Document not found: ${collection}/${slug} (mode: ${mode})`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Document: ${collection}/${slug}`,
      },
      {
        type: 'text',
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}

async function listDocuments(cmsClient: any, params: {collection: string; mode?: 'draft' | 'published'; limit?: number; offset?: number}) {
  const {collection, mode = 'draft', limit = 50, offset = 0} = params;

  const docs = await cmsClient.listDocs(collection, {
    mode,
    limit,
    offset,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Found ${docs.length} documents in ${collection} (mode: ${mode})`,
      },
      {
        type: 'text',
        text: JSON.stringify(docs.map((d: any) => ({slug: d.slug, ...d.fields})), null, 2),
      },
    ],
  };
}

async function saveDraft(cmsClient: any, params: {collection: string; slug: string; fields: Record<string, any>; locales?: string[]}) {
  const {collection, slug, fields, locales} = params;

  await cmsClient.saveDraft(collection, slug, fields, {
    locales,
    modifiedBy: 'mcp-server',
  });

  const doc = await cmsClient.getDoc(collection, slug, {mode: 'draft'});

  return {
    content: [
      {
        type: 'text',
        text: `Successfully saved draft: ${collection}/${slug}`,
      },
      {
        type: 'text',
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}

async function createDocument(cmsClient: any, params: CreateDocumentParams) {
  const {collection, slug, fields, mode = 'draft', locales} = params;

  await cmsClient.saveDraft(collection, slug, fields, {
    locales,
    modifiedBy: 'mcp-server',
  });

  if (mode === 'published') {
    await cmsClient.publish(collection, slug, {
      publishedBy: 'mcp-server',
    });
  }

  const doc = await cmsClient.getDoc(collection, slug, {mode});

  return {
    content: [
      {
        type: 'text',
        text: `Successfully created document: ${collection}/${slug}`,
      },
      {
        type: 'text',
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}

async function updateDocument(cmsClient: any, params: UpdateDocumentParams) {
  const {collection, slug, fields, mode = 'draft'} = params;

  await cmsClient.saveDraft(collection, slug, fields, {
    modifiedBy: 'mcp-server',
  });

  const doc = await cmsClient.getDoc(collection, slug, {mode});

  return {
    content: [
      {
        type: 'text',
        text: `Successfully updated document: ${collection}/${slug}`,
      },
      {
        type: 'text',
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}

async function deleteDocument(cmsClient: any, params: {collection: string; slug: string}) {
  const {collection, slug} = params;

  await cmsClient.deleteDoc(collection, slug);

  return {
    content: [
      {
        type: 'text',
        text: `Successfully deleted document: ${collection}/${slug}`,
      },
    ],
  };
}

async function queryDocuments(cmsClient: any, params: QueryDocumentsParams) {
  const {collection, mode = 'draft', limit = 50, offset = 0} = params;

  const docs = await cmsClient.listDocs(collection, {
    mode,
    limit,
    offset,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Found ${docs.length} documents in ${collection}`,
      },
      {
        type: 'text',
        text: JSON.stringify(docs, null, 2),
      },
    ],
  };
}

async function publishDocument(cmsClient: any, params: PublishDocumentParams) {
  const {collection, slug} = params;

  await cmsClient.publish(collection, slug, {
    publishedBy: 'mcp-server',
  });

  const doc = await cmsClient.getDoc(collection, slug, {mode: 'published'});

  return {
    content: [
      {
        type: 'text',
        text: `Successfully published document: ${collection}/${slug}`,
      },
      {
        type: 'text',
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}

async function getSchema(cmsClient: any, params: {collection: string}) {
  const {collection} = params;

  const schema = await cmsClient.getSchema(collection);

  return {
    content: [
      {
        type: 'text',
        text: `Schema for collection: ${collection}`,
      },
      {
        type: 'text',
        text: JSON.stringify(schema, null, 2),
      },
    ],
  };
}
