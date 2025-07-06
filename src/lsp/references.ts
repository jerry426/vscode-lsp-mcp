import * as vscode from 'vscode'
import * as path from 'path'
import * as logger from '../utils/logger'

/**
 * 获取符号的引用位置
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @param includeDeclaration 是否包含声明
 * @returns 引用位置列表
 */
export async function getReferences(
  uri: string,
  line: number,
  character: number,
  includeDeclaration: boolean = true
): Promise<any> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.debug(`获取引用: ${uri} 行:${line} 列:${character}`)

    // 调用VSCode API获取引用位置
    const references = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position
    )

    if (!references || references.length === 0) {
      logger.debug('没有找到引用')
      return { references: [] }
    }

    // 获取当前位置的单词
    const wordRange = document.getWordRangeAtPosition(position)
    const word = wordRange ? document.getText(wordRange) : ''

    // 处理引用位置列表
    const result = references.map(ref => {
      const refUri = ref.uri.toString()
      const refRange = ref.range

      // 提取文件名和相对路径
      let fileName = path.basename(ref.uri.fsPath)
      let workspaceRelativePath = ''

      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
        if (ref.uri.fsPath.startsWith(workspaceRoot)) {
          workspaceRelativePath = path.relative(workspaceRoot, ref.uri.fsPath)
        }
      }

      return {
        uri: refUri,
        fileName,
        workspaceRelativePath,
        range: {
          start: {
            line: refRange.start.line,
            character: refRange.start.character
          },
          end: {
            line: refRange.end.line,
            character: refRange.end.character
          }
        }
      }
    })

    // 按文件分组
    const referencesByFile: { [key: string]: any[] } = {}

    for (const ref of result) {
      if (!referencesByFile[ref.uri]) {
        referencesByFile[ref.uri] = []
      }
      referencesByFile[ref.uri].push(ref)
    }

    // 构建最终结果
    return {
      symbolName: word,
      count: references.length,
      references: result,
      referencesByFile
    }
  } catch (error) {
    logger.error('获取引用失败', error)
    throw error
  }
}

/**
 * 根据URI获取文档对象
 *
 * @param uri 文档URI
 * @returns 文档对象
 */
async function getDocument(uri: string): Promise<vscode.TextDocument | undefined> {
  try {
    // 尝试从已打开的编辑器获取文档
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.toString() === uri) {
        return editor.document
      }
    }

    // 如果未找到，则尝试从文件系统加载
    return await vscode.workspace.openTextDocument(vscode.Uri.parse(uri))
  } catch (error) {
    logger.error(`获取文档失败: ${uri}`, error)
    return undefined
  }
}