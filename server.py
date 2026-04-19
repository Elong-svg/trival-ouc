from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import requests
import os
import asyncio
import edge_tts

app = Flask(__name__, static_folder='.')
CORS(app)

ALIYUN_CONFIG = {
    "api_key": os.environ.get("ALIYUN_API_KEY", ""),
    "base_url": "https://coding.dashscope.aliyuncs.com/v1/chat/completions",
    "model": "qwen3-max-2026-01-23"
}

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.before_request
def log_request():
    print(f"[REQUEST] {request.method} {request.path}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "YExplorer AI"})

@app.route('/api/tts', methods=['POST'])
def tts():
    print("[TTS] 收到TTS请求")
    print(f"[TTS] Content-Type: {request.content_type}")
    print(f"[TTS] 请求数据: {request.get_data(as_text=True)[:200]}")
    
    try:
        if not request.is_json:
            print("[TTS ERROR] 请求格式错误")
            return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400
        
        data = request.get_json()
        text = data.get("text", "")
        
        print(f"[TTS] 文本内容: {text[:100]}...")
        
        if not text:
            print("[TTS ERROR] 文本为空")
            return jsonify({"error": "请提供要朗读的文本"}), 400
        
        voice = data.get("voice", "zh-CN-XiaoxiaoNeural")
        print(f"[TTS] 使用语音: {voice}")
        
        import tempfile
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_path = temp_file.name
        temp_file.close()
        
        print(f"[TTS] 临时文件路径: {temp_path}")
        
        communicate = edge_tts.Communicate(text, voice)
        asyncio.run(communicate.save(temp_path))
        
        print(f"[TTS] 音频文件已生成")
        
        with open(temp_path, 'rb') as f:
            audio_data = f.read()
        
        os.unlink(temp_path)
        
        print(f"[TTS] 音频数据长度: {len(audio_data)}")
        
        return Response(
            audio_data,
            mimetype="audio/mpeg",
            headers={"Content-Disposition": "attachment;filename=tts.mp3"}
        )
        
    except Exception as e:
        print(f"[TTS ERROR] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"语音合成失败：{str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_aliyun():
    try:
        print("=" * 50)
        print("[DEBUG] 收到聊天请求")
        
        if not request.is_json:
            print("[ERROR] 请求格式错误：不是JSON")
            return jsonify({"error": "请求格式错误！请使用JSON格式"}), 400
        
        user_data = request.get_json()
        print(f"[DEBUG] 请求数据: {user_data}")
        
        messages = user_data.get("messages", [])
        if not messages:
            print("[ERROR] 消息为空")
            return jsonify({"error": "请输入要提问的内容！"}), 400

        request_body = {
            "model": ALIYUN_CONFIG["model"],
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ALIYUN_CONFIG['api_key']}"
        }
        
        print(f"[DEBUG] 调用阿里云API: {ALIYUN_CONFIG['base_url']}")
        print(f"[DEBUG] 模型: {ALIYUN_CONFIG['model']}")
        print(f"[DEBUG] 消息数量: {len(messages)}")
        print(f"[DEBUG] 第一条消息: {messages[0] if messages else 'None'}")
        
        response = requests.post(
            ALIYUN_CONFIG["base_url"],
            headers=headers,
            json=request_body,
            timeout=60
        )
        
        print(f"[DEBUG] API响应状态码: {response.status_code}")
        print(f"[DEBUG] API响应头: {dict(response.headers)}")
        print(f"[DEBUG] API响应内容: {response.text[:1000]}")
        
        response.raise_for_status()

        ai_result = response.json()
        print(f"[DEBUG] AI返回结果: {ai_result}")
        
        ai_reply = ai_result["choices"][0]["message"]["content"]
        print(f"[DEBUG] 成功返回回复，长度: {len(ai_reply)}")
        print("=" * 50)
        
        return jsonify({"reply": ai_reply})

    except requests.exceptions.Timeout:
        print("[ERROR] 请求超时")
        return jsonify({"error": "请求超时！请检查网络或稍后重试"}), 500
    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP错误: {e}")
        print(f"[ERROR] 响应内容: {e.response.text if hasattr(e, 'response') else 'N/A'}")
        if e.response.status_code == 401:
            return jsonify({"error": "API Key无效或已过期！请检查Key是否正确"}), 401
        else:
            return jsonify({"error": f"阿里云API错误：{e}"}), 500
    except KeyError as e:
        print(f"[ERROR] 键错误: {e}")
        print(f"[ERROR] AI返回结果: {ai_result if 'ai_result' in locals() else 'N/A'}")
        return jsonify({"error": f"解析AI响应失败：{str(e)}"}), 500
    except Exception as e:
        print(f"[ERROR] 未知错误: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"服务异常：{str(e)}"}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    print("[START] 后端服务启动中...")
    print("[URL] 后端访问地址：http://127.0.0.1:5000")
    print("[TIP] 前端请调用：http://127.0.0.1:5000/api/chat")
    print("="*30)
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
