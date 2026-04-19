import subprocess
import sys
import io

# 设置标准输出编码为UTF-8，避免Windows GBK编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ========== 第一步：先定义安装函数并执行，再导入依赖 ==========
def install_dependencies():
    # 要安装的依赖列表
    dependencies = [
        "flask==2.3.3",
        "flask-cors==4.0.0",
        "requests==2.31.0"
    ]
    try:
        print("="*30)
        print("正在自动安装依赖（阿里云镜像）...")
        # 使用阿里云镜像加速安装，解决国内下载慢的问题
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-i", "https://mirrors.aliyun.com/pypi/simple/"] + dependencies,
            # 隐藏pip的冗余输出，只显示关键信息
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print("[OK] 依赖安装完成！")
        print("="*30)
    except subprocess.CalledProcessError as e:
        print("[ERROR] 依赖安装失败！错误信息：", e)
        print("建议手动执行以下命令安装：")
        print(f"{sys.executable} -m pip install flask==2.3.3 flask-cors==4.0.0 requests==2.31.0 -i https://mirrors.aliyun.com/pypi/simple/")
        sys.exit(1)  # 安装失败则退出程序

# 先执行依赖安装（关键！安装完成后再导入库）
install_dependencies()

# ========== 第二步：依赖安装完成后，再导入需要的库 ==========
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import requests
except ImportError as e:
    print(f"❌ 导入库失败：{e}")
    print("请手动安装依赖后重试！")
    sys.exit(1)

# ========== 第三步：初始化Flask应用 ==========
app = Flask(__name__, 
            static_folder='.',      # 静态文件根目录为当前目录
            template_folder='.')    # 模板文件夹也为当前目录
CORS(app)  # 允许所有跨域请求，新手无需修改

# ========== 阿里云百炼 API 配置 ==========
ALIYUN_CONFIG = {
    "api_key": "sk-sp-aa7f7c854dd442469173c7ea07ade037",
    "base_url": "https://coding.dashscope.aliyuncs.com/v1/chat/completions",
    "model": "qwen3-max-2026-01-23"
}

# ========== 启动时网络连通性测试 ==========
def test_network_connectivity():
    """测试网络连通性和API可达性"""
    import socket
    print("[TEST] 正在测试网络连通性...")
    
    # 测试DNS解析
    try:
        socket.gethostbyname("coding.dashscope.aliyuncs.com")
        print("[OK] DNS解析成功: coding.dashscope.aliyuncs.com")
    except Exception as e:
        print(f"[ERROR] DNS解析失败: {e}")
        return False
    
    # 测试HTTPS连接
    try:
        import ssl
        context = ssl.create_default_context()
        conn = context.wrap_socket(socket.socket(socket.AF_INET), server_hostname="coding.dashscope.aliyuncs.com")
        conn.settimeout(10)
        conn.connect(("coding.dashscope.aliyuncs.com", 443))
        print("[OK] HTTPS连接成功: coding.dashscope.aliyuncs.com:443")
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] HTTPS连接失败: {e}")
        return False

# 执行网络测试
network_ok = test_network_connectivity()
if not network_ok:
    print("[WARN] 网络连接可能有问题，但继续启动服务...")
print("="*30)

# ========== 页面路由（提供HTML页面访问） ==========
@app.route('/')
def index():
    """首页"""
    return app.send_static_file('index.html')

@app.route('/AI.html')
def ai_page():
    """AI助手页面"""
    return app.send_static_file('AI.html')

@app.route('/map.html')
def map_page():
    """地图指引页面"""
    return app.send_static_file('map.html')

@app.route('/resources.html')
def resources_page():
    """相关资源页面"""
    return app.send_static_file('resources.html')

@app.route('/contact.html')
def contact_page():
    """联系我们页面"""
    return app.send_static_file('contact.html')

# ========== 静态文件路由（处理images/css/js等文件） ==========
from flask import send_from_directory

@app.route('/images/<path:filename>')
def serve_images(filename):
    """提供images目录下的文件"""
    return send_from_directory('images', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    """提供css目录下的文件"""
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """提供js目录下的文件"""
    return send_from_directory('js', filename)

# ========== 测试接口：直接测试阿里云API ==========
@app.route('/api/test', methods=['GET'])
def test_aliyun_api():
    """测试阿里云API是否可达"""
    try:
        print("[TEST] 正在测试阿里云API连通性...")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ALIYUN_CONFIG['api_key']}"
        }
        test_body = {
            "model": ALIYUN_CONFIG["model"],
            "messages": [{"role": "user", "content": "你好"}],
            "max_tokens": 10
        }
        
        response = requests.post(
            ALIYUN_CONFIG["base_url"],
            headers=headers,
            json=test_body,
            timeout=15
        )
        
        print(f"[TEST] 响应状态码: {response.status_code}")
        print(f"[TEST] 响应内容: {response.text[:300]}")
        
        if response.status_code == 200:
            return jsonify({
                "status": "success",
                "message": "阿里云API连通性测试成功",
                "response": response.json()
            })
        else:
            return jsonify({
                "status": "error",
                "status_code": response.status_code,
                "message": f"API返回错误: {response.text[:200]}"
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            "status": "error",
            "message": "请求超时，无法连接到阿里云API"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"测试失败: {str(e)}"
        }), 500

# ========== 后端接口（前端调用地址：http://127.0.0.1:5000/api/chat） ==========
@app.route('/api/chat', methods=['POST'])
def chat_with_aliyun():
    try:
        # 1. 获取前端传递的用户问题
        if not request.is_json:
            return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400
        
        user_data = request.get_json()
        messages = user_data.get("messages", [])
        if not messages:
            return jsonify({"error": "请输入要提问的内容！"}), 400

        # 2. 构造阿里云API请求参数
        request_body = {
            "model": ALIYUN_CONFIG["model"],
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000
        }

        # 3. 调用阿里云API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ALIYUN_CONFIG['api_key']}"
        }
        
        print(f"[DEBUG] 正在调用阿里云API: {ALIYUN_CONFIG['base_url']}")
        print(f"[DEBUG] 请求体: {request_body}")
        
        # 发送请求并设置超时
        response = requests.post(
            ALIYUN_CONFIG["base_url"],
            headers=headers,
            json=request_body,
            timeout=30
        )
        
        print(f"[DEBUG] API响应状态码: {response.status_code}")
        print(f"[DEBUG] API响应内容: {response.text[:500]}")
        
        response.raise_for_status()  # 捕获HTTP错误（如401/403/500）

        # 4. 解析并返回AI回复
        ai_result = response.json()
        ai_reply = ai_result["choices"][0]["message"]["content"]
        return jsonify({"reply": ai_reply})

    except requests.exceptions.Timeout:
        return jsonify({"error": "请求超时！请检查网络或稍后重试"}), 500
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            return jsonify({"error": "API Key无效或已过期！请检查Key是否正确"}), 401
        else:
            return jsonify({"error": f"阿里云API错误：{e}"}), 500
    except Exception as e:
        # 通用错误捕获，避免程序崩溃
        return jsonify({"error": f"服务异常：{str(e)}"}), 500

# ========== 启动后端服务 ==========
if __name__ == '__main__':
    print("[START] 后端服务启动中...")
    print("[URL] 后端访问地址：http://127.0.0.1:5000")
    print("[TIP] 前端请调用：http://127.0.0.1:5000/api/chat")
    print("="*30)
    # 启动服务（host=0.0.0.0 允许局域网访问，debug=True方便调试）
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        # 关闭Flask的冗余日志
        use_reloader=False
    )