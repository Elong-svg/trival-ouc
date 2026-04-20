import requests
import json
import sys
import io

# 设置UTF-8编码输出
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 测试API
url = "http://127.0.0.1:5000/api/chat"

payload = {
    "messages": [
        {
            "role": "system",
            "content": "你是小探，中国海洋大学的AI助手。"
        },
        {
            "role": "user",
            "content": "你好"
        }
    ],
    "age_group": "high_school"
}

print("发送请求...")
response = requests.post(url, json=payload, timeout=60)

print(f"状态码: {response.status_code}")
print(f"响应头: {dict(response.headers)}")

if response.status_code == 200:
    data = response.json()
    reply = data.get('reply', '')
    print(f"成功! 回复长度: {len(reply)} 字符")
    print(f"回复预览: {reply[:200]}")
else:
    print(f"失败! 错误: {response.text}")
