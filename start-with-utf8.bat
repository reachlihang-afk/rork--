@echo off
chcp 65001 >nul
echo ========================================
echo 启动 Expo 开发服务器（UTF-8 模式）
echo ========================================
echo.

cd /d "%~dp0"

echo 正在检查依赖...
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖...
    call bun install
)

echo.
echo 启动开发服务器...
echo.
echo 提示：
echo - 按 'a' 在 Android 模拟器中打开
echo - 按 'i' 在 iOS 模拟器中打开（仅 Mac）
echo - 按 'w' 在浏览器中打开
echo - 扫描二维码在手机上打开
echo.

bun run start

pause





