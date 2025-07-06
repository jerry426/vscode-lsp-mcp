import { defineExtension } from 'reactive-vscode'
import { window } from 'vscode'

const { activate, deactivate } = defineExtension((context) => {
  window.showInformationMessage('Hello')
})

export { activate, deactivate }
