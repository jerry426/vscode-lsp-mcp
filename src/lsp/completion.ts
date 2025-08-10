import * as vscode from 'vscode'
import { logger } from '../utils'
import { LSPError, withErrorHandling } from './errors'
import { getDocument } from './tools'

// Configuration for completion limits
const DEFAULT_COMPLETION_LIMIT = 50

/**
 * Get code completion suggestions
 *
 * @param uri Document URI
 * @param line Line number (0-based)
 * @param character Character position (0-based)
 * @param limit Maximum number of completions to return (optional)
 * @returns Completion list or empty list
 */
export async function getCompletions(
  uri: string,
  line: number,
  character: number,
  limit: number = DEFAULT_COMPLETION_LIMIT,
): Promise<vscode.CompletionList<vscode.CompletionItem>> {
  const position = new vscode.Position(line, character)

  return withErrorHandling(
    'get completions',
    async () => {
      const document = await getDocument(uri)
      if (!document) {
        throw new LSPError(
          `Document not found: ${uri}`,
          'getCompletions',
          { uri, position },
        )
      }

      logger.info(`Getting completions: ${uri} line:${line} char:${character}`)

      // Call VSCode API to get completions
      // The API can return either CompletionList or CompletionItem[]
      const result = await vscode.commands.executeCommand<
        vscode.CompletionList | vscode.CompletionItem[]
      >(
        'vscode.executeCompletionItemProvider',
        document.uri,
        position,
        undefined, // trigger character
        limit,
      )

      // Normalize the result to always return a CompletionList
      if (!result) {
        return new vscode.CompletionList([], false)
      }

      if (Array.isArray(result)) {
        // Convert array to CompletionList
        return new vscode.CompletionList(result, false)
      }

      return result
    },
    { uri, position },
  )
}
