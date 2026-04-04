import os, json, subprocess, sys
import urllib.request
from urllib.error import URLError

def mcp_request(method, params):
    # Initialize session
    init_data = json.dumps({
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test", "version": "1"}
        },
        "id": 0
    }).encode('utf-8')
    
    req = urllib.request.Request("http://localhost:18060/mcp", data=init_data)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        headers = dict(resp.getheaders())
        session_id = headers.get('mcp-session-id', '')
        if not session_id:
            return None
    except Exception as e:
        return None

    # Call tool
    call_data = json.dumps({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": method,
            "arguments": params
        },
        "id": 1
    }).encode('utf-8')
    
    req2 = urllib.request.Request("http://localhost:18060/mcp", data=call_data)
    req2.add_header("Content-Type", "application/json")
    req2.add_header("Accept", "application/json, text/event-stream")
    req2.add_header("mcp-session-id", session_id)
    try:
        resp2 = urllib.request.urlopen(req2, timeout=15)
        res_str = ""
        for line in resp2:
            line_str = line.decode('utf-8').strip()
            if line_str.startswith('data:'):
                try:
                    obj = json.loads(line_str[5:].strip())
                    res_str += obj.get('result', {}).get('content', [{}])[0].get('text', '')
                except:
                    pass
        return res_str
    except Exception as e:
        return None

queries = [
    ("上地人工智能OPC创新街区友好社区", "上地 OPC社区"),
    ("中关村AI北纬社区", "中关村AI北纬社区"),
    ("国知启迪芸思OPC社区", "国知启迪芸思"),
    ("极客部落·AI应用生态园", "极客部落 AI"),
    ("模数OPC社区", "模数社区 OPC"),
    ("紫光VID网络视听产业园OPC创业社区", "紫光VID网络视听")
]

results = {}
for name, q in queries:
    print(f"Searching XHS for: {q}")
    res = mcp_request("search_feeds", {"keyword": q})
    if res:
        try:
            data = json.loads(res)
            items = data.get('items', [])
            titles = [item.get('noteCard', {}).get('displayTitle', '') for item in items[:5]]
            results[name] = titles
        except Exception as e:
            results[name] = f"Error parsing: {str(e)}"
    else:
        results[name] = "No result"

print(json.dumps(results, indent=2, ensure_ascii=False))
