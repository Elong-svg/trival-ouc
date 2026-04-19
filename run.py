"""
应用启动入口
开发环境: python run.py
生产环境: gunicorn run:app
"""
from app import app

if __name__ == '__main__':
    print("=" * 50)
    print("[DEV] YExplorer AI 开发服务器启动")
    print("[URL] http://127.0.0.1:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
