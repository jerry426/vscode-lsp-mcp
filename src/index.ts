import { defineExtension } from 'reactive-vscode'
import { startMcp } from './mcp'

const { activate, deactivate } = defineExtension(async (context) => {
  startMcp()
})

export { activate, deactivate }
