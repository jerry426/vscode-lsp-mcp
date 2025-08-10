#!/usr/bin/env python3
"""
VSCode LSP MCP Client Helper
Automatically manages sessions and provides easy access to LSP features.

Usage:
    python3 mcp_client.py discover           - Find all running MCP servers
    python3 mcp_client.py test [port]        - Test server connection
    python3 mcp_client.py list-tools [port]  - List available tools
    
    # Direct tool usage:
    python3 mcp_client.py hover <file> <line> <char> [port]
    python3 mcp_client.py definition <file> <line> <char> [port]
    python3 mcp_client.py references <file> <line> <char> [port]
    python3 mcp_client.py completions <file> <line> <char> [port]
"""

import requests
import json
import sys
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class MCPClient:
    """Client for interacting with VSCode LSP MCP server."""
    
    port: int = 9527
    session_id: Optional[str] = None
    base_url: str = ""
    
    def __post_init__(self):
        self.base_url = f"http://127.0.0.1:{self.port}/mcp"
        if not self.session_id:
            self.initialize()
    
    def initialize(self) -> str:
        """Initialize session and get session ID."""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        }
        
        data = {
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "0.1.0",
                "capabilities": {},
                "clientInfo": {
                    "name": "mcp-python-client",
                    "version": "1.0.0"
                }
            },
            "id": 1
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=data, stream=True)
            response.raise_for_status()
            
            # Get session ID from headers
            self.session_id = response.headers.get('mcp-session-id')
            if not self.session_id:
                raise ValueError("No session ID received from server")
            
            return self.session_id
            
        except requests.exceptions.ConnectionError:
            raise ConnectionError(f"Cannot connect to MCP server on port {self.port}. Is VSCode running with the extension?")
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call an MCP tool with given arguments."""
        if not self.session_id:
            raise ValueError("No session initialized")
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'mcp-session-id': self.session_id
        }
        
        data = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": 2
        }
        
        response = requests.post(self.base_url, headers=headers, json=data)
        
        # Parse SSE response
        for line in response.iter_lines():
            if line and line.startswith(b'data: '):
                result = json.loads(line[6:])
                if 'result' in result and 'content' in result['result']:
                    content = result['result']['content'][0]['text']
                    return json.loads(content)
        
        return None
    
    def list_tools(self) -> List[Dict]:
        """List all available MCP tools."""
        if not self.session_id:
            raise ValueError("No session initialized")
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'mcp-session-id': self.session_id
        }
        
        data = {
            "jsonrpc": "2.0",
            "method": "tools/list",
            "params": {},
            "id": 2
        }
        
        response = requests.post(self.base_url, headers=headers, json=data)
        
        for line in response.iter_lines():
            if line and line.startswith(b'data: '):
                result = json.loads(line[6:])
                if 'result' in result and 'tools' in result['result']:
                    return result['result']['tools']
        
        return []
    
    # Convenience methods for each LSP feature
    def get_hover(self, uri: str, line: int, character: int) -> Any:
        """Get hover information at position."""
        return self.call_tool("get_hover", {
            "uri": uri,
            "line": line,
            "character": character
        })
    
    def get_definition(self, uri: str, line: int, character: int) -> Any:
        """Get definition location."""
        return self.call_tool("get_definition", {
            "uri": uri,
            "line": line,
            "character": character
        })
    
    def get_completions(self, uri: str, line: int, character: int) -> Any:
        """Get code completions at position."""
        return self.call_tool("get_completions", {
            "uri": uri,
            "line": line,
            "character": character
        })
    
    def get_references(self, uri: str, line: int, character: int) -> Any:
        """Find all references to symbol."""
        return self.call_tool("get_references", {
            "uri": uri,
            "line": line,
            "character": character
        })
    
    def rename_symbol(self, uri: str, line: int, character: int, new_name: str) -> Any:
        """Rename symbol across workspace."""
        return self.call_tool("rename_symbol", {
            "uri": uri,
            "line": line,
            "character": character,
            "newName": new_name
        })


def find_available_port(start_port: int = 9527, max_tries: int = 10) -> Optional[int]:
    """Find an available MCP server port."""
    for port in range(start_port, start_port + max_tries):
        try:
            client = MCPClient(port=port)
            print(f"✅ Found MCP server on port {port} (session: {client.session_id})")
            return port
        except ConnectionError:
            continue
    return None


def main():
    """CLI interface for the MCP client."""
    if len(sys.argv) < 2:
        print("Usage: python mcp_client.py <command> [args...]")
        print("\nCommands:")
        print("  discover              - Find available MCP servers")
        print("  list-tools [port]     - List available tools")
        print("  test [port]           - Test server connection")
        print("\nLSP Commands:")
        print("  hover <file> <line> <char> [port]       - Get hover info")
        print("  definition <file> <line> <char> [port]  - Find definition")
        print("  references <file> <line> <char> [port]  - Find references")
        print("  completions <file> <line> <char> [port] - Get completions")
        print("\nExamples:")
        print("  python mcp_client.py discover")
        print("  python mcp_client.py test 9527")
        print("  python mcp_client.py hover /path/to/file.ts 10 15")
        return
    
    command = sys.argv[1]
    
    if command == "discover":
        print("Scanning for MCP servers...")
        port = find_available_port()
        if not port:
            print("❌ No MCP servers found. Make sure VSCode is running with the extension.")
    
    elif command == "list-tools":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 9527
        try:
            client = MCPClient(port=port)
            tools = client.list_tools()
            print(f"Available tools on port {port}:")
            for tool in tools:
                print(f"  - {tool['name']}: {tool['description']}")
        except ConnectionError as e:
            print(f"❌ {e}")
    
    elif command == "test":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 9527
        try:
            client = MCPClient(port=port)
            print(f"✅ Connected to MCP server on port {port}")
            print(f"   Session ID: {client.session_id}")
            
            # Test with sample file
            test_uri = "file:///home/jerry/VSCode/vscode-lsp-mcp/test-lsp-features.ts"
            result = client.get_hover(test_uri, 2, 10)
            if result:
                print(f"   Hover test: ✅ Working")
            
        except ConnectionError as e:
            print(f"❌ {e}")
    
    # Direct LSP tool commands
    elif command in ["hover", "definition", "references", "completions"]:
        if len(sys.argv) < 5:
            print(f"Usage: python mcp_client.py {command} <file> <line> <char> [port]")
            return
        
        file_path = sys.argv[2]
        line = int(sys.argv[3])
        char = int(sys.argv[4])
        port = int(sys.argv[5]) if len(sys.argv) > 5 else 9527
        
        # Convert file path to URI if needed
        if not file_path.startswith("file://"):
            import os
            file_path = f"file://{os.path.abspath(file_path)}"
        
        try:
            client = MCPClient(port=port)
            
            if command == "hover":
                result = client.get_hover(file_path, line, char)
            elif command == "definition":
                result = client.get_definition(file_path, line, char)
            elif command == "references":
                result = client.get_references(file_path, line, char)
            elif command == "completions":
                result = client.get_completions(file_path, line, char)
            
            print(json.dumps(result, indent=2))
            
        except ConnectionError as e:
            print(f"❌ {e}")
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()