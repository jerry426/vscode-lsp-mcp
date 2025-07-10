# ext-name

<a href="https://marketplace.visualstudio.com/items?itemName=antfu.ext-name" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/antfu.ext-name.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

## Configurations

<!-- configs -->

**No data**

<!-- configs -->

## Commands

<!-- commands -->

| Command                   | Title                     |
| ------------------------- | ------------------------- |
| `ext-name.getHover`       | LSP Test: Get Hover       |
| `ext-name.getDefinition`  | LSP Test: Get Definition  |
| `ext-name.getCompletions` | LSP Test: Get Completions |
| `ext-name.getReferences`  | LSP Test: Get References  |
| `ext-name.rename`         | LSP Test: Rename Symbol   |

<!-- commands -->

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png'/>
  </a>
</p>

## License

[MIT](./LICENSE.md) License © 2022 [Anthony Fu](https://github.com/antfu)

## Features

- Basic extension structure
- LSP functionality testing commands
- Integrated MCP server to expose LSP features

## LSP Functions Test

This extension provides several commands to test LSP functionalities. You can access them from the command palette (Ctrl+Shift+P):

- `LSP Test: Get Hover`
- `LSP Test: Get Definition`
- `LSP Test: Get Completions`
- `LSP Test: Get References`
- `LSP Test: Rename`

## MCP Server

This extension can start an MCP (Model Context Protocol) server to expose its LSP capabilities to external clients.

### Configuration

You can configure the MCP server in your VSCode settings (`settings.json`):

- `starter-vscode-main.mcp.enabled`: Enable or disable the LSP MCP server.
  - Type: `boolean`
  - Default: `true`
- `starter-vscode-main.mcp.port`: Port for the LSP MCP server.
  - Type: `number`
  - Default: `9527`

### Exposed Tools

The following tools are exposed via the MCP server:

- `lsp/getHover`: Get hover information.
- `lsp/getDefinition`: Get definition location.
- `lsp/getCompletions`: Get completion suggestions.
- `lsp/getReferences`: Get symbol references.
- `lsp/rename`: Rename a symbol.
Each tool requires parameters like `uri`, `line`, and `character`. The `rename` tool also requires `newName`.

## Development

- Press `F5` to open a new window with your extension loaded.
- Open a file and run the commands from the command palette.
- Check the debug console for logs.
