"""
Flask 应用工厂
标准 Python 包结构，解决 Render 找不到模块的问题
"""
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import requests
import os

def create_app():
    """应用工厂函数 - Flask 官方推荐写法"""
    # 使用绝对路径确保 Render 上能找到 static 文件
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, 'static')
    app = Flask(__name__, static_folder=static_dir, static_url_path='')
    CORS(app)

    # 阿里云配置
    app.config['ALIYUN_API_KEY'] = os.environ.get('ALIYUN_API_KEY', '')
    app.config['ALIYUN_BASE_URL'] = 'https://coding.dashscope.aliyuncs.com/v1/chat/completions'
    app.config['ALIYUN_MODEL'] = 'qwen3-max-2026-01-23'

    # ========== 路由 ==========

    @app.route('/')
    def serve_index():
        """首页"""
        return send_from_directory(app.static_folder, 'index.html')

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
        try:
            if not request.is_json:
                return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400

            data = request.get_json()
            messages = data.get("messages", [])

            if not messages:
                return jsonify({"error": "请输入要提问的内容！"}), 400

            api_key = app.config['ALIYUN_API_KEY']
            if not api_key:
                return jsonify({"error": "服务器未配置 API Key"}), 500

            response = requests.post(
                app.config['ALIYUN_BASE_URL'],
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": app.config['ALIYUN_MODEL'],
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2000
                },
                timeout=60
            )
            response.raise_for_status()

            result = response.json()
            reply = result["choices"][0]["message"]["content"]
            return jsonify({"reply": reply})

        except requests.exceptions.Timeout:
            return jsonify({"error": "请求超时！请检查网络或稍后重试"}), 500
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                return jsonify({"error": "API Key无效或已过期！"}), 401
            return jsonify({"error": f"API错误：{e}"}), 500
        except KeyError:
            return jsonify({"error": "解析AI响应失败"}), 500
        except Exception as e:
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
