import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {initializeApp, cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {RootCMSClient} from '@blinkk/root-cms/client';
import {MCPServerConfig, MCPServerContext} from './types.js';
import {registerResources} from './resources/index.js';
import {registerTools} from './tools/index.js';
import {registerPrompts} from './prompts/index.js';

export class RootCMSMCPServer {
  private server: Server;
  private context: MCPServerContext;

  constructor(config: MCPServerConfig) {
    // Initialize Firebase
    const firebaseApp = config.credentialsPath
      ? initializeApp({
          credential: cert(config.credentialsPath),
          projectId: config.projectId,
        })
      : initializeApp({projectId: config.projectId});

    const db = getFirestore(firebaseApp, config.databaseId);

    // Initialize CMS client
    const cmsClient = new RootCMSClient(db, {
      id: config.cmsProjectId,
    });

    this.context = {
      config,
      firebaseApp,
      db,
      cmsClient,
    };

    // Create MCP server
    this.server = new Server(
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

    this.setupHandlers();
  }

  private setupHandlers() {
    // Register resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async () => registerResources(this.context).list()
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => registerResources(this.context).read(request.params.uri)
    );

    // Register tool handlers
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => registerTools(this.context).list()
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => 
        registerTools(this.context).call(request.params.name, request.params.arguments)
    );

    // Register prompt handlers
    this.server.setRequestHandler(
      ListPromptsRequestSchema,
      async () => registerPrompts(this.context).list()
    );

    this.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request) =>
        registerPrompts(this.context).get(request.params.name, request.params.arguments)
    );
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Root CMS MCP Server running on stdio');
  }
}
