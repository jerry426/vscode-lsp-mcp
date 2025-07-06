import { defineExtension } from 'reactive-vscode'
import { testWithCMD } from './lsp/testWithCMD'

const { activate, deactivate } = defineExtension(async (context) => {
  testWithCMD(context)
})

export { activate, deactivate }
