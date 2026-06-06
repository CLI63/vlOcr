# PaddleOCR集成使用说明

## 安装步骤

### 1. 自动安装（推荐）
运行安装脚本：
```bash
python install_paddleocr.py
```

### 2. 手动安装
```bash
# 安装PaddlePaddle
pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装PaddleOCR
pip install paddleocr -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装其他依赖
pip install opencv-python pillow pdf2image numpy -i https://pypi.tuna.tsinghua.edu.cn/simple
```

## 使用方法

### 1. 图像分类（完整功能）
```javascript
const ppOcr = require('./utils/ppOcr');

// 分类本地图片
const result = await ppOcr.classifyImage('path/to/image.jpg');
console.log(result);
// 输出: { bestMatch: "模型名称", allModel: [...], ocrText: "识别文本", imgSrc: "保存路径", fileMd5: "文件MD5" }

// 分类网络图片
const result2 = await ppOcr.classifyImage('https://example.com/image.jpg');
```

### 2. 纯OCR识别
```javascript
// 仅进行文字识别，不分类
const text = await ppOcr.ocrOnly('path/to/image.jpg');
console.log(text); // 输出识别的文字
```

### 3. 底层OCR函数
```javascript
// 直接调用OCR识别
const text = await ppOcr.performOCR('path/to/image.jpg');
```

## 支持的文件格式
- 图片：`.jpg`, `.jpeg`, `.png`
- 文档：`.pdf`

## 功能特点

### 1. 高精度识别
- 使用飞浆PaddleOCR引擎
- 支持中英文混合识别
- 支持倾斜文字校正

### 2. 智能分类
- 基于OCR文本进行关键词匹配
- 支持多模型评分机制
- 返回详细的匹配结果

### 3. 容错机制
- PaddleOCR失败时自动回退到Tesseract.js
- 完善的错误处理和日志记录
- 自动清理临时文件

### 4. PDF支持
- 自动将PDF转换为图片
- 支持多页PDF的首页识别
- 智能处理PDF格式

## 性能优化

### 1. 首次使用
首次运行时PaddleOCR会下载模型文件（约几十MB），请耐心等待。

### 2. GPU加速（可选）
如果有NVIDIA GPU，可以安装GPU版本：
```bash
pip uninstall paddlepaddle
pip install paddlepaddle-gpu
```

然后修改ppOcr.js中的`use_gpu=False`为`use_gpu=True`。

### 3. 模型缓存
PaddleOCR会自动缓存模型，后续使用会更快。

## 故障排除

### 1. 安装失败
- 检查Python版本（需要3.7+）
- 检查网络连接
- 尝试使用国内镜像源

### 2. 识别失败
- 检查图片质量和清晰度
- 确保文字对比度足够
- 尝试预处理图片（调整亮度、对比度）

### 3. PDF处理失败
- 确保安装了pdf2image：`pip install pdf2image`
- Windows用户可能需要安装poppler

## API参考

### classifyImage(filePathOrUrl)
完整的图像分类功能
- **参数**: `filePathOrUrl` - 文件路径或URL
- **返回**: Promise<Object> - 分类结果对象

### ocrOnly(filePath)
纯OCR识别功能
- **参数**: `filePath` - 文件路径
- **返回**: Promise<string> - 识别的文本

### performOCR(filePath)
底层OCR识别函数
- **参数**: `filePath` - 文件路径
- **返回**: Promise<string> - 识别的文本

## 注意事项

1. 确保有足够的磁盘空间存储模型文件
2. 首次使用需要网络连接下载模型
3. 大文件处理可能需要较长时间
4. 建议在服务器环境中使用以获得最佳性能