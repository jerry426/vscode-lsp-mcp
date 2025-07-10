import * as vscode from 'vscode'
import { logger } from '../utils'
import { getDocument } from './tools'

/**
 * 执行符号重命名
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @param newName 新名称
 * @returns 重命名结果
 */
export async function rename(
  uri: string,
  line: number,
  character: number,
  newName: string,
): Promise<vscode.Range> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.info(`执行重命名: ${uri} 行:${line} 列:${character} 新名称:${newName}`)

    // 先检查重命名是否可行
    const prepareResult = await vscode.commands.executeCommand<vscode.Range>(
      'vscode.prepareRename',
      document.uri,
      position,
    )

    return prepareResult
  }
  catch (error) {
    logger.error('执行重命名失败', error)
    throw error
  }
}
