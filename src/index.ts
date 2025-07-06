import { defineExtension } from 'reactive-vscode'
import { testWithCMD } from './lsp/testWithCMD'
import { startMcp } from './mcp'

const { activate, deactivate } = defineExtension(async (context) => {
  testWithCMD(context)
  startMcp()
})

export { activate, deactivate }
