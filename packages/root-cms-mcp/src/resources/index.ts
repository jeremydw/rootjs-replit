import {MCPServerContext} from '../types.js';

export function registerResources(context: MCPServerContext) {
  return {
    async list() {
      return {
        resources: [
          {
            uri: 'cms://documents',
            name: 'CMS Documents',
            description: 'List all CMS documents across collections',
            mimeType: 'application/json',
          },
          {
            uri: 'cms://collections',
            name: 'CMS Collections',
            description: 'List all available CMS collections',
            mimeType: 'application/json',
          },
          {
            uri: 'cms://schemas',
            name: 'CMS Schemas',
            description: 'Collection schemas and field definitions',
            mimeType: 'application/json',
          },
        ],
      };
    },

    async read(uri: string) {
      const {cmsClient} = context;

      if (uri === 'cms://documents') {
        // List all documents (limited to first 100)
        const collections = await cmsClient.listCollections();
        const allDocs: any[] = [];

        for (const collection of collections) {
          const docs = await cmsClient.listDocs(collection, {
            mode: 'draft',
            limit: 20,
          });
          allDocs.push(
            ...docs.map((doc) => ({
              collection: doc.collection,
              slug: doc.slug,
              id: doc.id,
              sys: doc.sys,
            }))
          );
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(allDocs, null, 2),
            },
          ],
        };
      }

      if (uri === 'cms://collections') {
        const collections = await cmsClient.listCollections();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(collections, null, 2),
            },
          ],
        };
      }

      if (uri === 'cms://schemas') {
        const collections = await cmsClient.listCollections();
        const schemas: Record<string, any> = {};

        for (const collection of collections) {
          try {
            const schema = await cmsClient.getSchema(collection);
            schemas[collection] = schema;
          } catch (e) {
            // Schema might not exist
            schemas[collection] = null;
          }
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(schemas, null, 2),
            },
          ],
        };
      }

      // Handle collection-specific URIs: cms://collection/{name}
      if (uri.startsWith('cms://collection/')) {
        const collection = uri.replace('cms://collection/', '');
        const docs = await cmsClient.listDocs(collection, {
          mode: 'draft',
          limit: 100,
        });

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(docs, null, 2),
            },
          ],
        };
      }

      // Handle document-specific URIs: cms://doc/{collection}/{slug}
      if (uri.startsWith('cms://doc/')) {
        const parts = uri.replace('cms://doc/', '').split('/');
        if (parts.length >= 2) {
          const collection = parts[0];
          const slug = parts.slice(1).join('/');
          const doc = await cmsClient.getDoc(collection, slug, {mode: 'draft'});

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(doc, null, 2),
              },
            ],
          };
        }
      }

      throw new Error(`Unknown resource URI: ${uri}`);
    },
  };
}
