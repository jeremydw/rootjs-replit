import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type {Server as ExpressServer, Request, Response, NextFunction} from '@blinkk/root';
import type {CMSPlugin} from '@blinkk/root-cms/plugin';
import {SimpleCMSClient} from './cms-client.js';
import {MCPServerContext} from './types.js';
import {registerResources} from './resources/index.js';
import {registerTools} from './tools/index.js';
import {registerPrompts} from './prompts/index.js';

export interface MCPPluginOptions {
  /**
   * URL path to mount the MCP endpoints. Defaults to '/mcp'.
   */
  path?: string;
}

export interface MCPPlugin {
  name: string;
  configureServer: (server: ExpressServer, options: {rootConfig: any}) => void | Promise<void>;
}

/**
 * Creates a Root.js plugin that adds MCP (Model Context Protocol) endpoints
 * for AI-powered CMS operations. This plugin integrates with the existing
 * CMS plugin and uses its Firebase/Firestore configuration.
 *
 * Usage in root.config.ts:
 * ```typescript
 * import {cmsPlugin} from '@blinkk/root-cms';
 * import {mcpPlugin} from '@blinkk/root-cms-mcp';
 *
 * export default {
 *   plugins: [
 *     cmsPlugin({...}),
 *     mcpPlugin(),
 *   ],
 * };
 * ```
 */
export function mcpPlugin(options: MCPPluginOptions = {}): MCPPlugin {
  const mcpPath = options.path || '/mcp';
  let mcpServer: Server | null = null;
  let context: MCPServerContext | null = null;

  return {
    name: 'root-cms-mcp',

    configureServer: async (server: ExpressServer, serverOptions: {rootConfig: any}) => {
      const rootConfig = serverOptions.rootConfig;

      // Get the CMS plugin from the root config
      const cmsPlugin = rootConfig.plugins?.find(
        (p: any) => p.name === 'root-cms'
      ) as CMSPlugin | undefined;

      if (!cmsPlugin) {
        console.warn(
          '[MCP Plugin] CMS plugin not found. MCP endpoints will not be available.'
        );
        return;
      }

      // Get Firebase/Firestore from the CMS plugin
      const firebaseApp = cmsPlugin.getFirebaseApp();
      const db = cmsPlugin.getFirestore();
      const cmsConfig = cmsPlugin.getConfig();
      const projectId = cmsConfig.id || 'default';

      // Initialize the CMS client
      const cmsClient = new SimpleCMSClient(db, projectId);

      // Create MCP server context
      context = {
        config: {
          projectId: firebaseApp.options.projectId || 'unknown',
          cmsProjectId: projectId,
        },
        firebaseApp,
        db,
        cmsClient,
      };

      // Create MCP server instance
      mcpServer = new Server(
        {
          name: 'root-cms-mcp',
          version: '0.1.0',
        },
        {
          capabilities: {
            resources: {},
            tools: {},
            prompts: {},
          },
        }
      );

      // Register MCP handlers
      mcpServer.setRequestHandler(
        ListResourcesRequestSchema,
        async () => registerResources(context!).list()
      );

      mcpServer.setRequestHandler(
        ReadResourceRequestSchema,
        async (request) => registerResources(context!).read(request.params.uri)
      );

      mcpServer.setRequestHandler(
        ListToolsRequestSchema,
        async () => registerTools(context!).list()
      );

      mcpServer.setRequestHandler(
        CallToolRequestSchema,
        async (request) =>
          registerTools(context!).call(request.params.name, request.params.arguments)
      );

      mcpServer.setRequestHandler(
        ListPromptsRequestSchema,
        async () => registerPrompts(context!).list()
      );

      mcpServer.setRequestHandler(
        GetPromptRequestSchema,
        async (request) =>
          registerPrompts(context!).get(request.params.name, request.params.arguments)
      );

      // Add HTTP endpoint for MCP
      // NOTE: This endpoint should only be accessible to authenticated users
      server.use(
        `${mcpPath}/message`,
        async (req: Request, res: Response, next: NextFunction) => {
          // Require authentication for MCP endpoint
          if (!req.user) {
            res.status(401).json({
              jsonrpc: '2.0',
              error: {
                code: -32001,
                message: 'Authentication required',
              },
              id: null,
            });
            return;
          }

          if (req.method !== 'POST') {
            res.status(405).json({
              jsonrpc: '2.0',
              error: {code: -32000, message: 'Method not allowed'},
              id: null,
            });
            return;
          }

          try {
            const {method, params, id} = req.body;

            // Validate JSON-RPC request
            if (!method || typeof method !== 'string') {
              res.status(400).json({
                jsonrpc: '2.0',
                error: {code: -32600, message: 'Invalid Request: missing or invalid method'},
                id: id || null,
              });
              return;
            }

            // Validate params is an object
            if (params !== undefined && typeof params !== 'object') {
              res.status(400).json({
                jsonrpc: '2.0',
                error: {code: -32600, message: 'Invalid Request: params must be an object'},
                id: id || null,
              });
              return;
            }

            const requestParams = params || {};
            const requestId = id !== undefined ? id : Date.now();

            // Route to the appropriate handler and validate required params
            let result;
            try {
              switch (method) {
                case 'resources/list':
                  result = await registerResources(context!).list();
                  break;

                case 'resources/read':
                  if (!requestParams.uri) {
                    res.status(400).json({
                      jsonrpc: '2.0',
                      error: {code: -32602, message: 'Invalid params: uri is required'},
                      id: requestId,
                    });
                    return;
                  }
                  result = await registerResources(context!).read(requestParams.uri);
                  break;

                case 'tools/list':
                  result = await registerTools(context!).list();
                  break;

                case 'tools/call':
                  if (!requestParams.name) {
                    res.status(400).json({
                      jsonrpc: '2.0',
                      error: {code: -32602, message: 'Invalid params: name is required'},
                      id: requestId,
                    });
                    return;
                  }
                  result = await registerTools(context!).call(
                    requestParams.name,
                    requestParams.arguments || {}
                  );
                  break;

                case 'prompts/list':
                  result = await registerPrompts(context!).list();
                  break;

                case 'prompts/get':
                  if (!requestParams.name) {
                    res.status(400).json({
                      jsonrpc: '2.0',
                      error: {code: -32602, message: 'Invalid params: name is required'},
                      id: requestId,
                    });
                    return;
                  }
                  result = await registerPrompts(context!).get(
                    requestParams.name,
                    requestParams.arguments || {}
                  );
                  break;

                default:
                  res.status(400).json({
                    jsonrpc: '2.0',
                    error: {code: -32601, message: `Method not found: ${method}`},
                    id: requestId,
                  });
                  return;
              }

              res.json({
                jsonrpc: '2.0',
                result,
                id: requestId,
              });
            } catch (error: any) {
              // Handle application-level errors
              console.error('[MCP Plugin] Error in method handler:', error);
              res.status(500).json({
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: 'Internal error',
                  data: error.message,
                },
                id: requestId,
              });
            }
          } catch (error: any) {
            // Handle parsing/validation errors
            console.error('[MCP Plugin] Error processing request:', error);
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32700,
                message: 'Parse error',
                data: error.message,
              },
              id: null,
            });
          }
        }
      );

      console.log(`[MCP Plugin] Initialized at ${mcpPath}/message`);
    },
  };
}
