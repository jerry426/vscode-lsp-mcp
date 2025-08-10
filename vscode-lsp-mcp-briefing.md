# VSC-LSP-MCP Extension Project Briefing

## Mission
Extend the `vsc-lsp-mcp` VSCode extension to expose additional Language Server Protocol (LSP) features through Model Context Protocol (MCP), enabling Claude Code and other AI assistants to access VSCode's built-in code intelligence features with **100-1000x performance improvements** over text-based searching.

## Background
Currently, Claude Code uses primitive text-based grep/glob searching which is orders of magnitude slower than VSCode's built-in Language Server Protocol features. VSCode already has all the code intelligence computed and indexed, but Claude can't access it. This forces expensive GPUs to do basic text searching while the local machine's computed intelligence sits unused.

## Current State
- Forked from: https://github.com/beixiyo/vsc-lsp-mcp
- This extension already exposes 5 core LSP features via MCP:
  - `get_hover` - Symbol hover information
  - `get_definition` - Find symbol definitions  
  - `get_completions` - Code completion
  - `get_references` - Find all references
  - `rename_symbol` - Rename across files

## Features to Add (Priority Order)

### High Priority - Implement First
1. **find_implementations** - Find all implementations of an interface/class
   - VSCode API: `vscode.executeImplementationProvider`
   - Use case: Understanding inheritance hierarchies

2. **find_workspace_symbols** - Search symbols across entire workspace
   - VSCode API: `vscode.executeWorkspaceSymbolProvider`
   - Use case: Finding any class/function/interface by name instantly

3. **get_document_symbols** - Get file outline/structure
   - VSCode API: `vscode.executeDocumentSymbolProvider`  
   - Use case: Understanding file structure without parsing

4. **get_call_hierarchy** - Trace function calls
   - VSCode APIs: `vscode.prepareCallHierarchy`, `vscode.provideIncomingCalls`, `vscode.provideOutgoingCalls`
   - Use case: Understanding execution flow

### Medium Priority
5. **get_type_definition** - Navigate to type definitions
   - VSCode API: `vscode.executeTypeDefinitionProvider`
   - Use case: Understanding TypeScript types

6. **get_code_actions** - Get available quick fixes
   - VSCode API: `vscode.executeCodeActionProvider`
   - Use case: Automated fixes and refactoring suggestions

7. **get_diagnostics** - Get errors/warnings for files
   - VSCode API: `vscode.languages.getDiagnostics`
   - Use case: Proactive error detection

### Lower Priority
8. **get_semantic_tokens** - Get semantic highlighting info
9. **get_folding_ranges** - Get code folding regions
10. **get_selection_ranges** - Get smart selection expansion

## Implementation Pattern
Each new feature follows this pattern:

```typescript
// 1. Add to tools definition in server.ts
tools: {
  find_implementations: {
    description: "Find all implementations of an interface/class",
    inputSchema: {
      type: "object",
      properties: {
        uri: { type: "string", description: "File URI" },
        line: { type: "number", description: "Line number (0-based)" },
        character: { type: "number", description: "Character position (0-based)" }
      },
      required: ["uri", "line", "character"]
    }
  }
}

// 2. Add handler function
async function handleFindImplementations(params: any) {
  const { uri, line, character } = params;
  const position = new vscode.Position(line, character);
  
  const implementations = await vscode.commands.executeCommand(
    'vscode.executeImplementationProvider',
    vscode.Uri.parse(uri),
    position
  );
  
  return formatLocations(implementations);
}

// 3. Add case to request handler
case 'find_implementations':
  return handleFindImplementations(params.arguments);
```

## Testing Approach
1. Install the extension in VSCode
2. Configure it to run as an MCP server
3. Test each feature with Claude Code or another MCP client
4. Verify results match VSCode's native "Go to Implementation" etc.

## Success Metrics
- Each feature should return results in <100ms (vs current 10-30 seconds with grep)
- Results should be semantically accurate (not text pattern matching)
- Should handle TypeScript, JavaScript, and ideally other languages

## Key Files to Modify
- `src/server.ts` - Main MCP server implementation
- `src/extension.ts` - VSCode extension activation
- `package.json` - Extension manifest
- `README.md` - Documentation

## Important Context
This project addresses a fundamental inefficiency in AI-assisted development where:
- Local VSCode has already computed all code intelligence
- But AI assistants can't access it and must use text search
- Resulting in 100-1000x slower performance
- And massive waste of compute resources, network bandwidth, and energy

The goal is to let each system do what it does best: VSCode handles code intelligence locally, Claude focuses on reasoning and problem-solving.

## Feature Request Reference
See GitHub issue: https://github.com/anthropics/claude-code/issues/5495
This documents the full case for why these VSCode APIs should be exposed.

## Next Steps
1. Review the existing codebase structure
2. Implement `find_implementations` as the first new feature
3. Test it works correctly
4. Continue with remaining high-priority features
5. Create PR back to original repo once features are stable