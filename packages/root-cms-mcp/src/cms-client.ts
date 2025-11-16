import type {Firestore} from 'firebase-admin/firestore';
import {Timestamp} from 'firebase-admin/firestore';

/**
 * Simplified CMS client for MCP server that works directly with Firestore.
 * This bypasses the need for RootConfig and RootCMSClient.
 */
export class SimpleCMSClient {
  constructor(
    private db: Firestore,
    readonly projectId: string
  ) {}

  async getDoc(
    collectionId: string,
    slug: string,
    options: {mode?: 'draft' | 'published'} = {}
  ) {
    const mode = options.mode || 'draft';
    const modeCollection = mode === 'draft' ? 'Drafts' : 'Published';
    const encodedSlug = slug.replaceAll('/', '--');
    const dbPath = `Projects/${this.projectId}/Collections/${collectionId}/${modeCollection}/${encodedSlug}`;
    
    const docRef = this.db.doc(dbPath);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      // Return normalized document with metadata
      return {
        ...data,
        slug: slug,
        collection: collectionId,
      };
    }
    return null;
  }

  async listDocs(
    collectionId: string,
    options: {mode?: 'draft' | 'published'; limit?: number; offset?: number} = {}
  ) {
    const mode = options.mode || 'draft';
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const modeCollection = mode === 'draft' ? 'Drafts' : 'Published';
    
    const dbPath = `Projects/${this.projectId}/Collections/${collectionId}/${modeCollection}`;
    const snapshot = await this.db
      .collection(dbPath)
      .limit(limit)
      .offset(offset)
      .get();
    
    // Return normalized documents with metadata
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const encodedSlug = doc.id;
      const slug = encodedSlug.replaceAll('--', '/');
      return {
        ...data,
        slug: slug,
        collection: collectionId,
      };
    });
  }

  async saveDraft(
    collection: string,
    slug: string,
    fields: Record<string, any>,
    options: {locales?: string[]; modifiedBy?: string} = {}
  ) {
    const encodedSlug = slug.replaceAll('/', '--');
    const dbPath = `Projects/${this.projectId}/Collections/${collection}/Drafts/${encodedSlug}`;
    const docRef = this.db.doc(dbPath);
    
    const now = Timestamp.now();
    const data = {
      fields,
      sys: {
        modifiedAt: now,
        modifiedBy: options.modifiedBy || 'mcp-server',
        locales: options.locales || [],
      },
    };

    const existing = await docRef.get();
    if (existing.exists) {
      await docRef.update(data);
    } else {
      await docRef.set({
        ...data,
        sys: {
          ...data.sys,
          createdAt: now,
          createdBy: options.modifiedBy || 'mcp-server',
        },
      });
    }
  }

  async publish(
    collection: string,
    slug: string,
    options: {publishedBy?: string} = {}
  ) {
    const encodedSlug = slug.replaceAll('/', '--');
    const draftPath = `Projects/${this.projectId}/Collections/${collection}/Drafts/${encodedSlug}`;
    const publishedPath = `Projects/${this.projectId}/Collections/${collection}/Published/${encodedSlug}`;
    
    const draftDoc = await this.db.doc(draftPath).get();
    if (!draftDoc.exists) {
      throw new Error(`Draft document not found: ${collection}/${slug}`);
    }
    
    const data = draftDoc.data();
    const now = Timestamp.now();
    
    await this.db.doc(publishedPath).set({
      ...data,
      sys: {
        ...data!.sys,
        publishedAt: now,
        publishedBy: options.publishedBy || 'mcp-server',
      },
    });
  }

  async deleteDoc(collection: string, slug: string) {
    const encodedSlug = slug.replaceAll('/', '--');
    
    const draftPath = `Projects/${this.projectId}/Collections/${collection}/Drafts/${encodedSlug}`;
    const publishedPath = `Projects/${this.projectId}/Collections/${collection}/Published/${encodedSlug}`;
    
    await Promise.all([
      this.db.doc(draftPath).delete(),
      this.db.doc(publishedPath).delete(),
    ]);
  }

  async listCollections() {
    const collectionsPath = `Projects/${this.projectId}/Collections`;
    const snapshot = await this.db.collection(collectionsPath).listDocuments();
    return snapshot.map(doc => doc.id);
  }

  async getSchema(collection: string) {
    const schemaPath = `Projects/${this.projectId}/Collections/${collection}`;
    const schemaDoc = await this.db.doc(schemaPath).get();
    
    if (schemaDoc.exists) {
      const data = schemaDoc.data();
      return data?.schema || null;
    }
    return null;
  }
}
