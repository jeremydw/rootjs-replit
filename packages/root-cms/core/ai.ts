import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {vertexAI} from '@genkit-ai/vertexai';
import {Timestamp} from 'firebase-admin/firestore';
import {Genkit, genkit, MessageData, z} from 'genkit';
import {logger} from 'genkit/logging';
import {
  ChatPrompt,
  AiResponse,
  SendPromptOptions,
} from '../shared/ai/prompts.js';
import {RootCMSClient} from './client.js';
import {CMSPluginOptions} from './plugin.js';

// Suppress the "Shutting down all Genkit servers..." message.
logger.setLogLevel('warn');

type HistoryItem = MessageData;

/** Supported Root AI models. Defaults to 'vertexai/gemini-2.5-flash'. */
export type RootAiModel =
  | 'vertexai/gemini-2.5-flash'
  | 'vertexai/gemini-2.0-pro'
  | 'vertexai/gemini-1.5-flash'
  | 'vertexai/gemini-1.5-pro';

const DEFAULT_MODEL: RootAiModel = 'vertexai/gemini-2.5-flash';

export interface SummarizeDiffOptions {
  before: Record<string, any> | null;
  after: Record<string, any> | null;
}

/**
 * Generates a natural language summary of the differences between two JSON
 * payloads.
 */
export async function summarizeDiff(
  cmsClient: RootCMSClient,
  options: SummarizeDiffOptions
): Promise<string> {
  const cmsPluginOptions = cmsClient.cmsPlugin.getConfig();
  const firebaseConfig = cmsPluginOptions.firebaseConfig;
  const model: RootAiModel =
    (typeof cmsPluginOptions.experiments?.ai === 'object'
      ? cmsPluginOptions.experiments.ai.model
      : undefined) || DEFAULT_MODEL;

  const ai = genkit({
    plugins: [
      vertexAI({
        projectId: firebaseConfig.projectId,
        location: firebaseConfig.location || 'us-central1',
      }),
    ],
  });

  const beforeJson = JSON.stringify(options.before ?? null, null, 2);
  const afterJson = JSON.stringify(options.after ?? null, null, 2);

  const systemPrompt = [
    'You are an assistant that summarizes changes made to CMS documents stored as JSON.',
    'Provide a concise description of the most important updates using short bullet points.',
    'If there are no meaningful differences, respond with "No significant changes."',
    'Focus on just the content changes, ignore insignificant changes to richtext blocks and structure, such as updates to the richtext block\'s "timestamp" and "version" fields.',
  ].join('\n');

  const diffPrompt = [
    'Previous version JSON:',
    '```json',
    beforeJson,
    '```',
    '',
    'Updated version JSON:',
    '```json',
    afterJson,
    '```',
    '',
    'Summarize the differences between the two payloads.',
  ].join('\n');

  const res = await ai.generate({
    model,
    messages: [
      {
        role: 'system',
        content: [{text: systemPrompt}],
      },
    ],
    prompt: [{text: diffPrompt}],
  });

  return res.text?.trim() || '';
}

export class Chat {
  chatClient: ChatClient;
  cmsClient: RootCMSClient;
  cmsPluginOptions: CMSPluginOptions;
  id: string;
  history: HistoryItem[];
  model: string;
  ai: Genkit;
  mcpTools: any[];

  constructor(
    chatClient: ChatClient,
    id: string,
    options?: {history?: HistoryItem[]; model?: string}
  ) {
    this.chatClient = chatClient;
    this.cmsClient = chatClient.cmsClient;
    this.cmsPluginOptions = this.cmsClient.cmsPlugin.getConfig();
    this.id = id;
    this.history = options?.history ?? [];
    this.model =
      options?.model ||
      (typeof this.cmsPluginOptions.experiments?.ai === 'object'
        ? this.cmsPluginOptions.experiments.ai.model
        : undefined) ||
      DEFAULT_MODEL;
    const firebaseConfig = this.cmsPluginOptions.firebaseConfig;
    this.ai = genkit({
      plugins: [
        vertexAI({
          projectId: firebaseConfig.projectId,
          location: firebaseConfig.location || 'us-central1',
        }),
      ],
    });
    this.mcpTools = this.buildMcpTools();
  }

  /** Builds MCP tools for the AI to interact with the CMS. */
  private buildMcpTools(): any[] {
    const cmsClient = this.cmsClient;
    const ai = this.ai;

    return [
      ai.defineTool(
        {
          name: 'get_document',
          description: 'Get a specific CMS document by collection and slug',
          inputSchema: z.object({
            collection: z.string().describe('The collection name'),
            slug: z.string().describe('The document slug'),
            mode: z
              .enum(['draft', 'published'])
              .optional()
              .describe('Whether to get draft or published version'),
          }),
          outputSchema: z.any(),
        },
        async (input) => {
          const {collection, slug, mode = 'draft'} = input;
          const doc = await cmsClient.getDoc(collection, slug, {mode});
          return doc || {error: 'Document not found'};
        }
      ),
      ai.defineTool(
        {
          name: 'list_documents',
          description: 'List all documents in a collection',
          inputSchema: z.object({
            collection: z.string().describe('The collection name'),
            mode: z
              .enum(['draft', 'published'])
              .optional()
              .describe('Whether to list drafts or published'),
            limit: z
              .number()
              .optional()
              .describe('Maximum number of documents to return'),
          }),
          outputSchema: z.any(),
        },
        async (input) => {
          const {collection, mode = 'draft', limit = 50} = input;
          const docs = await cmsClient.listDocs(collection, {mode, limit});
          return docs;
        }
      ),
      ai.defineTool(
        {
          name: 'save_draft',
          description:
            "Save or update a draft document (creates if it doesn't exist)",
          inputSchema: z.object({
            collection: z.string().describe('The collection name'),
            slug: z.string().describe('The document slug'),
            fields: z.any().describe('The document fields to save'),
          }),
          outputSchema: z.any(),
        },
        async (input) => {
          const {collection, slug, fields} = input;
          const docId = `${collection}/${slug}`;
          await cmsClient.saveDraftData(docId, fields, {
            modifiedBy: 'ai-assistant',
          });
          const doc = await cmsClient.getDoc(collection, slug, {mode: 'draft'});
          return doc;
        }
      ),
      ai.defineTool(
        {
          name: 'publish_document',
          description: 'Publish a draft document to production',
          inputSchema: z.object({
            collection: z.string().describe('The collection name'),
            slug: z.string().describe('The document slug'),
          }),
          outputSchema: z.any(),
        },
        async (input) => {
          const {collection, slug} = input;
          const docId = `${collection}/${slug}`;
          await cmsClient.publishDocs([docId], {
            publishedBy: 'ai-assistant',
          });
          const doc = await cmsClient.getDoc(collection, slug, {
            mode: 'published',
          });
          return doc;
        }
      ),
      ai.defineTool(
        {
          name: 'get_schema',
          description: 'Get the schema definition for a collection',
          inputSchema: z.object({
            collection: z.string().describe('The collection name'),
          }),
          outputSchema: z.any(),
        },
        async (input) => {
          const {collection} = input;
          const docs = await cmsClient.listDocs(collection, {
            mode: 'draft',
            limit: 1,
          });
          if (docs && docs.docs && docs.docs.length > 0) {
            const sampleDoc = docs.docs[0];
            return {
              collection,
              sampleDocument: sampleDoc,
              description:
                'Schema inferred from a sample document in this collection',
            };
          }
          return {
            collection,
            error: 'No documents found in collection to infer schema',
          };
        }
      ),
    ];
  }

  /** Builds the messages for the AI request. */
  private async buildMessages(
    options: SendPromptOptions
  ): Promise<MessageData[]> {
    const messages = this.history;
    const hasSystemPrompt = messages.some(
      (msg) => msg.role === 'system' && msg.content.length > 0
    );
    if (!hasSystemPrompt) {
      messages.push({
        role: 'system',
        content: [{text: await this.buildSystemPrompt(options)}],
      });
    }
    // Additional data sent for "edit" mode requests.
    if (options.mode === 'edit') {
      messages.push({
        role: 'user',
        content: [
          {
            text: [
              'The JSON you must edit is:',
              '',
              JSON.stringify(options.editData || {}, null, 2),
            ].join(''),
          },
        ],
      });
    }
    return messages;
  }

  /** Builds the request sent to the AI based on the `ChatMode`. */
  private async buildGenerateRequest(
    prompt: ChatPrompt | ChatPrompt[],
    options: SendPromptOptions
  ): Promise<{
    messages: MessageData[];
    model: string;
    prompt: ChatPrompt | ChatPrompt[];
  }> {
    if (options.mode === 'edit') {
      return {
        messages: await this.buildMessages(options),
        model: this.model,
        prompt: prompt,
      };
    }
    return {
      messages: await this.buildMessages(options),
      model: this.model,
      prompt: prompt,
    };
  }

  /** Sends the request to the AI and stores the history in the session and the database. */
  async sendPrompt(
    prompt: ChatPrompt | ChatPrompt[],
    options: SendPromptOptions = {}
  ): Promise<AiResponse> {
    const chatRequest = await this.buildGenerateRequest(prompt, options);
    // TODO: Use streaming responses per https://genkit.dev/docs/models/#streaming
    // to improve UI performance.
    const res = await this.ai.generate({
      model: chatRequest.model,
      messages: chatRequest.messages,
      prompt: Array.isArray(prompt) ? prompt.flat() : prompt,
      tools: this.mcpTools,
    });
    this.history = res.messages;
    await this.dbDoc().update({
      history: this.history,
      modifiedAt: Timestamp.now(),
    });
    // Using the `output` property provides both data and text responses.
    if (options.mode === 'edit') {
      const aiResponse = res.output as AiResponse & {editData?: any};
      if (aiResponse?.data && !aiResponse.message) {
        aiResponse.message = '';
      }
      return aiResponse;
    }
    return {message: res.text, data: null};
  }

  dbDoc() {
    return this.chatClient.dbCollection().doc(this.id);
  }

  /**
   * Builds the system prompt sent to the AI, based on the `ChatMode` and
   * supplied `SendPromptOptions`. `SendPromptOptions` may contain data or
   * references to information needed to construct the prompt.
   */
  private async buildSystemPrompt(options: SendPromptOptions): Promise<string> {
    const serializedRootConfig = JSON.stringify(
      this.cmsClient.rootConfig,
      null,
      2
    );

    // Edit mode prompts.
    if (options.mode === 'edit') {
      const rootDir = process.cwd();
      // The `root-cms.d.ts` file may not be bundled with the server code,
      // so check whether it exists first before attempting to add it to the prompt.
      const rootCmsDefsPath = path.resolve(rootDir, 'root-cms.d.ts');
      const rootCmsDefs = fs.existsSync(rootCmsDefsPath)
        ? fs.readFileSync(rootCmsDefsPath, {
            encoding: 'utf8',
          })
        : null;
      const text = [(await import('../shared/ai/prompts/edit.txt')).default];
      if (rootCmsDefs) {
        text.push(
          'Here is the `root-cms.d.ts` file for this project:',
          '```',
          rootCmsDefs,
          '```'
        );
      }
      return text.join('\n');
    }

    if (options.mode === 'altText') {
      return (await import('../shared/ai/prompts/altText.txt')).default;
    }

    // Chat mode (default) prompts.
    const systemText = [
      `You are an assistant for a headless CMS called Root CMS which is used on a website called ${
        this.cmsPluginOptions.name || this.cmsPluginOptions.id
      }. Your job is to answer questions about the docs in the system, and if requested, help suggest changes to the JSON data in the docs. If you don't know the answer, just say that you don't know, don't try to make up an answer. Be friendly and playful with your messaging.`,
      '',
      'You have access to the following tools to interact with the CMS:',
      '- get_document: Retrieve a specific document by collection and slug',
      '- list_documents: List all documents in a collection',
      '- save_draft: Create or update a draft document',
      '- publish_document: Publish a draft document to production',
      '- get_schema: Get the schema definition for a collection',
      '',
      'Use these tools to browse and modify CMS content as needed. Always confirm with the user before publishing documents to production.',
      '',
      'Here is the root.config.ts file for the site:',
      '```',
      serializedRootConfig,
      '```',
    ];
    return systemText.join('\n');
  }
}

export class ChatClient {
  cmsClient: RootCMSClient;
  user: string;

  constructor(cmsClient: RootCMSClient, user: string) {
    this.cmsClient = cmsClient;
    this.user = user;
  }

  private async createChat(): Promise<Chat> {
    const chatId = crypto.randomUUID();
    // Save chat to db so that user has a chat history and can enable "sharing"
    // with others. Store the model used with the metadata.
    const docRef = this.dbCollection().doc(chatId);
    const chat = new Chat(this, chatId);
    await docRef.set({
      id: chatId,
      createdBy: this.user,
      createdAt: Timestamp.now(),
      modifiedAt: Timestamp.now(),
      model: chat.model,
    });
    return chat;
  }

  async getOrCreateChat(chatId?: string): Promise<Chat> {
    return chatId ? this.getChat(chatId) : this.createChat();
  }

  private async getChat(chatId: string): Promise<Chat> {
    // Fetch chat from db to preserve the conversation's history.
    const docRef = this.dbCollection().doc(chatId);
    const chatDoc = await docRef.get();
    if (!chatDoc.exists) {
      throw new Error(`${chatId} does not exist`);
    }
    const chatData = chatDoc.data() || {};
    return new Chat(this, chatId, {
      history: chatData.history,
      model: chatData.model,
    });
  }

  async listChats(options?: {limit?: number}): Promise<any[]> {
    const limit = options?.limit || 20;
    const query = this.dbCollection()
      .where('createdBy', '==', this.user)
      .limit(limit)
      .orderBy('createdAt', 'desc');
    const res = await query.get();
    return res.docs.map((doc) => doc.data());
  }

  dbCollection() {
    return this.cmsClient.db.collection(
      `Projects/${this.cmsClient.projectId}/Experiments/ai/Chat`
    );
  }
}
