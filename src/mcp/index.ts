import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import express from 'express'
import { window, workspace } from 'vscode'
import { logger } from '../utils'
import { addLspTools } from './tools'

// Map to store transports by session ID with metadata
interface SessionInfo {
  transport: StreamableHTTPServerTransport
  createdAt: number
  lastActivity: number
}

const sessions: { [sessionId: string]: SessionInfo } = {}

// Session management constants
const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const SESSION_MAX_IDLE_TIME = 30 * 60 * 1000 // 30 minutes idle timeout
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000 // 2 hours maximum age

// Cleanup dead sessions periodically
function cleanupDeadSessions() {
  const now = Date.now()
  for (const [sessionId, sessionInfo] of Object.entries(sessions)) {
    const age = now - sessionInfo.createdAt
    const idleTime = now - sessionInfo.lastActivity

    if (age > SESSION_MAX_AGE || idleTime > SESSION_MAX_IDLE_TIME) {
      logger.info(`Cleaning up inactive session: ${sessionId} (age: ${Math.round(age / 1000)}s, idle: ${Math.round(idleTime / 1000)}s)`)

      // Close the transport if it has a close method
      if (sessionInfo.transport.close) {
        sessionInfo.transport.close()
      }

      delete sessions[sessionId]
    }
  }
}

// Start cleanup timer
let cleanupTimer: NodeJS.Timeout | null = null

// Track the current port globally
let currentPort: number = 0

export function startMcp() {
  const config = workspace.getConfiguration('lsp-mcp')
  const isMcpEnabled = config.get('enabled', true)
  const mcpPort = config.get('port', 9527)
  const maxRetries = config.get('maxRetries', 10)

  if (!isMcpEnabled) {
    window.showInformationMessage('LSP MCP server is disabled by configuration.')
    return
  }

  // Start session cleanup timer
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
  }
  cleanupTimer = setInterval(cleanupDeadSessions, SESSION_CLEANUP_INTERVAL)

  const app = express()
  app.use(express.json())

  // Endpoint to identify the workspace
  app.get('/workspace-info', async (req, res) => {
    const workspaceFolder = workspace.workspaceFolders?.[0]
    if (!workspaceFolder) {
      res.status(404).json({ error: 'No workspace folder found' })
      return
    }

    // Try to read the workspace ID file
    let workspaceId: string | null = null
    try {
      const idFilePath = `${workspaceFolder.uri.fsPath}/mcp_workspace_id`
      const fs = await import('node:fs/promises')
      workspaceId = (await fs.readFile(idFilePath, 'utf-8')).trim()
    }
    catch {
      // File doesn't exist or can't be read
      logger.info('No mcp_workspace_id file found')
    }

    res.json({
      workspacePath: workspaceFolder.uri.fsPath,
      workspaceName: workspaceFolder.name,
      workspaceId: workspaceId || 'no-id-file',
      port: currentPort,
    })
  })

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && sessions[sessionId]) {
      // Reuse existing transport and update activity
      sessions[sessionId].lastActivity = Date.now()
      transport = sessions[sessionId].transport
    }
    else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport with metadata
          const now = Date.now()
          sessions[sessionId] = {
            transport,
            createdAt: now,
            lastActivity: now,
          }
        },
        allowedHosts: ['127.0.0.1', 'localhost'],
      })

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete sessions[transport.sessionId]
        }
      }

      const server = new McpServer({
        name: 'lsp-server',
        version: '0.0.2',
      })

      // Add LSP tools to the server
      addLspTools(server)

      // Connect to the MCP server
      await server.connect(transport)
    }
    else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      })
      return
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body)
  })

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest)

  // Try to start server, handling port conflicts
  startServer(app, mcpPort, maxRetries)
}

// Try to start server, if port is occupied try other ports
function startServer(app: express.Express, initialPort: number, maxRetries: number) {
  currentPort = initialPort
  let retries = 0

  const tryListen = () => {
    const server = app.listen(currentPort, () => {
      window.showInformationMessage(`LSP MCP server started on port ${currentPort}`)
      logger.info(`MCP server running at http://127.0.0.1:${currentPort}/mcp`)
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && retries < maxRetries) {
        // Port in use, try next port
        retries++
        currentPort++
        window.showWarningMessage(`Port ${currentPort - 1} is in use, trying port ${currentPort}...`)
        tryListen()
      }
      else {
        window.showErrorMessage(`Failed to start LSP MCP server: ${err.message}`)
      }
    })
  }

  tryListen()
}

// Reusable handler for GET and DELETE requests
async function handleSessionRequest(req: express.Request, res: express.Response) {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  if (!sessionId || !sessions[sessionId]) {
    res.status(400).send('Invalid or missing session ID')
    return
  }

  // Update last activity
  sessions[sessionId].lastActivity = Date.now()

  const transport = sessions[sessionId].transport
  await transport.handleRequest(req, res)
}

// Export cleanup function for extension deactivation
export function stopMcp() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }

  // Close all active sessions
  for (const sessionInfo of Object.values(sessions)) {
    if (sessionInfo.transport.close) {
      sessionInfo.transport.close()
    }
  }

  // Clear sessions
  Object.keys(sessions).forEach(key => delete sessions[key])
}
