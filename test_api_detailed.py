import requests
import time
import json

url = "http://127.0.0.1:5000/api/chat"

# 测试简单请求
payload = {
    "messages": [
        {"role": "system", "content": "你是小探"},
        {"role": "user", "content": "你好"}
    ],
    "age_group": "high_school"
}

print("测试API响应...")
start = time.time()

try:
    response = requests.post(url, json=payload, timeout=35)
    elapsed = time.time() - start
    
    print(f"响应时间: {elapsed:.2f}秒")
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"成功! 回复长度: {len(data.get('reply', ''))} 字符")
    else:
        print(f"失败! 错误: {response.text[:300]}")
        
except requests.exceptions.Timeout:
    elapsed = time.time() - start
    print(f"超时! 耗时: {elapsed:.2f}秒")
except Exception as e:
    elapsed = time.time() - start
    print(f"错误! 耗时: {elapsed:.2f}秒, 错误: {e}")
