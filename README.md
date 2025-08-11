# VSCode LSP MCP

A Visual Studio Code extension that bridges Language Server Protocol (LSP) features with Model Context Protocol (MCP), enabling AI assistants to access VSCode's language intelligence with **100-1000x performance improvements** over text-based searching.

## Features

This extension exposes VSCode's Language Server Protocol features through MCP, providing AI assistants with:

- **Code Completions** (`get_completions`) - Get intelligent code suggestions at any position
- **Hover Information** (`get_hover`) - Access documentation and type information  
- **Go to Definition** (`get_definition`) - Navigate to symbol definitions
- **Find References** (`get_references`) - Locate all usages of a symbol
- **Find Implementations** (`find_implementations`) - Find all implementations of an interface/class
- **Symbol Rename** (`rename_symbol`) - Refactor symbols across the workspace
- **Text Search** (`search_text`) - Search for text patterns across all files

### Performance Benefits

- **Instant results**: <100ms response time vs 10-30 seconds with grep
- **Semantic accuracy**: Real code intelligence, not text pattern matching
- **Zero additional cost**: Leverages existing VSCode computation
- **Works with closed files**: No need to have files open in the editor

## Installation

1. Install from VSCode Marketplace (when published)
2. Or build from source:
   ```bash
   pnpm install
   pnpm run build
   ```

## Usage

### For AI Assistants (MCP Clients)

The extension starts an MCP server automatically when VSCode opens. Default port is 9527.

Connect your MCP client to:
```
http://127.0.0.1:9527/mcp
```

### Multi-Workspace Support

For multiple VSCode instances, create a `mcp_workspace_id` file in your project root:
```bash
echo "unique-workspace-id" > mcp_workspace_id
```

Then use the discovery endpoint to find the correct port:
```bash
curl http://127.0.0.1:9527/workspace-info
```

## Available MCP Tools

All tools work with files directly from disk - no need to have them open in VSCode.

### Position-Based Tools

These tools require a file URI and position (line/character):

#### `get_hover`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15
}
```
Returns: Type information, documentation, and signatures

#### `get_completions`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15
}
```
Returns: Context-aware code completion suggestions

#### `get_definition`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15
}
```
Returns: Location(s) where the symbol is defined

#### `get_references`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15
}
```
Returns: All locations where the symbol is used

#### `find_implementations`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15
}
```
Returns: All locations where the interface/class is implemented

#### `rename_symbol`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15,
  "newName": "newSymbolName"
}
```
Returns: Edit operations to rename across all files

### Search Tools

#### `search_text`
```json
{
  "query": "searchTerm",
  "useRegExp": false,
  "isCaseSensitive": false,
  "matchWholeWord": false,
  "maxResults": 100,
  "includes": ["**/*.ts"],
  "excludes": ["node_modules/**"]
}
```
Returns: File locations and positions matching the search

## Configuration

VSCode settings:

- `lsp-mcp.enabled` - Enable/disable the MCP server (default: `true`)
- `lsp-mcp.port` - Server port (default: `9527`)
- `lsp-mcp.maxRetries` - Port retry attempts if occupied (default: `10`)

## Testing

Test all MCP tools:
```bash
python3 test_mcp_tools.py
```

Expected output:
```
✓ Hover works - returned documentation
✓ Completions works - returned 193 items
✓ Definition works - found 1 location(s)
✓ References works - found 5 reference(s)
✓ Implementations works - interface/class implementations
✓ Text search works - found 6 match(es)
```

## Architecture

```
┌─────────────┐     MCP/HTTP      ┌──────────────┐
│ AI Assistant│ ◄──────────────► │  MCP Server  │
│ (e.g. Claude)│                   │ (Port 9527)  │
└─────────────┘                   └──────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ LSP Bridge   │
                                   │  (TypeScript)│
                                   └──────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ VSCode LSP   │
                                   │     APIs     │
                                   └──────────────┘
```

Key design principles:
- **Direct URI parsing**: Files don't need to be open in VSCode
- **Session management**: Each MCP client gets an isolated session
- **Consistent formatting**: All responses return JSON-serialized data
- **Error resilience**: Graceful handling of missing files or invalid positions

## Development

```bash
# Install dependencies
pnpm install

# Development with watch mode
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Lint code
pnpm run lint

# Type checking
pnpm run typecheck
```

### Project Structure

```
src/
├── index.ts           # Extension entry point
├── mcp/
│   ├── index.ts      # MCP server implementation
│   └── tools.ts      # Tool registrations
├── lsp/
│   ├── hover.ts      # Hover information
│   ├── completion.ts # Code completions
│   ├── definition.ts # Go to definition
│   ├── references.ts # Find references
│   ├── rename.ts     # Symbol rename
│   └── text-search.ts # Text search
└── utils/
    └── index.ts      # Logging utilities
```

## Roadmap

### High Priority
- [x] `find_implementations` - Find all implementations of an interface ✅ (v0.0.6)
- [ ] `get_document_symbols` - Get file outline/structure
- [ ] `get_call_hierarchy` - Trace function calls
- [ ] `get_type_definition` - Navigate to type definitions

### Medium Priority
- [ ] `get_code_actions` - Get available quick fixes
- [ ] `get_diagnostics` - Get errors/warnings
- [ ] `get_semantic_tokens` - Semantic highlighting info

## Contributing

Contributions welcome! Please check the roadmap above for features to implement.

## License

MIT