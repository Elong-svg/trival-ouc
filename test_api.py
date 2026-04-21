"""
AI对话API测试脚本
用于诊断502/500错误问题
"""
import requests
import json
import time
import sys

# 设置UTF-8编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    """测试健康检查"""
    print("\n" + "="*60)
    print("测试1: 健康检查")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.json()
    except Exception as e:
        print(f"错误: {e}")
        return None

def test_chat(message, description=""):
    """测试聊天API"""
    print(f"\n{'='*60}")
    print(f"测试: {description or message[:50]}")
    print(f"{'='*60}")
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "你是'小探'，中国海洋大学(YExplorer)的专属AI导游助手。"
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "age_group": "high_school"
    }
    
    start_time = time.time()
    
    try:
        print(f"发送请求...")
        print(f"消息长度: {len(message)} 字符")
        print(f"请求体大小: {len(json.dumps(payload))} 字符")
        
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=payload,
            timeout=60
        )
        
        elapsed = time.time() - start_time
        
        print(f"\n响应时间: {elapsed:.2f}秒")
        print(f"HTTP状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get("reply", "")
            print(f"\n✓ 成功!")
            print(f"回复长度: {len(reply)} 字符")
            print(f"回复预览: {reply[:200]}...")
        else:
            print(f"\n✗ 失败!")
            print(f"错误响应: {response.text[:500]}")
            
            # 尝试解析错误JSON
            try:
                error_data = response.json()
                print(f"错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                pass
        
        return response.status_code == 200
        
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        print(f"\n✗ 超时! (耗时{elapsed:.2f}秒)")
        return False
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n✗ 异常! (耗时{elapsed:.2f}秒)")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("YExplorer AI 对话API诊断工具")
    print("="*60)
    
    # 测试1: 健康检查
    health = test_health()
    
    if not health:
        print("\n✗ 健康检查失败，服务器可能未启动")
        return
    
    if not health.get("has_api_key"):
        print("\n⚠ 警告: API Key未配置!")
        print("请在.env文件中设置GLM_API_KEY")
        print("\n你可以:")
        print("1. 复制.env.example为.env")
        print("2. 在.env中填入你的智谱 GLM API Key")
        print("3. 重启服务器")
        return
    
    print("\n✓ API Key已配置")
    
    # 测试用例
    test_cases = [
        ("你好", "简单问候"),
        ("请介绍一下中国海洋大学", "海大简介"),
        ("分析ACCA专业的就业前景", "专业分析"),
        ("关于学习近现代史有什么建议吗", "历史问题"),
        ("请详细分析中国海洋大学的学科优势、科研实力、校园文化、校区分布、历史沿革等各个方面", "长文本测试"),
    ]
    
    results = []
    for message, description in test_cases:
        success = test_chat(message, description)
        results.append((description, success))
        time.sleep(1)  # 避免请求过于频繁
    
    # 汇总结果
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)
    
    for description, success in results:
        status = "✓ 通过" if success else "✗ 失败"
        print(f"{description}: {status}")
    
    success_count = sum(1 for _, success in results if success)
    print(f"\n总计: {success_count}/{len(results)} 通过")

if __name__ == "__main__":
    main()
