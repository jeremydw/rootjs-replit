# Root.js Monorepo

## Overview
Root.js is a full-featured web development tool with a built-in CMS. This is a monorepo containing multiple packages and examples that demonstrate the capabilities of the Root.js framework.

**Key Features:**
- TSX Rendering
- Web Components
- File Routes
- i18n (Internationalization)
- CMS (Content Management System)

## Project Structure
This monorepo uses pnpm workspaces and includes:
- `packages/` - Core packages (@blinkk/root, @blinkk/root-cms, @blinkk/create-root, etc.)
- `examples/` - Example applications (starter, blog, cms, minimal, basepath)
- `docs/` - Documentation website (requires Firebase configuration)
- `apps/` - Additional applications

## Current Setup
The Replit environment is running the **starter example** application, which demonstrates a basic Root.js application without CMS functionality.

### Running Application
- **Port:** 5000
- **Example:** examples/starter
- **Workflow:** starter-dev-server

## Development

### Prerequisites
- Node.js v20.19.3
- pnpm 8.9.0 (installed globally)

### Getting Started
1. Dependencies are already installed via `pnpm install`
2. Packages are built via `pnpm run build`
3. The dev server runs automatically via the workflow

### Available Commands
```bash
# In the workspace root:
pnpm install              # Install dependencies
pnpm run build            # Build all packages
pnpm run test             # Run tests

# In examples/starter:
pnpm run dev              # Start development server
pnpm run build            # Build production bundle
pnpm run start            # Start production server
pnpm run preview          # Preview production build
```

### Working with Other Examples
To run different examples:
1. Update the workflow command to point to a different example folder
2. Ensure the example's root.config.ts has proper Vite server configuration:
   ```typescript
   vite: {
     server: {
       host: '0.0.0.0',
       allowedHosts: true,
     }
   }
   ```

**Note:** The `docs` example requires Firebase configuration and won't work without proper credentials.

## Architecture

### Technology Stack
- **Framework:** Preact (React alternative)
- **Build Tool:** Vite 7.1.4
- **Bundler:** esbuild & tsup
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Monorepo Tool:** Turbo
- **Styling:** SCSS

### Key Packages
- **@blinkk/root** - Core framework for rendering, routing, and SSR
- **@blinkk/root-cms** - CMS plugin with Firebase/Firestore integration
- **@blinkk/root-cms-mcp** - Model Context Protocol server for Root CMS (NEW)
- **@blinkk/create-root** - CLI for creating new Root.js projects
- **@blinkk/rds** - Design system components

## Deployment
The project is configured for autoscale deployment on Replit:
- **Target:** autoscale (stateless web application)
- **Build:** Builds the starter example application
- **Run:** Starts the production server on port 5000

## Recent Changes

### 2025-11-16 (MCP Server)
- Created **@blinkk/root-cms-mcp** package with complete MCP server implementation
- Implemented SimpleCMSClient for standalone Firestore operations (bypasses RootCMSClient)
- Added MCP resources (documents, collections, schemas), tools (CRUD operations), and prompts
- Package built successfully and ready for integration with AI/automation tools
- Uses minimal dependencies: @modelcontextprotocol/sdk and firebase-admin

### 2024-11-16 (Initial Setup)
- Installed pnpm 8.9.0 and all project dependencies
- Built all packages using turbo
- Configured examples/starter for Replit environment:
  - Added Vite server configuration for proxy compatibility (host: 0.0.0.0, allowedHosts: true)
  - Fixed SCSS preprocessor deprecation warning (includePaths → loadPaths)
- Set up workflow to run starter example on port 5000
- Configured deployment settings for autoscale deployment

## Links
- [Official Documentation](https://rootjs.dev)
- [GitHub Repository](https://github.com/blinkk/rootjs)
- [Contributing Guide](CONTRIBUTING.md)
