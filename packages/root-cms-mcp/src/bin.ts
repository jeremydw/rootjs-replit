#!/usr/bin/env node

import {RootCMSMCPServer} from './server.js';
import {MCPServerConfig} from './types.js';

async function main() {
  const config: MCPServerConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    cmsProjectId: process.env.CMS_PROJECT_ID || 'default',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    databaseId: process.env.FIRESTORE_DATABASE_ID,
  };

  if (!config.projectId) {
    console.error('Error: FIREBASE_PROJECT_ID environment variable is required');
    process.exit(1);
  }

  const server = new RootCMSMCPServer(config);
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
