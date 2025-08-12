# VSCode LSP MCP

A Visual Studio Code extension that bridges Language Server Protocol (LSP) features with Model Context Protocol (MCP), enabling AI assistants to access VSCode's language intelligence with **100-1000x performance improvements** over text-based searching.

## Features

This extension exposes VSCode's Language Server Protocol features through MCP, providing AI assistants with **12 powerful tools**:

- **Code Completions** (`get_completions`) - Get intelligent code suggestions at any position
- **Hover Information** (`get_hover`) - Access documentation and type information  
- **Go to Definition** (`get_definition`) - Navigate to symbol definitions
- **Find References** (`get_references`) - Locate all usages of a symbol
- **Find Implementations** (`find_implementations`) - Find all implementations of an interface/class
- **Document Symbols** (`get_document_symbols`) - Get file structure with all symbols hierarchically
- **Call Hierarchy** (`get_call_hierarchy`) - Trace incoming/outgoing function calls
- **Symbol Rename** (`rename_symbol`) - Refactor symbols across the workspace
- **Text Search** (`search_text`) - Search for text patterns across all files
- **Buffer Retrieval** (`retrieve_buffer`) - Retrieve full data from buffered responses
- **Buffer Statistics** (`get_buffer_stats`) - Monitor buffer system usage
- **Get Instructions** (`get_instructions`) - Self-documenting API returns complete usage guide

### Intelligent Buffer System

The extension includes a sophisticated buffer system to prevent token overflow:

- **Automatic buffering** for responses over 2,500 tokens (~10KB)
- **Smart previews** with tool-specific intelligent summaries
- **Depth truncation** to limit deeply nested data structures
- **Session-based isolation** for multiple concurrent users
- **60-second TTL** with automatic cleanup

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

### Quick Start - Automatic Setup

**One command sets up everything:**
```bash
./mcp setup /path/to/your/project
```

This automatically:
- Finds an available port
- Creates configuration files
- Generates the Claude command
- Tests the connection
- Optionally configures Claude

### Status Dashboard

**See all your MCP-enabled projects:**
```bash
./mcp status
```

Shows which projects are configured, running, and connected to Claude.

### Multiple Projects Setup

Each project needs its own unique port number:

1. **Assign unique ports to each project:**
   ```bash
   # Project A
   echo "9527" > /path/to/project-a/.lsp_mcp_port
   
   # Project B  
   echo "9528" > /path/to/project-b/.lsp_mcp_port
   
   # Project C
   echo "9529" > /path/to/project-c/.lsp_mcp_port
   ```

2. **Set up Claude for each project:**
   ```bash
   # Get the Claude command for each project
   ./mcp claude /path/to/project-a
   
   ./mcp claude /path/to/project-b
   ```

3. **The extension will automatically use the port from `.lsp_mcp_port`** when you open each project

### Port Discovery

To see all running MCP servers:
```bash
python3 test/find_mcp_servers.py
```

This shows which ports are actually in use and their workspace paths.

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

#### `get_call_hierarchy`
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 15,
  "direction": "incoming"  // or "outgoing"
}
```
Returns: Function call relationships - incoming shows callers, outgoing shows callees

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

### Document-Level Tools

#### `get_document_symbols`
```json
{
  "uri": "file:///path/to/file.ts"
}
```
Returns: Hierarchical structure of all symbols in the file (classes, methods, properties, etc.)

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

### Buffer Management Tools

#### `retrieve_buffer`
```json
{
  "bufferId": "get_document_symbols_1754955026362_z2ksv6t8z"
}
```
Returns: Complete original data from a buffered response

#### `get_buffer_stats`
```json
{}  // No parameters required
```
Returns: Active buffer count, total size, oldest buffer age

### Self-Documentation Tool

#### `get_instructions`
```json
{}  // No parameters required
```
Returns: Complete CLAUDE-MCP-USER.md guide with all usage instructions

## Configuration

VSCode settings:

- `lsp-mcp.enabled` - Enable/disable the MCP server (default: `true`)
- `lsp-mcp.port` - Server port (default: `9527`)
- `lsp-mcp.maxRetries` - Port retry attempts if occupied (default: `10`)

## Testing

Test all MCP tools:
```bash
python3 test/test_mcp_tools.py
```

Expected output:
```
✓ Hover works - returned documentation
✓ Completions works - returned 193 items
✓ Definition works - found 1 location(s)
✓ References works - found 5 reference(s)
✓ Implementations works - interface/class implementations
✓ Document symbols works - found 10 top-level symbol(s)
✓ Text search works - found 6 match(es)
✓ Call hierarchy works - target: startMcp, 2 call(s)
✓ Rename works - would affect 2 file(s)
✓ Buffer system works - response buffered (8744 tokens)
✓ retrieve_buffer works - retrieved 21 items
✓ Buffer stats works - 3 active buffer(s)
🎉 SUCCESS! All 12 tools are working!
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
│   ├── tools.ts      # Tool registrations
│   └── buffer-manager.ts # Intelligent buffer system
├── lsp/
│   ├── hover.ts          # Hover information
│   ├── completion.ts     # Code completions
│   ├── definition.ts     # Go to definition
│   ├── references.ts     # Find references
│   ├── implementations.ts # Find implementations
│   ├── document-symbols.ts # File structure
│   ├── call-hierarchy.ts # Call tracing
│   ├── rename.ts         # Symbol rename
│   └── text-search.ts    # Text search
└── utils/
    └── index.ts      # Logging utilities
```

## Roadmap

### High Priority
- [x] `find_implementations` - Find all implementations of an interface ✅ (v0.0.6)
- [x] `get_document_symbols` - Get file outline/structure ✅ (v0.0.10)
- [x] `get_call_hierarchy` - Trace function calls ✅ (v0.0.11)
- [ ] `get_type_definition` - Navigate to type definitions

### Medium Priority
- [ ] `get_code_actions` - Get available quick fixes
- [ ] `get_diagnostics` - Get errors/warnings
- [ ] `get_semantic_tokens` - Semantic highlighting info

## Contributing

Contributions welcome! Please check the roadmap above for features to implement.

## License

MIT