# VSCode LSP MCP

## Configurations

<!-- configs -->

| Key                               | Description                           | Type      | Default |
| --------------------------------- | ------------------------------------- | --------- | ------- |
| `lsp-mcp.enabled` | Enable or disable the LSP MCP server. | `boolean` | `true`  |
| `lsp-mcp.port`    | Port for the LSP MCP server.          | `number`  | `9527`  |

<!-- configs -->

## Commands

<!-- commands -->

| Command                   | Title                     |
| ------------------------- | ------------------------- |
| `ext-name.getHover`       | LSP Test: Get Hover       |
| `ext-name.getDefinition`  | LSP Test: Get Definition  |
| `ext-name.getCompletions` | LSP Test: Get Completions |
| `ext-name.getReferences`  | LSP Test: Get References  |
| `ext-name.rename`         | LSP Test: Rename          |

<!-- commands -->

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

- `lsp-mcp.enabled`: Enable or disable the LSP MCP server.
  - Type: `boolean`
  - Default: `true`
- `lsp-mcp.port`: Port for the LSP MCP server.
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
