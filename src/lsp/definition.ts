import * as vscode from 'vscode'
import * as path from 'path'
import * as logger from '../utils/logger'

/**
 * 获取符号定义位置
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @returns 定义位置信息
 */
export async function getDefinition(uri: string, line: number, character: number): Promise<any> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.debug(`获取定义: ${uri} 行:${line} 列:${character}`)

    // 调用VSCode API获取定义位置
    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position
    )

    if (!definitions || definitions.length === 0) {
      logger.debug('没有找到定义')
      return null
    }

    // 获取当前位置的单词
    const wordRange = document.getWordRangeAtPosition(position)
    const word = wordRange ? document.getText(wordRange) : ''

    // 处理第一个定义位置
    const definition = definitions[0]
    const defUri = definition.uri.toString()
    const defRange = definition.range

    // 获取定义处的符号名称
    const defDocument = await getDocument(defUri)
    const symbolName = defDocument
      ? defDocument.getText(new vscode.Range(
          defRange.start,
          defRange.end
        ))
      : word

    // 提取文件名和相对路径
    let fileName = path.basename(definition.uri.fsPath)
    let workspaceRelativePath = ''

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
      if (definition.uri.fsPath.startsWith(workspaceRoot)) {
        workspaceRelativePath = path.relative(workspaceRoot, definition.uri.fsPath)
      }
    }

    // 构建响应
    return {
      uri: defUri,
      range: {
        start: {
          line: defRange.start.line,
          character: defRange.start.character
        },
        end: {
          line: defRange.end.line,
          character: defRange.end.character
        }
      },
      fileName,
      workspaceRelativePath,
      symbolName,
      allDefinitions: definitions.map(def => ({
        uri: def.uri.toString(),
        range: {
          start: {
            line: def.range.start.line,
            character: def.range.start.character
          },
          end: {
            line: def.range.end.line,
            character: def.range.end.character
          }
        }
      }))
    }
  } catch (error) {
    logger.error('获取定义失败', error)
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