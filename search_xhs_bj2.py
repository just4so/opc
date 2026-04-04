import subprocess, json

queries = [
    ("上地", "上地 OPC社区"),
    ("中关村", "中关村AI北纬社区"),
    ("国知", "国知启迪芸思"),
    ("极客", "极客部落 OPC"),
    ("模数", "模数社区 OPC"),
    ("紫光", "紫光VID OPC")
]

for name, q in queries:
    cmd = f'''
    SESSION=$(curl -s --max-time 8 -X POST http://localhost:18060/mcp \
      -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -D - \
      -d '{{"jsonrpc":"2.0","method":"initialize","params":{{"protocolVersion":"2024-11-05","capabilities":{{}},"clientInfo":{{"name":"test","version":"1"}}}},"id":0}}' 2>&1 \
      | grep -i "mcp-session-id:" | awk '{{print $2}}' | tr -d '\\r')

    curl -s --max-time 15 -N -X POST http://localhost:18060/mcp \
      -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -H "mcp-session-id: $SESSION" \
      -d '{{"jsonrpc":"2.0","method":"tools/call","params":{{"name":"search_feeds","arguments":{{"keyword":"{q}"}}}},"id":1}}'
    '''
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(f"--- {name}: {q} ---")
    try:
        lines = res.stdout.strip().split('\\n')
        for line in lines:
            if line.startswith('data:'):
                obj = json.loads(line[5:])
                text = obj.get('result', {}).get('content', [{{}}])[0].get('text', '')
                if text:
                    data = json.loads(text)
                    items = data.get('items', [])
                    for i, item in enumerate(items[:3]):
                        title = item.get('noteCard', {}).get('displayTitle', '')
                        desc = item.get('noteCard', {}).get('desc', '')
                        print(f"[{i+1}] {title} | {desc}")
    except Exception as e:
        print("Error or no data:", e)
