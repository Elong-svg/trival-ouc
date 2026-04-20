import requests
import time

url = "http://127.0.0.1:5000/api/chat"

payload = {
    "messages": [
        {"role": "system", "content": "你是小探"},
        {"role": "user", "content": "你好"}
    ],
    "age_group": "high_school"
}

print("连续测试3次API稳定性...")
for i in range(3):
    start = time.time()
    try:
        response = requests.post(url, json=payload, timeout=35)
        elapsed = time.time() - start
        print(f"测试{i+1}: {response.status_code} (耗时{elapsed:.2f}秒)")
    except Exception as e:
        elapsed = time.time() - start
        print(f"测试{i+1}: 错误 - {e} (耗时{elapsed:.2f}秒)")
    time.sleep(1)
