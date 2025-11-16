import {RootCMSClient, Doc} from '@blinkk/root-cms/client';
import {FirebaseApp} from 'firebase-admin/app';
import {Firestore} from 'firebase-admin/firestore';

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
  firebaseApp: FirebaseApp;
  db: Firestore;
  cmsClient: RootCMSClient;
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

export type CMSDocument = Doc;
