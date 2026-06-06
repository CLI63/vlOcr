const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const axios = require("axios");
const stream = require("stream");
const util = require("util");
const pipeline = util.promisify(stream.pipeline);
const DatabaseService = require("../services/databaseService");

/**
 * 获取所有模型
 * @returns {Promise<Array>} 模型列表
 */
async function getModels() {
  return await DatabaseService.getAllModels();
}

/**
 * 检查文件类型是否支持
 * @param {string} filePath 文件路径
 * @returns {boolean} 是否支持
 */
function checkFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".pdf"].includes(ext);
}

/**
 * 生成文件MD5
 * @param {string} filePath 文件路径
 * @returns {string} MD5值
 */
function generateMD5(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5");
  hash.update(fileBuffer);
  return hash.digest("hex");
}

/**
 * 保存文件到public/images目录
 * @param {string} filePath 原文件路径
 * @param {string} md5 MD5值
 * @returns {string} 新文件路径
 */
function saveFile(filePath, md5) {
  const ext = path.extname(filePath).toLowerCase();
  const newPath = path.join(__dirname, "../public/images", `${md5}${ext}`);
  fs.copyFileSync(filePath, newPath);
  return newPath;
}

/**
 * 使用飞浆PaddleOCR执行OCR识别
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 识别文本
 */
async function performOCR(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    console.log(
      `${ext === ".pdf" ? "PDF" : "图片"}文件识别开始：` + new Date().getTime()
    );

    // 创建Python脚本来调用PaddleOCR
    const pythonScript = `
import sys
import json
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from paddleocr import PaddleOCR
    import cv2
    import numpy as np
    
    # 初始化PaddleOCR
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', use_gpu=False)
    
    # 读取图片
    img_path = sys.argv[1]
    
    # 如果是PDF，需要先转换
    if img_path.lower().endswith('.pdf'):
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(img_path, first_page=1, last_page=1)
            if images:
                temp_img_path = img_path.replace('.pdf', '_temp.jpg')
                images[0].save(temp_img_path, 'JPEG')
                img_path = temp_img_path
        except ImportError:
            print(json.dumps({"error": "pdf2image not installed"}))
            sys.exit(1)
        except Exception as e:
            print(json.dumps({"error": f"PDF conversion failed: {str(e)}"}))
            sys.exit(1)
    
    # 执行OCR
    result = ocr.ocr(img_path, cls=True)
    
    # 提取文本
    text_list = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) >= 2:
                text_list.append(line[1][0])
    
    # 清理临时文件
    if img_path.endswith('_temp.jpg'):
        try:
            os.remove(img_path)
        except:
            pass
    
    # 输出结果
    output = {
        "success": True,
        "text": " ".join(text_list),
        "raw_result": result
    }
    print(json.dumps(output, ensure_ascii=False))
    
except ImportError as e:
    print(json.dumps({"error": f"PaddleOCR not installed: {str(e)}"}))
except Exception as e:
    print(json.dumps({"error": f"OCR failed: {str(e)}"}))
`;

    // 将Python脚本写入临时文件
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const scriptPath = path.join(tempDir, "paddle_ocr.py");
    fs.writeFileSync(scriptPath, pythonScript);

    // 执行Python脚本
    const command = `python "${scriptPath}" "${filePath}"`;
    const result = execSync(command, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    // 解析结果
    let ocrText = '';
    try {
      const output = JSON.parse(result.trim());
      if (output.success) {
        ocrText = output.text;
      } else {
        throw new Error(output.error || "Unknown error");
      }
    } catch (parseError) {
      console.error("解析PaddleOCR结果失败:", parseError);
      throw parseError;
    }

    // 清理临时脚本文件
    try {
      fs.unlinkSync(scriptPath);
    } catch (cleanupError) {
      console.warn("清理临时文件失败:", cleanupError);
    }

    console.log(
      `${ext === ".pdf" ? "PDF" : "图片"}文件识别结束：` + new Date().getTime()
    );
    
    return ocrText.trim();
    
  } catch (error) {
    console.error("PaddleOCR识别错误:", error);
    
    // 如果PaddleOCR失败，回退到Tesseract.js
    console.log("PaddleOCR失败，回退到Tesseract.js");
    try {
      const Tesseract = require("tesseract.js");
      const { data } = await Tesseract.recognize(filePath, "chi_sim+eng");
      return data.text;
    } catch (tesseractError) {
      console.error("Tesseract.js也失败了:", tesseractError);
      return "";
    }
  }
}

/**
 * 匹配最佳模型
 * @param {string} text 识别文本
 * @returns {Promise<Object>} 匹配结果
 */
async function matchModel(text) {
  const models = await getModels();
  let bestMatch = null;
  let highestScore = 0;
  let allModel = [];

  models.forEach((model) => {
    let item = {
      modelName: model.modelName,
      keyWords: [],
      score: 0,
    };

    model.keyWords.forEach((keyword) => {
      const keywordText = keyword.text.toLowerCase();
      const searchText = text.toLowerCase();

      // 精确匹配
      if (searchText.includes(keywordText)) {
        item.score += keyword.index;
        item.keyWords.push(keyword.text);
      }
    });

    if (item.score > 0) {
      allModel.push(item);
    }

    if (item.score > highestScore) {
      highestScore = item.score;
      bestMatch = model.modelName;
    }
  });

  return { bestMatch: bestMatch || "未知模型", allModel, ocrText: text };
}

/**
 * 下载文件
 * @param {string} url 文件URL
 * @param {string} filePath 保存路径
 * @returns {Promise<string>} 文件路径
 */
async function downloadFile(url, filePath) {
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  await pipeline(response.data, fs.createWriteStream(filePath));
  return filePath;
}

/**
 * 使用飞浆PaddleOCR进行图像分类（主函数）
 * @param {string} filePathOrUrl 文件路径或URL
 * @returns {Promise<Object>} 分类结果
 */
async function classifyImage(filePathOrUrl) {
  let localFilePath;

  // 如果是URL则下载
  if (filePathOrUrl.startsWith("http")) {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // 解析文件名
    const fileNameOBJ = new URL(filePathOrUrl).searchParams;
    let fileName = fileNameOBJ.get("fullfilename");
    if (!fileName) {
      const arr = filePathOrUrl.split("/");
      fileName = arr[arr.length - 1];
    }
    console.log("文件名称：" + fileName);
    localFilePath = path.join(tempDir, fileName);
    await downloadFile(filePathOrUrl, localFilePath);
  } else {
    localFilePath = filePathOrUrl;
  }

  if (!checkFileType(localFilePath)) {
    throw new Error("不支持的文件类型");
  }

  const md5 = generateMD5(localFilePath);
  const savedPath = saveFile(localFilePath, md5);
  console.log("存放文件地址：" + savedPath);
  
  let ocrText = await performOCR(savedPath);
  
  // 优化文本预处理：保留关键格式信息，提高匹配准确性
  const originalText = ocrText;
  // 只去除多余的空白字符，保留关键的空格和换行
  ocrText = ocrText.replace(/\s/g, "");

  console.log("原始OCR文本长度：" + originalText.length);
  console.log("处理后OCR文本：" + ocrText.substring(0, 200) + "...");

  // 清理临时文件
  if (filePathOrUrl.startsWith("http")) {
    fs.unlinkSync(localFilePath);
  }

  const result = await matchModel(ocrText);
  result.imgSrc = savedPath;
  result.fileMd5 = md5;
  return result;
}

/**
 * 简单的OCR识别函数（不进行分类）
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 识别文本
 */
async function ocrOnly(filePath) {
  if (!checkFileType(filePath)) {
    throw new Error("不支持的文件类型");
  }
  
  return await performOCR(filePath);
}

module.exports = {
  classifyImage,
  ocrOnly,
  performOCR,
  checkFileType,
  generateMD5,
  saveFile
};