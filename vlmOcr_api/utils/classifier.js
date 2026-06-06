const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const axios = require("axios");
const stream = require("stream");
const util = require("util");
const pipeline = util.promisify(stream.pipeline);
const DatabaseService = require("../services/databaseService");
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
 * 执行OCR识别
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 识别文本
 */
async function performOCR(filePath) {
  try {
    const path = require("path");
    const ext = path.extname(filePath).toLowerCase();

    console.log(
      `${ext === ".pdf" ? "PDF" : "图片"}文件识别开始：` + new Date().getTime()
    );

    // 使用Tesseract.js处理所有文件类型（包括PDF）
    const Tesseract = require("tesseract.js");

    // 对于PDF文件，Tesseract会自动处理第一页
    const { data } = await Tesseract.recognize(filePath, "chi_sim+eng", {
      // logger: (m) => console.log(m),
    });

    console.log(
      `${ext === ".pdf" ? "PDF" : "图片"}文件识别结束：` + new Date().getTime()
    );
    return data.text;
  } catch (error) {
    console.error("OCR识别错误:", error);

    // 如果Tesseract处理失败，返回错误信息
    if (error.message && error.message.includes("PDF")) {
      console.error("PDF处理失败，请确保PDF文件有效或转换为图片格式");
    }

    return "";
  }
}

/**
 * 匹配最佳模型
 * @param {string} text 识别文本
 * @returns {string} 模型名称
 */
async function matchModel(text) {
  const models = await getModels();
  // console.log(models)
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
 * 分类主函数
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 模型名称
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

async function classifyImage(filePathOrUrl) {
  let localFilePath;

  // 如果是URL则下载
  if (filePathOrUrl.startsWith("http")) {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    // const fileName = path.basename(new URL(filePathOrUrl).pathname) || 'tempfile';
    // filePathOrUrl是个url地址，解析fullfilename参数
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

module.exports = {
  classifyImage,
};
