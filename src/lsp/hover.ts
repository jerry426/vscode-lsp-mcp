import * as vscode from 'vscode'
import { logger } from '../utils'
import { LSPError, withErrorHandling } from './errors'
import { getDocument } from './tools'

/**
 * Get hover information at the specified position
 *
 * @param uri Document URI
 * @param line Line number (0-based)
 * @param character Character position (0-based)
 * @returns Hover information array
 */
export async function getHover(
  uri: string,
  line: number,
  character: number,
): Promise<vscode.Hover[]> {
  const position = new vscode.Position(line, character)

  return withErrorHandling(
    'get hover information',
    async () => {
      const document = await getDocument(uri)
      if (!document) {
        throw new LSPError(
          `Document not found: ${uri}`,
          'getHover',
          { uri, position },
        )
      }

      logger.info(`Getting hover info: ${uri} line:${line} char:${character}`)

      // Call VSCode API to get hover information
      const hoverResults = await vscode.commands.executeCommand<vscode.Hover[]>(
        'vscode.executeHoverProvider',
        document.uri,
        position,
      )

      return hoverResults || []
    },
    { uri, position },
  )
}
