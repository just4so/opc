#!/usr/bin/env python3
"""
Google News URL 解码脚本
用法: python3 decode-gnews-urls.py < input.json
输入: JSON 数组，每个元素是 Google News 中间链接
输出: JSON 对象，key=原始 URL, value=真实 URL（解码失败为 null）
"""
import sys
import json
import os
from googlenewsdecoder import gnewsdecoder

def main():
    raw = sys.stdin.read().strip()
    urls = json.loads(raw)

    # 从环境变量读代理（collect-gnews.ts 里定义的 PROXY）
    proxy = os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy') or 'http://127.0.0.1:7898'

    result = {}
    for url in urls:
        try:
            decoded = gnewsdecoder(url, proxy=proxy)
            if decoded and decoded.get("status") and decoded.get("decoded_url"):
                result[url] = decoded["decoded_url"]
            else:
                result[url] = None
        except Exception as e:
            result[url] = None

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
