#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI助手代理服务器 - 极简版
只需双击运行即可，无需安装任何依赖
"""
import http.server
import json
import urllib.request
import urllib.error

# 配置
API_URL = "https://coding.dashscope.aliyuncs.com/v1/chat/completions"
API_KEY = "sk-sp-aa7f7c854dd442469173c7ea07ade037"
PORT = 8000

class AIProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/chat':
            try:
                # 获取请求体
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # 转发到阿里云API
                req = urllib.request.Request(API_URL, data=post_data, method='POST')
                req.add_header('Content-Type', 'application/json')
                req.add_header('Authorization', f'Bearer {API_KEY}')
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    result = response.read()
                    
                # 返回响应
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(result)
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # 处理CORS预检请求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        # 简化日志输出
        print(f"[{self.log_date_time_string()}] {args[0]}")

if __name__ == '__main__':
    print("="*50)
    print("AI助手代理服务器启动中...")
    print(f"访问地址: http://localhost:{PORT}")
    print("按 Ctrl+C 停止服务")
    print("="*50)
    
    server = http.server.HTTPServer(('0.0.0.0', PORT), AIProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.shutdown()
