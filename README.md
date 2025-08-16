# Token Saver MCP - Stop Wasting AI Tokens

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/jerry426/token-saver-mcp)](https://github.com/jerry426/token-saver-mcp)

> **Stop watching AI burn thousands of tokens on simple code searches.**

## The Hidden Cost You Don't See

Every time your AI assistant searches your code, it's:
- 🔥 **Burning thousands of tokens** on grep/find commands
- ⏰ **Making you wait 10-30 seconds** for simple answers
- 💸 **Costing you money** in API fees
- 🔄 **Repeatedly searching** the same code

**Meanwhile, VSCode already knows everything about your code.**

Token Saver MCP gives AI instant access to that knowledge. No searching. No waiting. No token waste.

## What This Extension Does

Token Saver MCP bridges Language Server Protocol (LSP) with Model Context Protocol (MCP), giving AI assistants direct access to VSCode's already-indexed code intelligence - delivering answers in **milliseconds instead of seconds** with **90% fewer tokens**.

## Proven Results

- ⚡ **100-1000x faster** than text-based searching
- 🎯 **12 production-ready tools** 
- 🛡️ **Intelligent buffer protection** prevents token overflow
- 🔄 **Zero configuration** for single projects

## Real-World Performance

| Operation | Traditional Approach | With Token Saver MCP | Your Time Saved |
|-----------|---------------------|---------------------|-----------------|
| Find where a function is defined | 5-10 seconds | **10ms** | ☕ Make coffee |
| Find all usages of a variable | 10-30 seconds | **50ms** | 💭 Keep your flow |
| Get type information | Manual lookup | **5ms** | ⚡ Instant |
| Rename across entire project | Several minutes | **100ms** | 🚀 Already done |
| Search for text patterns | 2-15 seconds | **30ms** | 📈 100x faster |

## Token & Cost Savings Calculator

| Metric | Without Token Saver | With Token Saver | Your Savings |
|--------|-------------------|------------------|--------------|
| Tokens per search | ~5,000 tokens | ~50 tokens | **99% fewer** |
| Cost per search (GPT-4) | $0.15 | $0.0015 | **$0.1485** |
| Daily searches (avg) | 50 | 50 | - |
| **Daily cost** | **$7.50** | **$0.075** | **$7.43 saved** |
| **Monthly cost** | **$225** | **$2.25** | **$222.75 saved** |
| **Yearly cost** | **$2,700** | **$27** | **$2,673 saved** |

*Based on typical development patterns and AI code assistant pricing. Your savings may vary.

## Before & After Comparison

### ❌ **Before Token Saver MCP** - What You're Doing Now
```
AI: "Let me search for that function definition..."
> Running: grep -r "functionName" . --include="*.ts"
> [10 seconds pass...]
> Found 47 matches, let me search more specifically...
> Running: find . -name "*.ts" -exec grep -l "function functionName" {} \;
> [15 more seconds...]
> Tokens used: 5,000+
> Time wasted: 25 seconds
> Result: Maybe found it, maybe not
```

### ✅ **After Token Saver MCP** - Instant Intelligence
```
AI: "Getting definition..."
> Using: get_definition at file.ts:42:15
> [10ms]
> Tokens used: 50
> Time: Instant
> Result: Exact location with type info
```

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
- **Supported Languages** (`get_supported_languages`) - Get all registered languages and their status

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
- **Works across your workspace**: After activating the Language Server (by opening one file of that type), all files are accessible

## 🚀 Get Started in 30 Seconds

```bash
# One command does everything:
./mcp setup /path/to/your/project
```

That's it! The extension automatically:
- ✅ Finds an available port
- ✅ Creates configuration files
- ✅ Tests the connection
- ✅ Provides the Claude command

## Installation

1. Install from VSCode Marketplace (when published)
2. Or build from source:
   ```bash
   pnpm install
   pnpm run build
   ```

## Usage

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

> **Important:** The Language Server for each language must be activated first. Open at least one file of that language type (e.g., `.ts`, `.py`, `.go`) in VSCode to activate its Language Server. Once activated, the MCP tools can work with any file of that type in your workspace, even if they're not currently open.

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

#### `get_supported_languages`
```json
{}  // No parameters required
```
Returns: All languages registered in VSCode organized by category, active languages in workspace, and total count

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
- **Language Server activation**: Open one file of each language type to activate its LSP
- **Workspace-wide access**: Once LSP is active, all files of that type are accessible
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

## Troubleshooting

**Extension not responding?**
```bash
# Check if MCP server is running
python3 test/find_mcp_servers.py
```

**Need a specific port?**
```bash
echo "9527" > .lsp_mcp_port
```

**Port already in use?**
- Check `.lsp_mcp_port` file or let extension auto-increment from default port

**MCP tools not responding?**
- Ensure VSCode has the workspace open
- **Open at least one file of the target language** to activate its Language Server
- Check extension is enabled in settings (`lsp-mcp.enabled`)
- Verify the MCP server is running on the expected port

**Claude Code stuck on "connecting..." or showing "failed"?**
- **Reload the VSCode window** with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux) to restart the extension and MCP server
- This clears any stale connection states and forces a fresh initialization
- After reloading, restart Claude Code in your project terminal

**Large responses causing issues?**
- Responses over 2,500 tokens are automatically buffered
- Use the returned `bufferId` with `retrieve_buffer` tool to get full data
- Check buffer stats with `get_buffer_stats` tool

**Testing the connection:**
```bash
# Run the comprehensive test suite
python3 test/test_mcp_tools.py
```

## Contributing

Contributions welcome! Please check the roadmap above for features to implement.

## License

MIT