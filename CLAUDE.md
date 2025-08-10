# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode LSP MCP is a Visual Studio Code extension that bridges Language Server Protocol (LSP) features with Model Context Protocol (MCP), enabling AI assistants to access VSCode's language intelligence with 100-1000x performance improvements over text-based searching.

**Mission**: Expose VSCode's already-computed code intelligence to AI assistants, eliminating the need for expensive text-based searching while leveraging local machine's indexed language features.

## Essential Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development build with watch mode
- `pnpm run build` - Production build
- `pnpm run lint` - Run ESLint
- `pnpm run test` - Run Vitest tests
- `pnpm run update` - Generate extension metadata from package.json

### Debugging
- Press F5 in VSCode to launch Extension Development Host
- The extension automatically builds before launching (configured in .vscode/tasks.json)

### Publishing
- `pnpm run publish` - Publish to VSCode marketplace
- `pnpm run release` - Version bump and publish

## Architecture

### Core Components

1. **Extension Entry** (`src/index.ts`): Minimal activation using reactive-vscode that starts the MCP server

2. **MCP Server** (`src/mcp/index.ts`): Express HTTP server with MCP integration
   - Session management with UUID-based IDs
   - Port conflict resolution (default 9527)
   - Streamable HTTP transport support

3. **LSP Bridge** (`src/lsp/*.ts`): Each file wraps a VSCode LSP command
   - `hover.ts` - Symbol hover information
   - `completion.ts` - Code completions
   - `definition.ts` - Find definitions
   - `references.ts` - Find references
   - `rename.ts` - Symbol renaming

4. **Tools Registry** (`src/mcp/tools.ts`): Registers LSP functions as MCP tools with Zod validation

### Key Design Patterns

- **LSP Wrapper Pattern**: Each LSP feature is wrapped in its own module under `src/lsp/`
- **Tool Registration**: All MCP tools are centralized in `src/mcp/tools.ts` using a consistent registration pattern
- **URI Handling**: Always encode/decode URIs when passing between VSCode and MCP layers
- **Session Management**: Each MCP client gets a unique session ID for isolation

## Development Guidelines

### Adding New LSP Features

1. Create a new file in `src/lsp/` (e.g., `src/lsp/implementations.ts`)
2. Wrap the VSCode command (e.g., `vscode.commands.executeCommand('vscode.executeImplementationProvider', ...)`)
3. Register the tool in `src/mcp/tools.ts` with appropriate Zod schema
4. Follow existing patterns for error handling and URI encoding

### Build System

- Uses `tsup` for fast TypeScript bundling
- CommonJS output format for VSCode compatibility
- All dependencies bundled except VSCode APIs
- Source maps enabled for debugging

### Testing

- Vitest for unit testing
- Test files should use `.test.ts` suffix
- Run individual tests with `pnpm test -- path/to/test`

## Configuration

Extension settings (in VSCode settings.json):
- `lsp-mcp.enabled`: Enable/disable server (default: true)
- `lsp-mcp.port`: Server port (default: 9527)
- `lsp-mcp.maxRetries`: Port retry attempts (default: 10)

## Important Notes

- The extension automatically handles port conflicts by trying successive ports
- Multiple VSCode instances can run simultaneously with different ports
- The MCP server URL for AI tools: `http://127.0.0.1:{port}/mcp`
- All LSP operations require an active text editor with the target file open
- URI parameters in MCP tools must be properly encoded file:// URIs
- Python test client available as `lsp_mcp_client.py` for debugging

## Roadmap - Features to Implement

### High Priority
1. **find_implementations** - Find all implementations of an interface/class (`vscode.executeImplementationProvider`)
2. **find_workspace_symbols** - Search symbols across workspace (`vscode.executeWorkspaceSymbolProvider`)
3. **get_document_symbols** - Get file outline/structure (`vscode.executeDocumentSymbolProvider`)
4. **get_call_hierarchy** - Trace function calls (`vscode.prepareCallHierarchy`)

### Medium Priority
5. **get_type_definition** - Navigate to type definitions (`vscode.executeTypeDefinitionProvider`)
6. **get_code_actions** - Get available quick fixes (`vscode.executeCodeActionProvider`)
7. **get_diagnostics** - Get errors/warnings (`vscode.languages.getDiagnostics`)

### Lower Priority
8. **get_semantic_tokens** - Semantic highlighting info
9. **get_folding_ranges** - Code folding regions
10. **get_selection_ranges** - Smart selection expansion

Reference: GitHub issue https://github.com/anthropics/claude-code/issues/5495