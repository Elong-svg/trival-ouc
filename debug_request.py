import requests
import json
import sys
import io
import traceback

# 设置UTF-8编码输出
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 测试API - 使用与前端相同的请求格式
url = "http://127.0.0.1:5000/api/chat"

# 模拟前端的完整请求
payload = {
    "messages": [
        {
            "role": "system",
            "content": """你是"小探"，中国海洋大学(YExplorer)的专属AI导游助手，也是用户的海大朋友。

## 你的角色定位
- 你是中国海洋大学的专业导游和研学助手
- 你深入了解海大的历史、文化、景点和研学资源
- 你能为不同年龄段的用户提供合适的讲解服务

## 回答原则
1. 优先使用知识库中的海大相关信息，但也可以结合你自己的通用知识和联网搜索能力
2. 如果知识库中没有的信息，可以用你自己的知识回答，但要注明"根据我的了解"
3. **严格围绕用户问题回答，不要答非所问**
4. **用户问什么就答什么，不要跑题，不要添加无关内容**
5. 回答要简洁直接，不要啰嗦
6. 优先推荐海大特色景点和研学资源
7. 提供实用的参观建议和路线规划
8. 保持友好、专业的服务态度
9. 根据用户年龄段调整回答的深度和风格

## 年龄段配置
请用适当的专业术语回答，适合15-18岁高中生理解，可以包含较深入的知识。结合高中知识点，提供深度解读。"""
        },
        {
            "role": "user",
            "content": "请介绍一下中国海洋大学"
        }
    ],
    "age_group": "high_school"
}

print("=" * 60)
print("开始测试AI对话API")
print("=" * 60)
print(f"\n请求URL: {url}")
print(f"消息数量: {len(payload['messages'])}")
print(f"系统提示词长度: {len(payload['messages'][0]['content'])} 字符")
print(f"用户消息: {payload['messages'][1]['content']}")
print(f"请求体大小: {len(json.dumps(payload))} 字符")
print("\n发送请求...")

try:
    response = requests.post(url, json=payload, timeout=60)
    
    print(f"\n响应时间: 完成")
    print(f"HTTP状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")
    
    if response.status_code == 200:
        data = response.json()
        reply = data.get('reply', '')
        print(f"\n✓ 成功!")
        print(f"回复长度: {len(reply)} 字符")
        print(f"回复预览: {reply[:300]}...")
    else:
        print(f"\n✗ 失败!")
        print(f"错误响应: {response.text}")
        
        # 尝试解析错误JSON
        try:
            error_data = response.json()
            print(f"错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
        except:
            pass
            
except requests.exceptions.Timeout:
    print("\n✗ 请求超时!")
except Exception as e:
    print(f"\n✗ 异常!")
    print(f"错误类型: {type(e).__name__}")
    print(f"错误信息: {e}")
    print(f"堆栈跟踪:\n{traceback.format_exc()}")
