"""
Flask 应用工厂
标准 Python 包结构，解决 Render 找不到模块的问题
"""
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

def create_app():
    """应用工厂函数 - Flask 官方推荐写法"""
    # 使用绝对路径确保 Render 上能找到 static 文件
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, 'static')
    app = Flask(__name__, static_folder=static_dir, static_url_path='')
    CORS(app)

    # 阿里云配置 - 优先从 api_key.py 读取，其次从环境变量读取
    api_key = None
    
    # 尝试从 api_key.py 读取（本地开发使用）
    try:
        import api_key
        api_key = getattr(api_key, 'ALIYUN_API_KEY', None)
        if api_key:
            print(f"[INFO] 从 api_key.py 加载 API Key")
    except ImportError:
        pass
    
    # 如果 api_key.py 不存在，从环境变量读取（部署时使用）
    if not api_key:
        api_key = os.environ.get('ALIYUN_API_KEY', '')
        if api_key:
            print(f"[INFO] 从环境变量加载 API Key")
    
    app.config['ALIYUN_API_KEY'] = api_key
    app.config['ALIYUN_BASE_URL'] = 'https://coding.dashscope.aliyuncs.com/v1/chat/completions'
    app.config['ALIYUN_MODEL'] = 'MiniMax-M2.5'

    # ========== 路由 ==========

    @app.route('/')
    def serve_index():
        """首页"""
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/debug')
    def serve_debug():
        """调试页面"""
        return send_from_directory(app.static_folder, 'debug.html')

    @app.route('/api/health', methods=['GET'])
    def health():
        """健康检查"""
        return jsonify({
            "status": "ok",
            "service": "YExplorer AI",
            "has_api_key": bool(app.config['ALIYUN_API_KEY'])
        })

    @app.route('/api/chat', methods=['POST'])
    def chat():
        """AI 聊天接口"""
        import time
        import traceback
        
        start_time = time.time()
        request_id = f"req_{int(start_time * 1000)}"
        
        print(f"\n{'='*60}")
        print(f"[DEBUG] {request_id} - 收到聊天请求")
        print(f"[DEBUG] {request_id} - 请求时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            if not request.is_json:
                print(f"[ERROR] {request_id} - 请求格式错误：不是JSON格式")
                return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400

            data = request.get_json()
            messages = data.get("messages", [])
            age_group = data.get("age_group", "unknown")
            
            print(f"[DEBUG] {request_id} - 消息数量: {len(messages)}")
            print(f"[DEBUG] {request_id} - 年龄段: {age_group}")
            
            if messages:
                last_msg = messages[-1]
                print(f"[DEBUG] {request_id} - 最后一条消息角色: {last_msg.get('role', 'unknown')}")
                print(f"[DEBUG] {request_id} - 最后一条消息长度: {len(last_msg.get('content', ''))} 字符")
                print(f"[DEBUG] {request_id} - 最后一条消息预览: {last_msg.get('content', '')[:100]}...")
            
            if not messages:
                print(f"[ERROR] {request_id} - 消息列表为空")
                return jsonify({"error": "请输入要提问的内容！"}), 400

            api_key = app.config['ALIYUN_API_KEY']
            if not api_key:
                print(f"[ERROR] {request_id} - API Key未配置")
                return jsonify({"error": "服务器未配置 API Key"}), 500
            
            print(f"[DEBUG] {request_id} - API Key状态: {'已配置' if api_key else '未配置'}")
            print(f"[DEBUG] {request_id} - API Key前缀: {api_key[:10]}...")
            print(f"[DEBUG] {request_id} - 目标模型: {app.config['ALIYUN_MODEL']}")
            print(f"[DEBUG] {request_id} - API地址: {app.config['ALIYUN_BASE_URL']}")

            payload = {
                "model": app.config['ALIYUN_MODEL'],
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1500,  # 适中的token数，平衡速度和完整性
                "top_p": 0.8  # 降低一点，提高响应速度
            }
            
            print(f"[DEBUG] {request_id} - 请求payload大小: {len(str(payload))} 字符")
            print(f"[DEBUG] {request_id} - 开始调用阿里云API...")
            
            # 优化超时策略 - 使用turbo模型后响应应该很快
            # 设置20秒超时，不重试（turbo模型通常5秒内响应）
            timeout_seconds = 20
            
            try:
                response = requests.post(
                    app.config['ALIYUN_BASE_URL'],
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json=payload,
                    timeout=timeout_seconds
                )
                
                elapsed = time.time() - start_time
                print(f"[DEBUG] {request_id} - API响应时间: {elapsed:.2f}秒")
                print(f"[DEBUG] {request_id} - HTTP状态码: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"[ERROR] {request_id} - API返回错误状态码: {response.status_code}")
                    print(f"[ERROR] {request_id} - 错误响应内容: {response.text[:500]}")
                
                response.raise_for_status()
                
            except requests.exceptions.Timeout as e:
                print(f"[ERROR] {request_id} - API超时（{timeout_seconds}秒）")
                return jsonify({
                    "error": "AI服务响应超时，请稍后重试"
                }), 504
            except requests.exceptions.HTTPError as e:
                raise

            result = response.json()
            print(f"[DEBUG] {request_id} - API响应结构: {list(result.keys())}")
            
            if "choices" not in result:
                print(f"[ERROR] {request_id} - 响应中缺少choices字段")
                print(f"[ERROR] {request_id} - 完整响应: {str(result)[:500]}")
                return jsonify({"error": "解析AI响应失败：缺少choices字段"}), 500
            
            if not result["choices"]:
                print(f"[ERROR] {request_id} - choices数组为空")
                return jsonify({"error": "解析AI响应失败：choices为空"}), 500
            
            reply = result["choices"][0]["message"]["content"]
            print(f"[DEBUG] {request_id} - 回复长度: {len(reply)} 字符")
            print(f"[DEBUG] {request_id} - 回复预览: {reply[:100]}...")
            print(f"[DEBUG] {request_id} - 总耗时: {time.time() - start_time:.2f}秒")
            print(f"{'='*60}\n")
            
            return jsonify({"reply": reply})

        except requests.exceptions.Timeout:
            elapsed = time.time() - start_time
            print(f"[ERROR] {request_id} - 请求超时（耗时{elapsed:.2f}秒）")
            print(f"[ERROR] {request_id} - 堆栈跟踪:\n{traceback.format_exc()}")
            print(f"{'='*60}\n")
            return jsonify({"error": "请求超时！请检查网络或稍后重试"}), 500
        except requests.exceptions.HTTPError as e:
            elapsed = time.time() - start_time
            print(f"[ERROR] {request_id} - HTTP错误: {e}")
            print(f"[ERROR] {request_id} - 状态码: {e.response.status_code if hasattr(e, 'response') else 'N/A'}")
            print(f"[ERROR] {request_id} - 响应内容: {e.response.text[:500] if hasattr(e, 'response') else 'N/A'}")
            print(f"[ERROR] {request_id} - 堆栈跟踪:\n{traceback.format_exc()}")
            print(f"{'='*60}\n")
            
            if e.response.status_code == 401:
                return jsonify({"error": "API Key无效或已过期！"}), 401
            elif e.response.status_code == 429:
                return jsonify({"error": "请求过于频繁，请稍后重试"}), 429
            elif e.response.status_code == 502:
                return jsonify({"error": "AI服务暂时不可用（502），请稍后重试"}), 502
            elif e.response.status_code == 503:
                return jsonify({"error": "AI服务维护中（503），请稍后重试"}), 503
            return jsonify({"error": f"API错误：{str(e)}"}), 500
        except KeyError as e:
            elapsed = time.time() - start_time
            print(f"[ERROR] {request_id} - KeyError: {e}")
            print(f"[ERROR] {request_id} - 堆栈跟踪:\n{traceback.format_exc()}")
            print(f"{'='*60}\n")
            return jsonify({"error": f"解析AI响应失败：{str(e)}"}), 500
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"[ERROR] {request_id} - 未知错误: {type(e).__name__}: {e}")
            print(f"[ERROR] {request_id} - 堆栈跟踪:\n{traceback.format_exc()}")
            print(f"{'='*60}\n")
            return jsonify({"error": f"服务异常：{str(e)}"}), 500

    @app.route('/api/tts', methods=['POST'])
    def tts():
        """语音合成接口"""
        try:
            if not request.is_json:
                return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400

            data = request.get_json()
            text = data.get("text", "")

            if not text:
                return jsonify({"error": "请提供要朗读的文本"}), 400

            voice = data.get("voice", "zh-CN-XiaoxiaoNeural")

            import tempfile
            import asyncio
            import edge_tts

            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_path = temp_file.name
            temp_file.close()

            communicate = edge_tts.Communicate(text, voice)
            asyncio.run(communicate.save(temp_path))

            with open(temp_path, 'rb') as f:
                audio_data = f.read()

            os.unlink(temp_path)

            return Response(
                audio_data,
                mimetype="audio/mpeg",
                headers={"Content-Disposition": "attachment;filename=tts.mp3"}
            )

        except Exception as e:
            return jsonify({"error": f"语音合成失败：{str(e)}"}), 500

    @app.route('/<path:filename>')
    def serve_static(filename):
        """静态文件服务（排除 API 路径）"""
        if filename.startswith('api/'):
            return jsonify({"error": "API endpoint not found"}), 404

        file_path = os.path.join(app.static_folder, filename)
        if os.path.isfile(file_path):
            return send_from_directory(app.static_folder, filename)

        # 文件不存在则返回 404
        return send_from_directory(app.static_folder, 'index.html')

    return app


# 创建应用实例（用于 gunicorn）
app = create_app()
