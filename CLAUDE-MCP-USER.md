# VSCode LSP MCP Tools Usage Guide

## 🚨 CRITICAL: Use MCP/LSP Tools for Code Navigation

**This project has VSCode LSP MCP tools available. These MUST be your PRIMARY method for code navigation and understanding.**

The MCP server provides direct access to VSCode's Language Server Protocol features, offering 100-1000x performance improvements over text-based searching with semantic understanding of code.

## MCP Server Connection

- **Server URL**: `http://127.0.0.1:9527/mcp`
- **Auto-routing**: The proxy automatically routes to the correct VSCode instance based on workspace

## Required: Use These MCP Tools FIRST

**ALWAYS attempt to use MCP tools before falling back to grep/glob/find/read commands.**

### Tool Priority Map

| Task | USE THIS MCP Tool | NOT grep/glob/find |
|------|------------------|-------------------|
| **Search for any symbol by name** | `find_workspace_symbols` | ❌ Don't grep for symbol names |
| Find where a function/variable/class is defined | `get_definition` | ❌ Don't grep for "function name" |
| Find all places where something is used | `get_references` | ❌ Don't grep for text matches |
| Understand what a symbol is/does | `get_hover` | ❌ Don't read multiple files |
| Get code suggestions at a position | `get_completions` | ❌ Don't guess what's available |
| Rename a symbol throughout codebase | `rename_symbol` | ❌ Don't find/replace text |

### Why MCP Tools Are Superior

1. **Type-aware**: Understands language semantics, not just text
2. **Instant**: Leverages VSCode's pre-computed indexes
3. **Accurate**: Handles imports, scopes, overloads correctly
4. **Complete**: Finds ALL references, not just text matches
5. **Safe**: Refactoring tools ensure consistency

## Workflow Examples

### When Exploring a Codebase

```
WRONG ❌:
1. Use grep to search for class name
2. Read multiple files to understand structure
3. Use find to locate implementations

RIGHT ✅:
1. Use get_definition to jump to the class
2. Use get_hover to understand its purpose and API
3. Use get_references to see usage patterns
```

### When Refactoring Code

```
WRONG ❌:
1. Search for all occurrences with grep
2. Manually edit each file
3. Hope you didn't miss any

RIGHT ✅:
1. Use get_references to find ALL usages
2. Use rename_symbol for automatic refactoring
3. Let the language server handle it safely
```

### When Understanding Complex Code

```
WRONG ❌:
1. Read file after file trying to trace logic
2. Grep for function calls
3. Manually trace through imports

RIGHT ✅:
1. Use get_hover for instant documentation
2. Use get_definition to jump to implementations
3. Use get_references to understand usage context
```

## MCP Tool Parameters

### Tools that DON'T need location (search by name):

```json
{
  "query": "ProxyClient"  // Just the symbol name or partial name
}
```
- `find_workspace_symbols` - Search by name, returns locations

### Tools that DO need precise location:

```json
{
  "uri": "file:///absolute/path/to/file.ts",  // Full file:// URI
  "line": 42,                                  // 0-indexed line number
  "character": 15                              // 0-indexed character position
}
```
- `get_definition` - Needs position of symbol
- `get_references` - Needs position of symbol
- `get_hover` - Needs position to hover over
- `get_completions` - Needs cursor position
- `rename_symbol` - Needs position of symbol to rename

### Typical Workflow

1. **Start with name search** (no location needed):
   ```
   find_workspace_symbols("ProxyClient")  // Returns all matches with locations
   ```

2. **Use returned locations** with other tools:
   - `get_definition` with a location to see the implementation
   - `get_references` with a location to find all usages
   - `get_hover` with a location for documentation

## Tool Descriptions

### find_workspace_symbols 🆕 PRIMARY ENTRY POINT
- **Purpose**: Search for symbols by name across entire workspace
- **Use when**: Looking for any class, function, variable, type, etc.
- **Returns**: All matching symbols with their locations
- **Example**: `find_workspace_symbols("ProxyClient")` finds all ProxyClient symbols

### get_definition
- **Purpose**: Jump directly to where something is defined
- **Use when**: You need to find the source/implementation
- **Returns**: Location(s) where the symbol is defined

### get_references
- **Purpose**: Find ALL places where something is used
- **Use when**: Understanding impact, refactoring, or tracing usage
- **Returns**: Every location that references the symbol

### get_hover
- **Purpose**: Get type info, documentation, and signatures
- **Use when**: Understanding what something is/does
- **Returns**: Documentation, types, and relevant information

### get_completions
- **Purpose**: Get context-aware code suggestions
- **Use when**: Need to know available methods/properties
- **Returns**: List of valid completions at position

### rename_symbol
- **Purpose**: Safely rename across entire codebase
- **Use when**: Refactoring names consistently
- **Returns**: All locations that were updated

## Decision Tree

```
Need to find something in code?
├─ Is it a symbol (function/class/variable)?
│  ├─ YES → Start with find_workspace_symbols
│  │  ├─ Don't know location? → find_workspace_symbols FIRST
│  │  ├─ Have location, need definition? → get_definition
│  │  ├─ Have location, need usages? → get_references
│  │  ├─ Have location, need docs? → get_hover
│  │  └─ Want to rename? → rename_symbol
│  └─ NO → Is it a text pattern?
│     ├─ YES → Try find_workspace_symbols first, then grep
│     └─ NO → Use appropriate tool
└─ Need to browse/explore?
   ├─ Looking for symbols? → find_workspace_symbols
   └─ Looking for files? → Use glob/ls
```

## Performance Comparison

| Operation | MCP Tool Time | Grep/Search Time | Improvement |
|-----------|--------------|------------------|-------------|
| Find definition | ~10ms | 1-10s | 100-1000x |
| Find all references | ~50ms | 10-60s | 200-1200x |
| Get documentation | ~5ms | N/A (manual) | ∞ |
| Safe rename | ~100ms | Minutes (manual) | 1000x+ |

## ⚠️ Important Reminders

1. **MCP tools work on any file in the workspace** - The language server has already indexed your entire project
2. **Current tools need a starting position** - You must provide a file location where the symbol appears (line/character). Future tools like `find_workspace_symbols` will search by name
3. **URIs must be absolute** - Always use full file:// paths
4. **Try MCP first, fall back to search** - Even if unsure, try MCP tools first
5. **The proxy handles routing** - You don't need to worry about which VSCode instance

## Integration Instructions for Your Project

To enable MCP tools for your project:

1. Install the VSCode LSP MCP extension in VSCode
2. Ensure the extension is running (check status bar)
3. Add this guide to your project's CLAUDE.md or AI instructions
4. The MCP server will be available at `http://127.0.0.1:9527/mcp`

---

**Remember**: Every time you use grep/find instead of MCP tools, you're choosing the slow, inaccurate path. The language server has already indexed and understood your code - use it!