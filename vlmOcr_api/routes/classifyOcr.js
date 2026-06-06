const express = require("express");
const fs = require("fs");
const router = express.Router();
const multer = require("multer");
const classifier = require("../utils/classifier");
const { callGLMChat } = require("../ocrApi/GLMFlash");
const { callPaddleOCR } = require("../ocrApi/PaddleOcrVl");
const DatabaseService = require("../services/databaseService");
const upload = multer({ dest: "uploads/" });

/**
 * 查找历史记录
 * @param {string} fileMd5 文件MD5
 * @param {string} imgUrl 图片URL
 * @returns {Object|null} 历史记录或null
 */
async function findHistory(fileMd5, imgUrl) {
  try {
    // 只根据fileMd5查询，因为相同MD5的文件内容相同
    const result = await DatabaseService.searchImagesByFile(fileMd5, null);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("查找历史记录失败:", error);
    return null;
  }
}

/**
 * 记录调用历史到JSON文件
 * @param {Object} record 记录信息
 */
async function recordHistory(record) {
  try {
    const { v4: uuidv4 } = require("uuid");
    const completeRecord = {
      id: uuidv4(),
      ...record,
    };
    await DatabaseService.saveImageHistory(completeRecord);
  } catch (error) {
    console.error("记录历史记录失败:", error);
  }
}

/**
 * 分类识别接口
 * POST /classifyOcr
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("文件分类接口");
    console.log(req.body);
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "请上传图片地址" });
    }

    // 检查历史记录
    const imageUrl = req.body.imageUrl;
    let fileMd5 = "";

    // 不管是本地文件路径，还是网络文件路径，都计算MD5
    try {
      let localFilePath = imageUrl;
      
      // 如果是网络文件，先下载到临时目录
      if (imageUrl.startsWith("http")) {
        const path = require("path");
        const axios = require("axios");
        const stream = require("stream");
        const util = require("util");
        const pipeline = util.promisify(stream.pipeline);
        
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }
        
        // 解析文件名
        const urlObj = new URL(imageUrl);
        let fileName = urlObj.searchParams.get("fullfilename");
        if (!fileName) {
          const arr = imageUrl.split("/");
          fileName = arr[arr.length - 1];
        }
        
        localFilePath = path.join(tempDir, fileName);
        
        // 下载文件
        const response = await axios({
          method: "get",
          url: imageUrl,
          responseType: "stream",
        });
        
        await pipeline(response.data, fs.createWriteStream(localFilePath));
      }
      
      // 计算MD5
      const fileBuffer = fs.readFileSync(localFilePath);
      fileMd5 = require("crypto")
        .createHash("md5")
        .update(fileBuffer)
        .digest("hex");
        
      // 清理临时文件
      if (imageUrl.startsWith("http")) {
        fs.unlinkSync(localFilePath);
      }
      
    } catch (error) {
      console.error("计算文件MD5失败:", error);
    }
    console.log("文件MD5:" + fileMd5);

    // 查找历史记录
    const historyRecord = await findHistory(fileMd5, imageUrl);
    if (historyRecord) {
      console.log("找到历史记录，直接返回结果");
      return res.json({
        bestMatch: historyRecord.modelName,
        allModel: historyRecord.allModel,
        ocrText: historyRecord.ocrText,
        ocrInfo: historyRecord.ocrInfo,
        imgSrc: historyRecord.imgSrc,
        fileMd5: historyRecord.fileMd5,
        fromHistory: true,
        timestamp: historyRecord.timestamp,
      });
    }

    const modelRes = await classifier.classifyImage(req.body.imageUrl);
    console.log("识别结果：" + modelRes.bestMatch);
    const models = await DatabaseService.getAllModels();
    // console.log("全部模型数据：" + JSON.stringify(models))
    const bestModel = models.find(
      (item) => item.modelName == modelRes.bestMatch
    );
    if (modelRes.bestMatch != "未知模型") {
      if (bestModel.moreApi == "GLM-4.1V-Thinking-Flash") {
        // 使用大模型提取结构化数据
        console.log("使用大模型提取结构化数据");
        const response = await callGLMChat(
          req.body.imageUrl,
          bestModel.glmTips
        );
        const info = response.choices[0].message.content;
        console.log("识别结果：" + info);
        modelRes.ocrInfo = JSON.parse(info) || {};
      } if(bestModel.moreApi == "PaddleOCR-VL"){
        // 使用飞桨模型提取结构化数据
        console.log("使用飞桨模型提取结构化数据");
        const response = await callPaddleOCR(
          req.body.imageUrl,
          bestModel.glmTips
        );
        console.log("飞桨模型识别结果：" + response);
        const info = response.result
        console.log("识别结果：" + info);
        modelRes.ocrInfo = JSON.parse(info) || {};
      } else {
        // 暂未支持其他方案
        console.log("暂未支持其他识别方案");
        modelRes.ocrInfo = {
          msg: "暂未支持其他识别方案",
        };
      }
    }

    // 记录调用历史
    await recordHistory({
      imgUrl: req.body.imageUrl,
      imgSrc: modelRes.imgSrc || "",
      fileMd5: modelRes.fileMd5 || fileMd5,
      ocrText: modelRes.ocrText || "",
      ocrInfo: modelRes.ocrInfo || {},
      modelName: modelRes.bestMatch || "",
      allModel: modelRes.allModel || "",
    });

    res.json(modelRes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
