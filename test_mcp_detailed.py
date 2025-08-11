#!/usr/bin/env python3
"""
Detailed test suite for VSCode LSP MCP extension
Shows actual content returned by each tool
"""
import requests
import json
import textwrap

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

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def truncate(text, length=100):
    """Truncate long text with ellipsis"""
    if len(text) > length:
        return text[:length] + "..."
    return text

def test_all_tools_detailed():
    """Test all MCP tools with detailed output"""
    print("\n" + "="*60)
    print("  VSCode LSP MCP - DETAILED TEST RESULTS")
    print("="*60)
    
    # Test 1: HOVER
    print_section("1. GET_HOVER - Documentation & Type Info")
    hover = call_mcp_tool("get_hover", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 13,  # export async function getHover
        "character": 23  # On 'getHover'
    })
    
    if hover and len(hover) > 0:
        print(f"✓ Found {len(hover)} hover result(s)")
        for i, h in enumerate(hover[:2], 1):  # Show first 2
            print(f"\n  Hover #{i}:")
            if 'range' in h:
                r = h['range']
                print(f"    Range: Line {r['start']['line']}:{r['start']['character']} to {r['end']['line']}:{r['end']['character']}")
            if 'contents' in h:
                for j, content in enumerate(h['contents'][:3], 1):  # First 3 contents
                    if isinstance(content, dict):
                        kind = content.get('kind', 'unknown')
                        value = content.get('value', '')
                        lang = content.get('language', '')
                        print(f"    Content {j} ({kind}{' ' + lang if lang else ''}):")
                        # Wrap long content
                        wrapped = textwrap.fill(value, width=50, initial_indent="      ", subsequent_indent="      ")
                        print(truncate(wrapped, 200))
    else:
        print("✗ No hover results")
    
    # Test 2: COMPLETIONS
    print_section("2. GET_COMPLETIONS - Code Suggestions")
    completions = call_mcp_tool("get_completions", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 18,  # const position = new vscode.Position
        "character": 37  # After 'new vscode.'
    })
    
    if completions and len(completions) > 0:
        print(f"✓ Found {len(completions)} completion(s)")
        print("\n  Top 10 completions:")
        for i, comp in enumerate(completions[:10], 1):
            label = comp.get('label', 'unknown')
            kind = comp.get('kind', '')
            detail = comp.get('detail', '')
            print(f"    {i:2}. {label:30} {f'(kind: {kind})' if kind else ''}")
            if detail:
                print(f"        Detail: {truncate(detail, 50)}")
    else:
        print("✗ No completions")
    
    # Test 3: DEFINITION
    print_section("3. GET_DEFINITION - Jump to Definition")
    # Test on logger import (using proper 0-based line numbers)
    definition = call_mcp_tool("get_definition", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 1,  # Line 2 in file (0-indexed as 1): import { logger } from '../utils'
        "character": 10  # On 'logger'
    })
    
    if definition and len(definition) > 0:
        print(f"✓ Found {len(definition)} definition(s)")
        for i, def_loc in enumerate(definition[:5], 1):  # Show first 5
            uri = def_loc['uri'].split('/')[-1]  # Just filename
            r = def_loc['range']
            print(f"    {i}. {uri}")
            print(f"       Line {r['start']['line']}:{r['start']['character']} to {r['end']['line']}:{r['end']['character']}")
    else:
        print("✗ No definitions found")
    
    # Test 4: REFERENCES
    print_section("4. GET_REFERENCES - Find All Usages")
    references = call_mcp_tool("get_references", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 2,  # import { logger }
        "character": 10  # On 'logger'
    })
    
    if references and len(references) > 0:
        print(f"✓ Found {len(references)} reference(s) to 'logger'")
        # Group by file
        files = {}
        for ref in references:
            filename = ref['uri'].split('/')[-1]
            if filename not in files:
                files[filename] = []
            r = ref['range']['start']
            files[filename].append(f"{r['line']}:{r['character']}")
        
        print("\n  References by file:")
        for filename, positions in list(files.items())[:5]:  # First 5 files
            # Sort positions by line number for readability
            sorted_positions = sorted(positions, key=lambda p: int(p.split(':')[0]))
            print(f"    • {filename}: {', '.join(sorted_positions[:5])}")
            if len(positions) > 5:
                print(f"      ... and {len(positions) - 5} more")
    else:
        print("✗ No references found")
    
    # Test 5: IMPLEMENTATIONS
    print_section("5. FIND_IMPLEMENTATIONS - Interface Implementations")
    implementations = call_mcp_tool("find_implementations", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/errors.ts",
        "line": 5,  # export class LSPError extends Error
        "character": 32  # On 'Error'
    })
    
    if implementations and len(implementations) > 0:
        print(f"✓ Found {len(implementations)} implementation(s) of Error class")
        print("\n  Sample implementations:")
        for i, impl in enumerate(implementations[:8], 1):  # Show first 8
            uri = impl['uri'].split('/')[-1]
            r = impl['range']
            line = r['start']['line']
            char = r['start']['character']
            print(f"    {i}. {uri:40} line {line}:{char}")
    else:
        print("✗ No implementations found")
    
    # Test 6: TEXT SEARCH
    print_section("6. SEARCH_TEXT - Find Text in Files")
    search = call_mcp_tool("search_text", {
        "query": "withErrorHandling",
        "maxResults": 10
    })
    
    if search and len(search) > 0:
        print(f"✓ Found {len(search)} file(s) containing 'withErrorHandling'")
        for i, result in enumerate(search, 1):
            filename = result.get('file', 'unknown')
            matches = result.get('matches', 0)
            preview = result.get('preview', '')
            first_match = result.get('firstMatch', {})
            print(f"\n    {i}. {filename} ({matches} match{'es' if matches != 1 else ''})")
            if first_match:
                print(f"       First at line {first_match.get('line', '?')}:{first_match.get('character', '?')}")
            if preview:
                print(f"       Preview: {truncate(preview.strip(), 60)}")
    else:
        print("✗ No search results")
    
    # Test 7: RENAME
    print_section("7. RENAME_SYMBOL - Refactor Across Files")
    rename = call_mcp_tool("rename_symbol", {
        "uri": "file:///home/jerry/VSCode/vscode-lsp-mcp/src/lsp/hover.ts",
        "line": 14,  # function parameter 'uri'
        "character": 3,
        "newName": "documentUri"
    })
    
    if rename:
        if isinstance(rename, dict) and 'changes' in rename:
            changes = rename['changes']
            print(f"✓ Rename would affect {len(changes)} file(s)")
            for change in changes:
                filename = change['uri'].split('/')[-1]
                edits = change.get('edits', [])
                print(f"\n    • {filename}: {len(edits)} edit(s)")
                for j, edit in enumerate(edits[:3], 1):  # Show first 3 edits
                    r = edit['range']
                    print(f"      Edit {j}: Line {r['start']['line']}:{r['start']['character']} → '{edit['newText']}'")
                if len(edits) > 3:
                    print(f"      ... and {len(edits) - 3} more edits")
        else:
            print("✓ Rename returned result (different format)")
    else:
        print("✗ Rename failed")
    
    # Summary
    print_section("TEST SUMMARY")
    print("""
    All tools tested with detailed output:
    • Hover: Shows documentation and type information
    • Completions: Lists available code suggestions
    • Definition: Locates symbol definitions
    • References: Finds all usages across codebase
    • Implementations: Finds interface/class implementations
    • Text Search: Searches for text patterns in files
    • Rename: Shows refactoring changes across files
    """)

if __name__ == "__main__":
    test_all_tools_detailed()