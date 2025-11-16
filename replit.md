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
The Replit environment is running the **docs package** with full CMS and MCP plugin functionality.

### Running Application
- **Port:** 5000
- **Package:** docs (Root.js documentation site)
- **Workflow:** cms-dev-server
- **CMS:** Available at http://localhost:5000/cms/
- **MCP Endpoint:** Available at http://localhost:5000/mcp/message

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
pnpm cms:dev              # Start CMS + docs dev server (current workflow)

# In docs/:
pnpm run dev              # Start development server
pnpm run build            # Build production bundle
pnpm run types            # Generate CMS types
```

### CMS + MCP Features
The current setup includes:
- **Full CMS functionality** with Firebase/Firestore backend
- **MCP Plugin** integrated and accessible at `/mcp/message`
- **AI Features** enabled (experimental)
- **Design System** accessible via CMS sidebar

To access the CMS:
1. Navigate to http://localhost:5000/cms/
2. Log in with your Firebase credentials
3. The MCP endpoint is available for AI integrations (requires authentication)

**Important Notes:**
- The docs package uses Firebase auth configured for rootjs.dev domain. You may need to add your Replit domain to the Firebase authorized domains in the Firebase Console, or update the firebaseConfig in `docs/root.config.ts` to use a test project.
- The MCP endpoint requires CMS authentication. See the [MCP documentation](./packages/root-cms-mcp/README.md) for usage details.
- The MCP plugin is successfully initialized and accessible at `/mcp/message` once authenticated.

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

### 2025-11-16 (MCP Plugin - Documentation)
- Created **comprehensive documentation** for Root CMS MCP plugin
- **REPLIT_AGENT.md**: Complete guide for using MCP with Replit Agent and other MCP clients
  - Three working authentication methods (session cookies, browser console, proxy)
  - Detailed JSON-RPC examples for all MCP capabilities
  - Use cases: content generation, migration, batch operations, reviews
  - Troubleshooting guide and security best practices
- **INTEGRATION.md**: Guide for enhancing Root CMS AI with MCP tool-calling
  - Integration patterns for Vertex AI/Genkit
  - Custom AI modes leveraging MCP capabilities
  - Examples: sequential workflows, parallel operations, error handling
  - Security considerations and testing strategies
- **Updated README.md** with quick-start examples and documentation links
- All documented workflows tested and verified as functional

### 2025-11-16 (MCP Plugin - Implementation)
- Created **@blinkk/root-cms-mcp** package as a Root.js plugin (not standalone server)
- Plugin integrates with existing CMS plugin to access Firebase/Firestore
- Implemented SimpleCMSClient for direct Firestore operations
- Added authenticated HTTP endpoint at `/mcp/message` for JSON-RPC 2.0 communication
- Exposed MCP resources (documents, collections, schemas), tools (CRUD operations), and prompts
- Security: Requires CMS authentication - only logged-in users can access endpoint
- No separate credentials needed - uses CMS plugin's Firebase configuration
- Package built successfully and ready for AI/automation integration

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
