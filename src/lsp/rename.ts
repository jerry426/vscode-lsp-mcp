import * as vscode from 'vscode'
import * as logger from '../utils/logger'

/**
 * 执行符号重命名
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @param newName 新名称
 * @returns 重命名结果
 */
export async function rename(uri: string, line: number, character: number, newName: string): Promise<any> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.debug(`执行重命名: ${uri} 行:${line} 列:${character} 新名称:${newName}`)

    // 先检查重命名是否可行
    const prepareResult = await vscode.commands.executeCommand<vscode.Range | { range: vscode.Range, placeholder: string }>(
      'vscode.prepareRename',
      document.uri,
      position
    )

    if (!prepareResult) {
      throw new Error('当前位置不支持重命名')
    }

    // 获取当前位置的符号名称
    let symbolName = ''
    if ('placeholder' in prepareResult) {
      symbolName = prepareResult.placeholder
    } else {
      const range = prepareResult
      symbolName = document.getText(range)
    }

    // 执行重命名操作
    const workspaceEdit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
      'vscode.executeDocumentRenameProvider',
      document.uri,
      position,
      newName
    )

    if (!workspaceEdit || !workspaceEdit.entries || workspaceEdit.entries().length === 0) {
      return {
        success: false,
        message: '重命名操作未返回任何编辑',
        oldName: symbolName,
        newName: newName
      }
    }

    // 提取重命名变更
    const changes: Record<string, any[]> = {}
    const fileCount = new Set<string>()
    let editCount = 0

    for (const [uri, edits] of workspaceEdit.entries()) {
      fileCount.add(uri.toString())
      const fileChanges = edits.map(edit => {
        editCount++
        return {
          range: {
            start: {
              line: edit.range.start.line,
              character: edit.range.start.character
            },
            end: {
              line: edit.range.end.line,
              character: edit.range.end.character
            }
          },
          newText: edit.newText
        }
      })
      changes[uri.toString()] = fileChanges
    }

    // 构建响应
    return {
      success: true,
      oldName: symbolName,
      newName: newName,
      changes: changes,
      fileCount: fileCount.size,
      editCount: editCount
    }
  } catch (error) {
    logger.error('执行重命名失败', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '执行重命名失败',
      oldName: '',
      newName: newName
    }
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