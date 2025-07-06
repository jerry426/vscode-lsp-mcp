import * as vscode from 'vscode'
import * as logger from '../utils/logger'

/**
 * 获取代码补全建议
 *
 * @param uri 文档URI
 * @param line 行号（从0开始）
 * @param character 字符位置（从0开始）
 * @returns 补全建议列表
 */
export async function getCompletions(uri: string, line: number, character: number): Promise<any> {
  try {
    const document = await getDocument(uri)
    if (!document) {
      throw new Error(`无法找到文档: ${uri}`)
    }

    const position = new vscode.Position(line, character)

    logger.debug(`获取代码补全: ${uri} 行:${line} 列:${character}`)

    // 调用VSCode API获取代码补全
    const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      document.uri,
      position,
      undefined,
      50 // 限制数量，避免返回过多
    )

    if (!completionList || completionList.items.length === 0) {
      logger.debug('没有找到补全建议')
      return { items: [] }
    }

    // 处理补全项
    const items = completionList.items.map(item => {
      return {
        label: item.label,
        kind: completionKindToString(item.kind),
        insertText: item.insertText || item.label,
        detail: item.detail || '',
        documentation: getCompletionDocumentation(item),
        sortText: item.sortText || '',
        filterText: item.filterText || '',
        preselect: item.preselect || false
      }
    })

    // 构建最终结果
    return {
      isIncomplete: completionList.isIncomplete,
      items
    }
  } catch (error) {
    logger.error('获取代码补全失败', error)
    throw error
  }
}

/**
 * 获取补全项文档
 * @param item 补全项
 * @returns 文档字符串
 */
function getCompletionDocumentation(item: vscode.CompletionItem): string {
  if (!item.documentation) {
    return ''
  }

  if (typeof item.documentation === 'string') {
    return item.documentation
  }

  return item.documentation.value
}

/**
 * 将补全项类型转换为可读字符串
 * @param kind 补全项类型
 * @returns 类型描述
 */
function completionKindToString(kind?: vscode.CompletionItemKind): string {
  if (!kind) {
    return '未知'
  }

  const kindMap: Record<number, string> = {
    [vscode.CompletionItemKind.Text]: '文本',
    [vscode.CompletionItemKind.Method]: '方法',
    [vscode.CompletionItemKind.Function]: '函数',
    [vscode.CompletionItemKind.Constructor]: '构造函数',
    [vscode.CompletionItemKind.Field]: '字段',
    [vscode.CompletionItemKind.Variable]: '变量',
    [vscode.CompletionItemKind.Class]: '类',
    [vscode.CompletionItemKind.Interface]: '接口',
    [vscode.CompletionItemKind.Module]: '模块',
    [vscode.CompletionItemKind.Property]: '属性',
    [vscode.CompletionItemKind.Unit]: '单位',
    [vscode.CompletionItemKind.Value]: '值',
    [vscode.CompletionItemKind.Enum]: '枚举',
    [vscode.CompletionItemKind.Keyword]: '关键字',
    [vscode.CompletionItemKind.Snippet]: '代码片段',
    [vscode.CompletionItemKind.Color]: '颜色',
    [vscode.CompletionItemKind.File]: '文件',
    [vscode.CompletionItemKind.Reference]: '引用',
    [vscode.CompletionItemKind.Folder]: '文件夹',
    [vscode.CompletionItemKind.EnumMember]: '枚举成员',
    [vscode.CompletionItemKind.Constant]: '常量',
    [vscode.CompletionItemKind.Struct]: '结构体',
    [vscode.CompletionItemKind.Event]: '事件',
    [vscode.CompletionItemKind.Operator]: '操作符',
    [vscode.CompletionItemKind.TypeParameter]: '类型参数'
  }

  return kindMap[kind] || '未知'
}

/**
 * 根据URI获取文档对象
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