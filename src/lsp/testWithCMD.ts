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
      window.showInformationMessage(`Hover: ${result?.map(r => r.contents).join('\n') || 'Not found'}`)
    }),

    commands.registerCommand('ext-name.getDefinition', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getDefinition')
      const result = await getDefinition(context.uri, context.line, context.character)
      logger.info('Definition Result:', result)
      window.showInformationMessage(`Definition: ${result?.map(r => r.uri).join('\n') || 'Not found'} at line ${result?.map(r => r.range.start.line).join('\n')}`)
    }),

    commands.registerCommand('ext-name.getCompletions', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getCompletions')
      const result = await getCompletions(context.uri, context.line, context.character)
      logger.info('Completions Result:', result)
      // Display first 5 completion items for brevity
      const topItems = result?.items.slice(0, 5).map((item: any) => item.label).join(', ')
      window.showInformationMessage(`Completions: ${topItems}... (${result?.items.length || 0} total)`)
    }),

    commands.registerCommand('ext-name.getReferences', async () => {
      const context = getCurrentEditorContext()
      if (!context)
        return

      logger.info('Command: getReferences')
      const result = await getReferences(context.uri, context.line, context.character)
      logger.info('References Result:', result)
      window.showInformationMessage(`Found ${result?.length || 0} references.`)
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

      if (result) {
        await window.showInformationMessage(
          result.toString(),
          { modal: true },
          'Apply',
        )
      }
      else {
        window.showErrorMessage(`Rename failed.`)
      }
    }),
  )
}
