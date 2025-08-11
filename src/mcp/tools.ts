import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  getCallHierarchy,
  getCompletions,
  getDefinition,
  getDocumentSymbols,
  getHover,
  getImplementations,
  getReferences,
  rename,
  searchText,
} from '../lsp'

const uriDesc = `The file URI in encoded format:
- Windows: "file:///c%3A/path/to/file.ts" (drive letter and colon, ":" encoded as "%3A")
- Unix-like: "file:///home/user/file.ts"
Must start with "file:///" and have special characters URI-encoded`

export function addLspTools(server: McpServer) {
  server.registerTool(
    'get_completions',
    {
      title: 'Get Code Completions',
      description: 'Get code completion suggestions for a given position in a document.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
      },
    },
    async ({ uri, line, character }) => {
      const result = await getCompletions(uri, line, character)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_definition',
    {
      title: 'Get Definition',
      description: 'Get the definition location of a symbol.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
      },
    },
    async ({ uri, line, character }) => {
      const result = await getDefinition(uri, line, character)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_hover',
    {
      title: 'Get Hover Information',
      description: 'Get hover information for a symbol at a given position.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
      },
    },
    async ({ uri, line, character }) => {
      const result = await getHover(uri, line, character)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_references',
    {
      title: 'Get References',
      description: 'Find all references to a symbol.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
      },
    },
    async ({ uri, line, character }) => {
      const result = await getReferences(uri, line, character)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'get_document_symbols',
    {
      title: 'Get Document Symbols',
      description: 'Get all symbols (classes, methods, functions, variables, etc.) in a document with hierarchical structure.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
      },
    },
    async ({ uri }) => {
      const result = await getDocumentSymbols(uri)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_call_hierarchy',
    {
      title: 'Get Call Hierarchy',
      description: 'Trace function calls - find who calls a function (incoming) or what a function calls (outgoing).',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
        direction: z.enum(['incoming', 'outgoing']).optional().describe('Direction: "incoming" for callers, "outgoing" for callees (default: incoming)'),
      },
    },
    async ({ uri, line, character, direction }) => {
      const result = await getCallHierarchy(uri, line, character, direction || 'incoming')
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'find_implementations',
    {
      title: 'Find Implementations',
      description: 'Find all implementations of an interface or abstract class.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
      },
    },
    async ({ uri, line, character }) => {
      const result = await getImplementations(uri, line, character)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'rename_symbol',
    {
      title: 'Rename Symbol',
      description: 'Rename a symbol across the workspace.',
      inputSchema: {
        uri: z.string().describe(uriDesc),
        line: z.number().describe('The line number (0-based).'),
        character: z.number().describe('The character position (0-based).'),
        newName: z.string().describe('The new name for the symbol.'),
      },
    },
    async ({ uri, line, character, newName }) => {
      const result = await rename(uri, line, character, newName)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    },
  )

  server.registerTool(
    'search_text',
    {
      title: 'Search Text in Files',
      description: 'Search for text across all files in the workspace. Returns file locations and positions that can be used with other tools like get_definition or get_references.',
      inputSchema: {
        query: z.string().describe('The text pattern to search for'),
        useRegExp: z.boolean().optional().describe('Use regular expression pattern (default: false)'),
        isCaseSensitive: z.boolean().optional().describe('Case sensitive search (default: false)'),
        matchWholeWord: z.boolean().optional().describe('Match whole word only (default: false)'),
        maxResults: z.number().optional().describe('Maximum number of results (default: 100)'),
        includes: z.array(z.string()).optional().describe('Glob patterns to include (e.g., ["**/*.ts"])'),
        excludes: z.array(z.string()).optional().describe('Glob patterns to exclude (default: node_modules, .git, dist, out)'),
      },
    },
    async ({ query, useRegExp, isCaseSensitive, matchWholeWord, maxResults, includes, excludes }) => {
      const results = await searchText(query, {
        useRegExp,
        isCaseSensitive,
        matchWholeWord,
        maxResults,
        includes,
        excludes,
      })

      // Format results for better readability
      const formattedResults = results.map(r => ({
        file: r.uri.split('/').pop(),
        uri: r.uri,
        matches: r.ranges.length,
        firstMatch: r.ranges[0]
          ? {
              line: r.ranges[0].start.line + 1, // Convert to 1-based for display
              character: r.ranges[0].start.character,
            }
          : null,
        preview: r.preview.trim(),
      }))

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(formattedResults, null, 2),
        }],
      }
    },
  )
}
