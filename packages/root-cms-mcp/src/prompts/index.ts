import {MCPServerContext} from '../types.js';

export function registerPrompts(context: MCPServerContext) {
  return {
    async list() {
      return {
        prompts: [
          {
            name: 'create_page',
            description: 'Template for creating a new page with common modules',
            arguments: [
              {
                name: 'title',
                description: 'Page title',
                required: true,
              },
              {
                name: 'slug',
                description: 'Page URL slug',
                required: true,
              },
            ],
          },
          {
            name: 'create_blog_post',
            description: 'Template for creating a blog post',
            arguments: [
              {
                name: 'title',
                description: 'Blog post title',
                required: true,
              },
              {
                name: 'author',
                description: 'Author name',
                required: false,
              },
            ],
          },
          {
            name: 'optimize_seo',
            description: 'Generate SEO metadata suggestions for a page',
            arguments: [
              {
                name: 'collection',
                description: 'Collection name',
                required: true,
              },
              {
                name: 'slug',
                description: 'Document slug',
                required: true,
              },
            ],
          },
        ],
      };
    },

    async get(name: string, args?: Record<string, string>) {
      const {cmsClient} = context;

      switch (name) {
        case 'create_page':
          return {
            messages: [
              {
                role: 'user' as const,
                content: {
                  type: 'text' as const,
                  text: `Create a new page in the CMS with the following details:
Title: ${args?.title}
Slug: ${args?.slug}

Please use the create_document tool to create a page with:
1. A hero module with the title
2. A content section
3. Appropriate SEO metadata (meta title, description)

Structure the page modules according to Root CMS best practices.`,
                },
              },
            ],
          };

        case 'create_blog_post':
          return {
            messages: [
              {
                role: 'user' as const,
                content: {
                  type: 'text' as const,
                  text: `Create a new blog post with:
Title: ${args?.title}
Author: ${args?.author || 'Unknown'}

Include:
1. Featured image placeholder
2. Blog content section
3. Publication date
4. Author information
5. SEO metadata`,
                },
              },
            ],
          };

        case 'optimize_seo': {
          const doc = await cmsClient.getDoc(args!.collection, args!.slug, {
            mode: 'draft',
          });

          return {
            messages: [
              {
                role: 'user' as const,
                content: {
                  type: 'text' as const,
                  text: `Analyze this CMS document and suggest SEO optimizations:

Collection: ${args?.collection}
Slug: ${args?.slug}

Current Document:
${JSON.stringify(doc, null, 2)}

Please suggest:
1. Optimized meta title (50-60 characters)
2. Meta description (150-160 characters)
3. Open Graph tags
4. Structured data markup
5. Any content improvements for SEO`,
                },
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    },
  };
}
