import * as vscode from 'vscode'
import { logger } from '../utils'
import { getDocument } from './tools'

/**
 * Get all references to a symbol
 *
 * @param uri Document URI
 * @param line Line number (0-based)
 * @param character Character position (0-based)
 * @returns List of reference locations
 */
export async function getReferences(
  uri: string,
  line: number,
  character: number,
): Promise<vscode.Location[]> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.info(`获取引用: ${uri} 行:${line} 列:${character}`)

    // 调用VSCode API获取引用位置
    const references = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position,
    )

    return references || []
  }
  catch (error) {
    logger.error('获取引用失败', error)
    throw error
  }
}
