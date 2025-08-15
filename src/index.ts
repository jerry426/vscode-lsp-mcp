import { defineExtension } from 'reactive-vscode'
import { initializeWorkspaceLsps } from './lsp/ensure-lsp-activated'
import { startMcp, stopMcp } from './mcp'

const { activate, deactivate } = defineExtension(async (context) => {
  await startMcp()

  // Pre-initialize Language Servers for workspace file types
  // This runs in the background and won't block activation
  setTimeout(() => {
    initializeWorkspaceLsps().catch((err) => {
      console.error('LSP pre-initialization failed (non-critical):', err)
    })
  }, 1000)

  // Clean up on deactivation
  context.subscriptions.push({
    dispose: () => {
      stopMcp()
    },
  })
})

export { activate, deactivate }
