import * as vscode from 'vscode'
import * as logger from '../utils/logger'

/**
 * 获取指定位置的悬停信息
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @returns 悬停信息对象
 */
export async function getHover(uri: string, line: number, character: number): Promise<any> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.debug(`获取悬停信息: ${uri} 行:${line} 列:${character}`)

    // 调用VSCode API获取悬停信息
    const hoverResults = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider',
      document.uri,
      position
    )

    if (!hoverResults || hoverResults.length === 0) {
      logger.debug('没有找到悬停信息')
      return null
    }

    // 处理悬停结果
    const hover = hoverResults[0]

    // 提取内容
    let contents: string[] = []

    if (hover.contents) {
      if (Array.isArray(hover.contents)) {
        for (const content of hover.contents) {
          if (typeof content === 'string') {
            contents.push(content)
          } else if (content instanceof vscode.MarkdownString) {
            contents.push(content.value)
          }
        }
        // @ts-ignore
      } else if (hover.contents instanceof vscode.MarkdownString) {
        // @ts-ignore
        contents.push(hover.contents.value)
      } else if (typeof hover.contents === 'string') {
        contents.push(hover.contents)
      }
    }

    // 提取符号类型和名称
    let symbolType = ''
    let symbolName = ''

    // 尝试从第一行提取类型和名称
    if (contents.length > 0) {
      const firstLine = contents[0].split('\n')[0]

      // 处理常见的悬停信息格式，如 "(var) name: type"
      const varMatch = firstLine.match(/^\(([^)]+)\)\s+([^:]+)/)
      if (varMatch) {
        symbolType = varMatch[1]
        symbolName = varMatch[2].trim()
      } else {
        // 尝试提取类/接口/函数等
        const typeMatch = firstLine.match(/^(class|interface|enum|type|function|namespace|module)\s+([^\s<(:]+)/)
        if (typeMatch) {
          symbolType = typeMatch[1]
          symbolName = typeMatch[2]
        } else {
          // 尝试提取任何看起来像符号的内容
          const anySymbol = firstLine.match(/([a-zA-Z0-9_]+)(?:\s*:|\s*\(|\s*{)/)
          if (anySymbol) {
            symbolName = anySymbol[1]
          }
        }
      }
    }

    // 构建响应
    return {
      contents: contents.join('\n'),
      range: hover.range ? {
        start: {
          line: hover.range.start.line,
          character: hover.range.start.character
        },
        end: {
          line: hover.range.end.line,
          character: hover.range.end.character
        }
      } : undefined,
      symbolName,
      symbolType
    }
  } catch (error) {
    logger.error('获取悬停信息失败', error)
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