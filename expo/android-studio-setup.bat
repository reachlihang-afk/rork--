@echo off
echo ================================
echo Android Studio 安装指南
echo ================================
echo.
echo 1. 下载 Android Studio
echo    访问: https://developer.android.com/studio
echo.
echo 2. 安装完成后，打开 Android Studio
echo.
echo 3. 创建虚拟设备
echo    Tools -^> Device Manager -^> Create Device
echo.
echo 4. 选择设备型号（推荐 Pixel 6）
echo.
echo 5. 下载系统镜像（推荐 Android 13）
echo.
echo 6. 启动模拟器
echo.
echo 7. 在项目目录运行:
echo    npx expo start
echo    然后按 'a' 键打开 Android 模拟器
echo.
echo ================================
echo 模拟器启动后运行此命令连接开发服务器:
echo adb reverse tcp:8081 tcp:8081
echo ================================
pause






