const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DatabaseService = require('../services/databaseService');
const { downloadAllowedUrl, getLocalUploadPath, isUnsafeLocalInput } = require('./fileSecurity');

async function getModels() {
  return await DatabaseService.getAllModels();
}

function checkFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext);
}

function generateMD5(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

function saveFile(filePath, md5) {
  const ext = path.extname(filePath).toLowerCase();
  const imageDir = path.join(__dirname, '../public/images');
  fs.mkdirSync(imageDir, { recursive: true });
  const newPath = path.join(imageDir, `${md5}${ext}`);
  fs.copyFileSync(filePath, newPath);
  return newPath;
}

async function performOCR(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`${ext === '.pdf' ? 'PDF' : 'Image'} OCR started: ${Date.now()}`);
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(filePath, 'chi_sim+eng');
    console.log(`${ext === '.pdf' ? 'PDF' : 'Image'} OCR finished: ${Date.now()}`);
    return data.text;
  } catch (error) {
    console.error('OCR error:', error.message);
    return '';
  }
}

async function matchModel(text) {
  const models = await getModels();
  let bestMatch = null;
  let highestScore = 0;
  const allModel = [];

  models.forEach((model) => {
    const item = {
      modelName: model.modelName,
      keyWords: [],
      score: 0,
    };

    model.keyWords.forEach((keyword) => {
      const keywordText = keyword.text.toLowerCase();
      const searchText = text.toLowerCase();
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

  return { bestMatch: bestMatch || '未知模型', allModel, ocrText: text };
}

async function classifyImage(filePathOrUrl, options = {}) {
  let localFilePath;
  let shouldCleanup = false;

  if (filePathOrUrl.startsWith('http')) {
    const localUploadPath = getLocalUploadPath(filePathOrUrl);
    if (localUploadPath) {
      localFilePath = localUploadPath;
    } else {
      localFilePath = await downloadAllowedUrl(filePathOrUrl);
      shouldCleanup = true;
    }
  } else {
    if (!options.allowLocalFile || isUnsafeLocalInput(filePathOrUrl)) {
      throw new Error('不允许访问服务器本地文件路径');
    }
    localFilePath = filePathOrUrl;
  }

  try {
    if (!checkFileType(localFilePath)) {
      throw new Error('不支持的文件类型');
    }

    const md5 = generateMD5(localFilePath);
    const savedPath = saveFile(localFilePath, md5);
    let ocrText = await performOCR(savedPath);
    ocrText = ocrText.replace(/\s/g, '');

    const result = await matchModel(ocrText);
    result.imgSrc = savedPath;
    result.fileMd5 = md5;
    return result;
  } finally {
    if (shouldCleanup && localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
}

module.exports = {
  classifyImage,
};
