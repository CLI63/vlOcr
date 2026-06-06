@echo off
echo 正在重建MySQL数据库表结构 (MySQL 5.5兼容)...
echo.

REM 检查MySQL是否安装
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到MySQL客户端，请确保MySQL已安装并添加到PATH
    pause
    exit /b 1
)

REM 从.env文件读取配置
setlocal enabledelayedexpansion
for /f "tokens=1,* delims==" %%a in ('type ..\.env') do (
    set "line=%%b"
    if "%%a"=="DB_HOST" set "DB_HOST=!line!"
    if "%%a"=="DB_USER" set "DB_USER=!line!"
    if "%%a"=="DB_PASSWORD" set "DB_PASSWORD=!line!"
    if "%%a"=="DB_NAME" set "DB_NAME=!line!"
    if "%%a"=="DB_PORT" set "DB_PORT=!line!"
)

echo 数据库配置：
echo 主机：%DB_HOST%
echo 用户：%DB_USER%
echo 数据库：%DB_NAME%
echo 端口：%DB_PORT%
echo.

REM 检查MySQL版本
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p"%DB_PASSWORD%" -e "SELECT VERSION();" >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：数据库连接失败，请检查配置
    pause
    exit /b 1
)

REM 创建数据库（如果不存在）
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p"%DB_PASSWORD%" -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8 COLLATE utf8_unicode_ci;"

REM 执行SQL脚本
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p"%DB_PASSWORD%" -D%DB_NAME% < recreate_tables.sql

if %errorlevel% neq 0 (
    echo 错误：执行SQL脚本失败，请检查数据库连接配置
    pause
    exit /b 1
) else (
    echo 成功：数据库表结构已重建完成
)

pause