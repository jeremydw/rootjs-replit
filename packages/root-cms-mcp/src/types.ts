import type {App} from 'firebase-admin/app';
import type {Firestore} from 'firebase-admin/firestore';
import {SimpleCMSClient} from './cms-client.js';

export interface MCPServerConfig {
  /**
   * Firebase project ID
   */
  projectId: string;

  /**
   * Root CMS project ID (used as namespace in Firestore)
   */
  cmsProjectId: string;

  /**
   * Optional Firebase credentials path
   */
  credentialsPath?: string;

  /**
   * Optional Firestore database ID
   */
  databaseId?: string;
}

export interface MCPServerContext {
  config: MCPServerConfig;
  firebaseApp: App;
  db: Firestore;
  cmsClient: SimpleCMSClient;
}

export type DocMode = 'draft' | 'published';

export interface DocumentIdentifier {
  collection: string;
  slug: string;
}

export interface CreateDocumentParams {
  collection: string;
  slug: string;
  fields: Record<string, any>;
  mode?: DocMode;
  locales?: string[];
}

export interface UpdateDocumentParams {
  collection: string;
  slug: string;
  fields: Record<string, any>;
  mode?: DocMode;
}

export interface QueryDocumentsParams {
  collection: string;
  mode?: DocMode;
  limit?: number;
  offset?: number;
}

export interface PublishDocumentParams {
  collection: string;
  slug: string;
}

export interface GetSchemaParams {
  collection: string;
}

export type CMSDocument = any;
