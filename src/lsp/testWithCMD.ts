import type { ExtensionContext } from 'vscode'
import { commands, window, workspace } from 'vscode'
import { logger } from '../utils'
import { getCompletions, getDefinition, getHover, getReferences, rename } from './'

export function testWithCMD(context: ExtensionContext) {
  logger.info('LSP Test Extension Activated')

  // Helper function to get current editor and position
  function getCurrentEditorContext() {
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active text editor found.')
      return null
    }
    const { document, selection } = editor
    return {
      uri: document.uri.toString(),
      line: selection.active.line,
      character: selection.active.character,
      document,
      position: selection.active,
    }
  }

  // Register all LSP functions as commands
  context.subscriptions.push(
    commands.registerCommand('ext-name.getHover', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getHover')
      const result = await getHover(context.uri, context.line, context.character)
      logger.info('Hover Result:', result)
      window.showInformationMessage(`Hover: ${result?.contents || 'Not found'}`)
    }),

    commands.registerCommand('ext-name.getDefinition', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getDefinition')
      const result = await getDefinition(context.uri, context.line, context.character)
      logger.info('Definition Result:', result)
      window.showInformationMessage(`Definition: ${result?.uri || 'Not found'} at line ${result?.range.start.line}`)
    }),

    commands.registerCommand('ext-name.getCompletions', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getCompletions')
      const result = await getCompletions(context.uri, context.line, context.character)
      logger.info('Completions Result:', result)
      // Display first 5 completion items for brevity
      const topItems = result.items.slice(0, 5).map((item: any) => item.label).join(', ')
      window.showInformationMessage(`Completions: ${topItems}... (${result.items.length} total)`)
    }),

    commands.registerCommand('ext-name.getReferences', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getReferences')
      const result = await getReferences(context.uri, context.line, context.character)
      logger.info('References Result:', result)
      window.showInformationMessage(`Found ${result?.count || 0} references for ${result?.symbolName || 'symbol'}.`)
    }),

    commands.registerCommand('ext-name.rename', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      const newName = await window.showInputBox({ prompt: 'Enter new name for the symbol' })
      if (!newName) {
        window.showWarningMessage('Rename operation cancelled.')
        return
      }

      logger.info(`Command: rename to ${newName}`)
      const result = await rename(context.uri, context.line, context.character, newName)
      logger.info('Rename Result:', result)

      if (result.success) {
        window.showInformationMessage(`Renamed ${result.oldName} to ${result.newName} in ${result.fileCount} files.`)
        // Note: The rename operation from the API does not automatically apply the edits.
        // You would typically use `vscode.workspace.applyEdit(workspaceEdit)` to apply the changes.
        // For this test setup, we just log the result.
        const apply = await window.showInformationMessage(
          `Rename would make ${result.editCount} edits in ${result.fileCount} files. Apply changes?`,
          { modal: true },
          'Apply',
        )

        if (apply === 'Apply') {
          const workspaceEdit = new (await import('vscode')).WorkspaceEdit()
          for (const [uri, edits] of Object.entries(result.changes as Record<string, any[]>)) {
            const ranges = await Promise.all(edits.map(async e => new (await import('vscode')).Range(e.range.start.line, e.range.start.character, e.range.end.line, e.range.end.character)))

            workspaceEdit.set(
              (await import('vscode')).Uri.parse(uri),
              edits.map((e, i) => ({
                range: ranges[i],
                newText: e.newText,
              })),
            )
          }
          await workspace.applyEdit(workspaceEdit)
          window.showInformationMessage('Changes applied.')
        }
      }
      else {
        window.showErrorMessage(`Rename failed: ${result.message}`)
      }
    }),
  )
}
