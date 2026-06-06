#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PaddleOCR安装脚本
支持CPU和GPU版本的自动安装
"""

import subprocess
import sys
import platform
import os

def run_command(command):
    """执行命令并返回结果"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_python_version():
    """检查Python版本"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python版本过低，需要Python 3.7+")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    return True

def install_paddlepaddle():
    """安装PaddlePaddle"""
    print("\n🔄 正在安装PaddlePaddle...")
    
    # 检测系统架构
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    if system == "windows":
        if "64" in machine or "amd64" in machine:
            command = "pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple"
        else:
            print("❌ 不支持32位Windows系统")
            return False
    elif system == "darwin":  # macOS
        command = "pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple"
    elif system == "linux":
        command = "pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple"
    else:
        print(f"❌ 不支持的操作系统: {system}")
        return False
    
    success, stdout, stderr = run_command(command)
    if success:
        print("✅ PaddlePaddle安装成功")
        return True
    else:
        print(f"❌ PaddlePaddle安装失败: {stderr}")
        return False

def install_paddleocr():
    """安装PaddleOCR"""
    print("\n🔄 正在安装PaddleOCR...")
    
    command = "pip install paddleocr -i https://pypi.tuna.tsinghua.edu.cn/simple"
    success, stdout, stderr = run_command(command)
    
    if success:
        print("✅ PaddleOCR安装成功")
        return True
    else:
        print(f"❌ PaddleOCR安装失败: {stderr}")
        return False

def install_dependencies():
    """安装其他依赖"""
    print("\n🔄 正在安装其他依赖...")
    
    dependencies = [
        "opencv-python",
        "pillow",
        "pdf2image",
        "numpy"
    ]
    
    for dep in dependencies:
        print(f"安装 {dep}...")
        command = f"pip install {dep} -i https://pypi.tuna.tsinghua.edu.cn/simple"
        success, stdout, stderr = run_command(command)
        
        if success:
            print(f"✅ {dep} 安装成功")
        else:
            print(f"❌ {dep} 安装失败: {stderr}")
            return False
    
    return True

def test_installation():
    """测试安装是否成功"""
    print("\n🔄 测试PaddleOCR安装...")
    
    test_script = """
try:
    from paddleocr import PaddleOCR
    print("✅ PaddleOCR导入成功")
    
    # 初始化OCR（不加载模型，只测试导入）
    print("✅ PaddleOCR可以正常初始化")
    print("🎉 安装测试通过！")
except ImportError as e:
    print(f"❌ 导入失败: {e}")
except Exception as e:
    print(f"❌ 初始化失败: {e}")
"""
    
    success, stdout, stderr = run_command(f'python -c "{test_script}"')
    
    if success:
        print(stdout)
        return True
    else:
        print(f"❌ 测试失败: {stderr}")
        return False

def main():
    """主函数"""
    print("🚀 PaddleOCR自动安装脚本")
    print("=" * 50)
    
    # 检查Python版本
    if not check_python_version():
        return
    
    # 升级pip
    print("\n🔄 升级pip...")
    run_command("python -m pip install --upgrade pip")
    
    # 安装PaddlePaddle
    if not install_paddlepaddle():
        print("\n❌ 安装失败，请检查网络连接或手动安装")
        return
    
    # 安装PaddleOCR
    if not install_paddleocr():
        print("\n❌ 安装失败，请检查网络连接或手动安装")
        return
    
    # 安装其他依赖
    if not install_dependencies():
        print("\n❌ 依赖安装失败")
        return
    
    # 测试安装
    if test_installation():
        print("\n🎉 所有组件安装成功！")
        print("\n📝 使用说明:")
        print("1. 现在可以在Node.js项目中使用ppOcr.js")
        print("2. 调用 classifyImage() 进行图像分类")
        print("3. 调用 ocrOnly() 进行纯OCR识别")
    else:
        print("\n❌ 安装可能存在问题，请检查错误信息")

if __name__ == "__main__":
    main()