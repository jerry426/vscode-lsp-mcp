/**
 * Text-based search implementation
 * This provides an alternative to workspace symbols that works more reliably
 */

import * as vscode from 'vscode'
import { logger } from '../utils'

export interface SearchResult {
  uri: string
  ranges: Array<{
    start: { line: number, character: number }
    end: { line: number, character: number }
  }>
  preview: string
}

/**
 * Search for text across the workspace
 *
 * @param query - Search query string or regular expression pattern
 * @param options - Search options
 * @param options.useRegExp - Whether to treat query as regex pattern (default: false)
 * @param options.isCaseSensitive - Case sensitive search (default: false)
 * @param options.matchWholeWord - Match whole words only (default: false)
 * @param options.maxResults - Maximum number of results to return (default: 100)
 * @param options.includes - Array of glob patterns to include
 * @param options.excludes - Array of glob patterns to exclude
 * @returns Array of search results with file URIs, match ranges, and previews
 */
export async function searchText(
  query: string,
  options: {
    useRegExp?: boolean
    isCaseSensitive?: boolean
    matchWholeWord?: boolean
    maxResults?: number
    includes?: string[]
    excludes?: string[]
  } = {},
): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    logger.info(`Searching workspace for text: "${query}"`)

    // Get workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.info('No workspace folders found')
      return []
    }

    // Build glob pattern for includes
    const includePattern = options.includes && options.includes.length > 0
      ? `{${options.includes.join(',')}}`
      : '**/*'

    // Find files matching the pattern
    const files = await vscode.workspace.findFiles(
      includePattern,
      options.excludes ? `{${options.excludes.join(',')}}` : '**/node_modules/**',
      options.maxResults ?? 100,
    )

    // Search within each file
    for (const fileUri of files) {
      if (results.length >= (options.maxResults ?? 100)) {
        break
      }

      try {
        const document = await vscode.workspace.openTextDocument(fileUri)
        const text = document.getText()

        // Build regex pattern
        let pattern: RegExp
        if (options.useRegExp) {
          pattern = new RegExp(query, options.isCaseSensitive ? 'g' : 'gi')
        }
        else {
          // Escape special regex characters
          const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const wordBoundary = options.matchWholeWord ? '\\b' : ''
          pattern = new RegExp(
            `${wordBoundary}${escaped}${wordBoundary}`,
            options.isCaseSensitive ? 'g' : 'gi',
          )
        }

        // Find all matches
        let match: RegExpExecArray | null
        const fileRanges: SearchResult['ranges'] = []

        // eslint-disable-next-line no-cond-assign
        while ((match = pattern.exec(text)) !== null) {
          const startPos = document.positionAt(match.index)
          const endPos = document.positionAt(match.index + match[0].length)

          fileRanges.push({
            start: { line: startPos.line, character: startPos.character },
            end: { line: endPos.line, character: endPos.character },
          })

          // Stop if we have enough results
          if (results.length + 1 >= (options.maxResults ?? 100)) {
            break
          }
        }

        if (fileRanges.length > 0) {
          // Get preview from first match
          const firstRange = fileRanges[0]
          const line = document.lineAt(firstRange.start.line)

          results.push({
            uri: fileUri.toString(),
            ranges: fileRanges,
            preview: line.text.trim(),
          })
        }
      }
      catch (error) {
        // Skip files that can't be opened
        logger.info(`Skipping file ${fileUri.toString()}: ${error}`)
      }
    }

    logger.info(`Text search found ${results.length} results`)
    return results
  }
  catch (error) {
    logger.error('Text search failed', error)
    return []
  }
}
