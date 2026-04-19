@echo off
chcp 65001 >nul
echo ========================================
echo   YExplorer 海大文旅AI助手
echo   正在启动服务...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python环境！
    echo 请先安装Python 3.x: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [成功] Python环境已就绪

echo.
echo [2/2] 安装依赖并启动服务...
pip install -q flask flask-cors requests
echo.
echo ========================================
echo   服务启动成功！
echo   访问地址: http://127.0.0.1:5000
echo   按 Ctrl+C 可停止服务
echo ========================================
echo.

python server.py

pause
