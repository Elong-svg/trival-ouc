"""
Flask 应用工厂
标准 Python 包结构，解决 Render 找不到模块的问题
"""
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import requests
import os
import uuid
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# 加载.env文件
load_dotenv()

def create_app():
    """应用工厂函数 - Flask 官方推荐写法"""
    # 使用绝对路径确保 Render 上能找到 static 文件
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, 'static')
    upload_dir = os.path.join(base_dir, 'uploads')
    
    # 创建上传目录
    os.makedirs(upload_dir, exist_ok=True)
    
    app = Flask(__name__, static_folder=static_dir, static_url_path='')
    CORS(app)
    
    # 文件上传配置
    app.config['UPLOAD_FOLDER'] = upload_dir
    app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB
    app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'txt', 'md'}
    
    # 智谱 GLM 配置 - 优先从 api_key.py 读取，其次从环境变量读取
    api_key_value = None
    
    # 尝试从 api_key.py 读取（本地开发使用）
    try:
        import api_key as api_key_module
        api_key_value = getattr(api_key_module, 'GLM_API_KEY', None) or getattr(api_key_module, 'HUNYUAN_API_KEY', None) or getattr(api_key_module, 'ALIYUN_API_KEY', None)
        if api_key_value:
            print(f"[INFO] 从 api_key.py 加载 API Key")
            print(f"[DEBUG] API Key 前10位: {api_key_value[:10]}...")
    except ImportError as e:
        print(f"[WARN] 无法导入 api_key.py: {e}")
    except Exception as e:
        print(f"[ERROR] 加载 api_key.py 时出错: {e}")
    
    # 如果 api_key.py 不存在，从环境变量读取（部署时使用）
    if not api_key_value:
        api_key_value = os.environ.get('GLM_API_KEY', '') or os.environ.get('HUNYUAN_API_KEY', '') or os.environ.get('ALIYUN_API_KEY', '')
        if api_key_value:
            print(f"[INFO] 从环境变量加载 API Key")
    
    if not api_key_value:
        print("[ERROR] 警告: 未能加载任何 API Key!")
    
    app.config['API_KEY'] = api_key_value
    app.config['API_BASE_URL'] = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    # GLM-4.1V-Thinking-Flash 支持深度思考（thinking）功能
    app.config['API_MODEL'] = 'glm-4.1v-thinking-flash'

    # ========== 知识库加载 ==========
    
    def load_knowledge_base():
        """从 knowledge_base 目录动态加载知识库文件"""
        kb_dir = os.path.join(base_dir, 'knowledge_base')
        if not os.path.exists(kb_dir):
            print(f"[WARN] 知识库目录不存在: {kb_dir}")
            return ""
        
        knowledge_parts = []
        # 按文件名排序加载，确保 core.md 最先加载
        for filename in sorted(os.listdir(kb_dir)):
            if filename.endswith('.md'):
                filepath = os.path.join(kb_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        knowledge_parts.append(content)
                        print(f"[INFO] 加载知识库文件: {filename} ({len(content)} 字符)")
                except Exception as e:
                    print(f"[ERROR] 加载知识库文件失败 {filename}: {e}")
        
        full_knowledge = "\n\n---\n\n".join(knowledge_parts)
        print(f"[INFO] 知识库加载完成，总长度: {len(full_knowledge)} 字符")
        return full_knowledge
    
    # 启动时加载知识库到内存
    KNOWLEDGE_BASE = load_knowledge_base()
    app.config['KNOWLEDGE_BASE'] = KNOWLEDGE_BASE

    # ========== 工具函数 ==========
    
    def allowed_file(filename):
        """检查文件扩展名是否允许"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']
    
    def extract_text_from_file(file_path, file_type):
        """从文件中提取文本内容"""
        import tempfile
        
        try:
            if file_type == 'txt' or file_type == 'md':
                # TXT/Markdown 文件直接读取
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            elif file_type == 'pdf':
                # PDF 文件使用 pdfplumber 解析
                import pdfplumber
                text_parts = []
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                return '\n\n'.join(text_parts)
            
            elif file_type == 'docx':
                # Word 文件使用 python-docx 解析
                from docx import Document
                doc = Document(file_path)
                text_parts = []
                for para in doc.paragraphs:
                    if para.text.strip():
                        text_parts.append(para.text)
                return '\n\n'.join(text_parts)
            
            return ''
        
        except Exception as e:
            print(f"[ERROR] 文件解析失败: {e}")
            raise

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
            "has_api_key": bool(app.config['API_KEY']),
            "model": app.config['API_MODEL']
        })

    @app.route('/api/upload', methods=['POST'])
    def upload_file():
        """文件上传接口"""
        try:
            if 'file' not in request.files:
                return jsonify({"error": "没有上传文件"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "未选择文件"}), 400
            
            # 先获取文件扩展名（从原始文件名）
            if '.' not in file.filename:
                return jsonify({"error": "文件必须包含扩展名"}), 400
            
            file_ext = file.filename.rsplit('.', 1)[1].lower()
            
            # 保存原始文件名（保留中文）
            original_filename = file.filename
            
            if not allowed_file(file.filename):
                return jsonify({"error": "不支持的文件类型，仅支持 PDF、Word、TXT、MD 文件"}), 400
            
            # 生成安全的唯一文件名（用于存储）
            unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # 保存文件
            file.save(file_path)
            
            # 提取文本内容
            file_text = extract_text_from_file(file_path, file_ext)
            
            # 限制文本长度
            MAX_TEXT_LENGTH = 10000
            if len(file_text) > MAX_TEXT_LENGTH:
                file_text = file_text[:MAX_TEXT_LENGTH] + '\n\n...（文件内容过长，已截断）'
            
            # 清理临时文件
            os.unlink(file_path)
            
            return jsonify({
                "success": True,
                "filename": original_filename,
                "file_type": file_ext,
                "content": file_text,
                "length": len(file_text)
            })
        
        except Exception as e:
            print(f"[ERROR] 文件上传失败: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"文件处理失败：{str(e)}"}), 500

    @app.route('/api/chat', methods=['POST'])
    def chat():
        """AI 聊天接口 - 支持深度思考（Thinking）模式"""
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
            enable_thinking = data.get("enable_thinking", True)  # 从前端获取思考开关状态，默认开启
            
            # 获取知识库（从内存中读取，毫秒级响应）
            knowledge_base = app.config.get('KNOWLEDGE_BASE', '')
            
            # 添加知识库上下文
            if knowledge_base:
                enhancedSystemPrompt = f"\n\n## 相关知识库参考\n{knowledge_base}\n\n请基于以上知识库内容，结合你的通用知识，给用户一个详细、生动、符合年龄段的回答。"
                if messages and messages[0].get('role') == 'system':
                    messages[0]['content'] += enhancedSystemPrompt
                else:
                    messages.insert(0, {"role": "system", "content": enhancedSystemPrompt.strip()})
            
            print(f"[DEBUG] {request_id} - 消息数量: {len(messages)}")
            print(f"[DEBUG] {request_id} - 年龄段: {age_group}")
            print(f"[DEBUG] {request_id} - 深度思考: {enable_thinking}")
            
            if messages:
                last_msg = messages[-1]
                print(f"[DEBUG] {request_id} - 最后一条消息角色: {last_msg.get('role', 'unknown')}")
                print(f"[DEBUG] {request_id} - 最后一条消息长度: {len(last_msg.get('content', ''))} 字符")
                print(f"[DEBUG] {request_id} - 最后一条消息预览: {last_msg.get('content', '')[:100]}...")
            
            if not messages:
                print(f"[ERROR] {request_id} - 消息列表为空")
                return jsonify({"error": "请输入要提问的内容！"}), 400

            api_key = app.config['API_KEY']
            if not api_key:
                print(f"[ERROR] {request_id} - API Key未配置")
                return jsonify({"error": "服务器未配置 API Key"}), 500
            
            print(f"[DEBUG] {request_id} - API Key状态: {'已配置' if api_key else '未配置'}")
            print(f"[DEBUG] {request_id} - API Key前缀: {api_key[:10]}...")
            print(f"[DEBUG] {request_id} - 目标模型: {app.config['API_MODEL']}")
            print(f"[DEBUG] {request_id} - API地址: {app.config['API_BASE_URL']}")

            # 构建请求 payload
            payload = {
                "model": app.config['API_MODEL'],
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 3000,
                "top_p": 0.8,
                "stream": True  # 启用流式响应
            }
            
            # 启用/禁用深度思考模式（Thinking Mode）
            # GLM-4.1V-Thinking 模型需要显式设置 thinking 参数，否则会默认启用
            if enable_thinking:
                payload["thinking"] = {
                    "type": "enabled"
                }
                print(f"[DEBUG] {request_id} - 已启用深度思考模式")
            else:
                payload["thinking"] = {
                    "type": "disabled"
                }
                print(f"[DEBUG] {request_id} - 深度思考已关闭（显式禁用）")
            
            print(f"[DEBUG] {request_id} - 请求payload大小: {len(str(payload))} 字符")
            print(f"[DEBUG] {request_id} - 开始调用智谱 GLM API（流式模式）...")
            
            # 流式响应超时设置
            timeout_seconds = 60  # 思考模式可能需要更长时间
            
            try:
                response = requests.post(
                    app.config['API_BASE_URL'],
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json=payload,
                    timeout=timeout_seconds,
                    stream=True  # 启用流式请求
                )
                
                elapsed = time.time() - start_time
                print(f"[DEBUG] {request_id} - API首字响应时间: {elapsed:.2f}秒")
                print(f"[DEBUG] {request_id} - HTTP状态码: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"[ERROR] {request_id} - API返回错误状态码: {response.status_code}")
                    print(f"[ERROR] {request_id} - 错误响应内容: {response.text[:500]}")
                    return jsonify({"error": "AI服务响应错误"}), response.status_code
                
                # 流式响应生成器
                def generate():
                    import json as json_module
                    full_content = ""
                    full_reasoning = ""
                    thinking_phase = True
                    thinking_start_sent = False
                    thinking_end_sent = False
                    # 检查是否启用了思考模式
                    is_thinking_enabled = payload.get("thinking", {}).get("type") == "enabled"
                    
                    for line in response.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith('data: '):
                                data_str = line_str[6:]
                                if data_str == '[DONE]':
                                    # 如果思考阶段还没结束，发送结束信号
                                    if is_thinking_enabled and not thinking_end_sent:
                                        yield f"data: {json_module.dumps({'thinking_end': True})}\n\n"
                                    break
                                try:
                                    data = json_module.loads(data_str)
                                    if 'choices' in data and len(data['choices']) > 0:
                                        delta = data['choices'][0].get('delta', {})
                                        
                                        # ===== 处理思考过程（reasoning_content） =====
                                        # 只有在思考模式启用时才处理
                                        reasoning_content = delta.get('reasoning_content', '')
                                        if reasoning_content and is_thinking_enabled:
                                            full_reasoning += reasoning_content
                                            
                                            # 如果是第一次收到思考内容，发送思考开始信号
                                            if not thinking_start_sent:
                                                thinking_start_sent = True
                                                thinking_phase = True
                                                print(f"[DEBUG] {request_id} - 思考阶段开始")
                                                yield f"data: {json_module.dumps({'thinking_start': True})}\n\n"
                                            
                                            # 流式推送思考内容
                                            yield f"data: {json_module.dumps({'reasoning': reasoning_content})}\n\n"
                                            continue
                                        elif reasoning_content and not is_thinking_enabled:
                                            # 思考模式关闭，跳过思考内容
                                            continue
                                        
                                        # ===== 处理回答内容 =====
                                        content = delta.get('content', '')
                                        if content:
                                            # 如果之前处于思考阶段，现在收到实际内容，说明思考结束
                                            if is_thinking_enabled and thinking_phase and not thinking_end_sent:
                                                thinking_phase = False
                                                thinking_end_sent = True
                                                print(f"[DEBUG] {request_id} - 思考阶段结束，开始输出回答")
                                                yield f"data: {json_module.dumps({'thinking_end': True})}\n\n"
                                            
                                            full_content += content
                                            # 发送 SSE 格式的数据
                                            yield f"data: {json_module.dumps({'content': content})}\n\n"
                                except json_module.JSONDecodeError:
                                    continue
                    
                    print(f"[DEBUG] {request_id} - 流式响应完成")
                    print(f"[DEBUG] {request_id} - 回答总长度: {len(full_content)} 字符")
                    print(f"[DEBUG] {request_id} - 思考总长度: {len(full_reasoning)} 字符")
                    print(f"[DEBUG] {request_id} - 总耗时: {time.time() - start_time:.2f}秒")
                    # 发送完成信号
                    yield f"data: {json_module.dumps({'done': True, 'full_content': full_content, 'full_reasoning': full_reasoning})}\n\n"
                
                return Response(generate(), mimetype='text/event-stream')
                
            except requests.exceptions.Timeout as e:
                print(f"[ERROR] {request_id} - API超时（{timeout_seconds}秒）")
                return jsonify({"error": "AI服务响应超时，请稍后重试"}), 504
            except requests.exceptions.HTTPError as e:
                raise

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
