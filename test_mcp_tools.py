#!/usr/bin/env python3
"""
Comprehensive test suite for VSCode LSP MCP extension
Tests all MCP tools after installation
"""
import requests
import json

def call_mcp_tool(tool_name, arguments):
    """Call an MCP tool and parse the response"""
    port = 9527
    base_url = f"http://127.0.0.1:{port}/mcp"
    
    # Initialize session
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
    }
    
    init_request = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "id": 0,
        "params": {
            "protocolVersion": "1.0.0",
            "capabilities": {},
            "clientInfo": {"name": "test", "version": "1.0"}
        }
    }
    
    response = requests.post(base_url, json=init_request, headers=headers)
    session_id = response.headers.get('mcp-session-id')
    
    if not session_id:
        return None
    
    # Call tool
    tool_request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "id": 1,
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    headers['mcp-session-id'] = session_id
    response = requests.post(base_url, json=tool_request, headers=headers, stream=True)
    
    # Parse SSE response
    for line in response.iter_lines():
        if line:
            decoded = line.decode('utf-8')
            if decoded.startswith('data: '):
                data = json.loads(decoded[6:])
                if 'result' in data:
                    content = data['result'].get('content', [])
                    if content and content[0].get('type') == 'text':
                        # Parse the nested JSON
                        try:
                            return json.loads(content[0]['text'])
                        except:
                            return content[0]['text']
                return None

def test_all_tools():
    """Test all MCP tools"""
    print("="*50)
    print("VSCode LSP MCP Extension Test Suite v0.0.6")
    print("="*50)
    
    results = {}
    
    # Test hover
    print("\n1. Testing get_hover...")
    hover = call_mcp_tool("get_hover", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/package.json",
        "line": 1,
        "character": 4
    })
    if hover and len(hover) > 0:
        print("   ✓ Hover works - returned documentation")
        results['hover'] = True
    else:
        print("   ✗ Hover failed")
        results['hover'] = False
    
    # Test completions
    print("\n2. Testing get_completions...")
    completions = call_mcp_tool("get_completions", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/index.ts",
        "line": 5,
        "character": 7
    })
    if completions and len(completions) > 0:
        print(f"   ✓ Completions works - returned {len(completions)} items")
        results['completions'] = True
    else:
        print("   ✗ Completions failed")
        results['completions'] = False
    
    # Test definition
    print("\n3. Testing get_definition...")
    definition = call_mcp_tool("get_definition", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 1,  # On vscode import
        "character": 15
    })
    if definition and len(definition) > 0:
        print(f"   ✓ Definition works - found {len(definition)} location(s)")
        results['definition'] = True
    else:
        print("   ✗ Definition failed")
        results['definition'] = False
    
    # Test references
    print("\n4. Testing get_references...")
    references = call_mcp_tool("get_references", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 2,
        "character": 10
    })
    if references and len(references) > 0:
        print(f"   ✓ References works - found {len(references)} reference(s)")
        results['references'] = True
    else:
        print("   ✗ References failed")
        results['references'] = False
    
    # Test implementations (new in v0.0.6)
    print("\n5. Testing find_implementations...")
    implementations = call_mcp_tool("find_implementations", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/errors.ts",
        "line": 5,  # On LSPError class
        "character": 15
    })
    # Implementations might be empty for concrete classes, that's OK
    if implementations is not None:
        if len(implementations) > 0:
            print(f"   ✓ Implementations works - found {len(implementations)} implementation(s)")
        else:
            print("   ✓ Implementations works - no implementations (expected for concrete class)")
        results['implementations'] = True
    else:
        print("   ✗ Implementations failed")
        results['implementations'] = False
    
    # Test text search
    print("\n6. Testing search_text...")
    search = call_mcp_tool("search_text", {
        "query": "getHover",
        "maxResults": 5
    })
    if search and len(search) > 0:
        print(f"   ✓ Text search works - found {len(search)} match(es)")
        results['search'] = True
    else:
        print("   ✗ Text search failed")
        results['search'] = False
    
    # Test rename
    print("\n7. Testing rename_symbol...")
    rename = call_mcp_tool("rename_symbol", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 14,  # function parameter
        "character": 3,
        "newName": "documentUri"
    })
    if rename:
        if isinstance(rename, dict) and 'changes' in rename:
            print(f"   ✓ Rename works - would affect {len(rename['changes'])} file(s)")
            results['rename'] = True
        elif isinstance(rename, list):
            print("   ✓ Rename works - returned edit operations")
            results['rename'] = True
        else:
            print("   ✓ Rename works - returned result")
            results['rename'] = True
    else:
        print("   ✗ Rename failed")
        results['rename'] = False
    
    # Summary
    print("\n" + "="*50)
    print("TEST RESULTS SUMMARY")
    print("="*50)
    
    tools = [
        ('get_hover', results.get('hover', False)),
        ('get_completions', results.get('completions', False)),
        ('get_definition', results.get('definition', False)),
        ('get_references', results.get('references', False)),
        ('find_implementations', results.get('implementations', False)),
        ('search_text', results.get('search', False)),
        ('rename_symbol', results.get('rename', False))
    ]
    
    for tool_name, passed in tools:
        status = "✓ WORKING" if passed else "✗ NEEDS FIX"
        print(f"{tool_name:25} {status}")
    
    passed_count = sum(1 for _, p in tools if p)
    total_count = len(tools)
    
    print("="*50)
    if passed_count == total_count:
        print(f"🎉 SUCCESS! All {total_count} tools are working!")
    elif passed_count >= 5:
        print(f"✓ GOOD: {passed_count}/{total_count} tools working")
    else:
        print(f"⚠️  NEEDS WORK: Only {passed_count}/{total_count} tools working")
    
    return results

if __name__ == "__main__":
    test_all_tools()