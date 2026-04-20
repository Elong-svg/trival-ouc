"""
应用启动入口
开发环境: python run.py
生产环境: gunicorn run:app
"""
import sys
import io

# 设置UTF-8编码输出
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from app import app

if __name__ == '__main__':
    print("=" * 50)
    print("[DEV] YExplorer AI 开发服务器启动")
    print("[URL] http://127.0.0.1:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
